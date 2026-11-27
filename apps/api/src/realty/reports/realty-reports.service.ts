import { Injectable } from '@nestjs/common';
import { eq, and, desc, asc, inArray, gte, lte } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';

export interface ReportFilterDto {
  siteId?: number | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  status?: string | undefined;
  wingId?: number | undefined;
  search?: string | undefined;
}

@Injectable()
export class RealtyReportsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * 1. Collection Report
   * Grouped and aggregated collections by payment mode and date range.
   */
  async getCollectionReport(tenantId: number, filters: ReportFilterDto) {
    const conditions = [eq(schema.reReceipts.tenantId, tenantId)];
    if (filters.status) {
      conditions.push(eq(schema.reReceipts.status, filters.status as any));
    } else {
      conditions.push(inArray(schema.reReceipts.status, ['passed', 'pending_approval']));
    }
    if (filters.fromDate) {
      conditions.push(gte(schema.reReceipts.receiptDate, new Date(filters.fromDate)));
    }
    if (filters.toDate) {
      conditions.push(lte(schema.reReceipts.receiptDate, new Date(filters.toDate)));
    }

    const receipts = await this.db.db
      .select({
        id: schema.reReceipts.id,
        receiptNo: schema.reReceipts.receiptNo,
        bookingId: schema.reReceipts.bookingId,
        receiptDate: schema.reReceipts.receiptDate,
        amount: schema.reReceipts.amount,
        mode: schema.reReceipts.mode,
        instrumentNo: schema.reReceipts.instrumentNo,
        drawnOnBank: schema.reReceipts.drawnOnBank,
        status: schema.reReceipts.status,
        tdsApplicable: schema.reReceipts.tdsApplicable,
        tdsAmount: schema.reReceipts.tdsAmount,
        bookingNo: schema.reBookings.bookingNo,
        unitId: schema.reBookings.unitId,
      })
      .from(schema.reReceipts)
      .leftJoin(schema.reBookings, eq(schema.reReceipts.bookingId, schema.reBookings.id))
      .where(and(...conditions))
      .orderBy(desc(schema.reReceipts.receiptDate));

    const unitIds = Array.from(new Set(receipts.map((r) => r.unitId).filter((id): id is number => id !== null)));
    const bookingIds = Array.from(new Set(receipts.map((r) => r.bookingId)));

    const units = unitIds.length > 0
      ? await this.db.db
          .select({ id: schema.reUnits.id, unitNo: schema.reUnits.unitNo, siteId: schema.reUnits.siteId })
          .from(schema.reUnits)
          .where(inArray(schema.reUnits.id, unitIds))
      : [];
    const unitMap = new Map(units.map((u) => [u.id, u.unitNo]));
    const unitSiteMap = new Map(units.map((u) => [u.id, u.siteId]));

    // Filter by siteId if specified
    const filteredReceipts = filters.siteId
      ? receipts.filter((r) => r.unitId && unitSiteMap.get(r.unitId) === filters.siteId)
      : receipts;

    const applicants = bookingIds.length > 0
      ? await this.db.db
          .select({
            bookingId: schema.reBookingApplicants.bookingId,
            firstName: schema.reBookingApplicants.firstName,
            lastName: schema.reBookingApplicants.lastName,
            type: schema.reBookingApplicants.type,
          })
          .from(schema.reBookingApplicants)
          .where(
            and(
              inArray(schema.reBookingApplicants.bookingId, bookingIds),
              eq(schema.reBookingApplicants.type, 'primary')
            )
          )
      : [];
    const applicantMap = new Map(applicants.map((a) => [a.bookingId, `${a.firstName} ${a.lastName}`.trim()]));

    let totalAmount = 0;
    let totalTds = 0;
    const modeBreakdown: Record<string, { count: number; total: number }> = {};

    const rows = filteredReceipts.map((r) => {
      const amt = Number(r.amount) || 0;
      const tds = Number(r.tdsAmount) || 0;
      totalAmount += amt;
      totalTds += tds;

      const mode = r.mode || 'other';
      if (!modeBreakdown[mode]) {
        modeBreakdown[mode] = { count: 0, total: 0 };
      }
      modeBreakdown[mode].count += 1;
      modeBreakdown[mode].total += amt;

      return {
        id: r.id,
        receiptNo: r.receiptNo,
        bookingNo: r.bookingNo || '-',
        unitNo: r.unitId ? (unitMap.get(r.unitId) || '-') : '-',
        customerName: applicantMap.get(r.bookingId) || 'Valued Customer',
        receiptDate: r.receiptDate ? new Date(r.receiptDate).toISOString().split('T')[0] : '-',
        amount: amt,
        tdsAmount: tds,
        netReceived: amt - tds,
        mode: r.mode,
        instrumentNo: r.instrumentNo || '-',
        drawnOnBank: r.drawnOnBank || '-',
        status: r.status,
      };
    });

    return {
      summary: {
        totalReceipts: rows.length,
        totalAmount,
        totalTds,
        netCollected: totalAmount - totalTds,
        modeBreakdown,
      },
      rows,
    };
  }

  /**
   * 2. Outstanding & Aging Report
   * Aging buckets: 0-30 days, 31-60 days, 61-90 days, 90+ days.
   */
  async getOutstandingAgingReport(tenantId: number, filters: ReportFilterDto) {
    const conditions = [
      eq(schema.reDemands.tenantId, tenantId),
      inArray(schema.reDemands.status, ['draft', 'sent']),
    ];

    const demands = await this.db.db
      .select({
        id: schema.reDemands.id,
        demandNo: schema.reDemands.demandNo,
        bookingId: schema.reDemands.bookingId,
        payStageId: schema.reDemands.payStageId,
        demandDate: schema.reDemands.demandDate,
        dueDate: schema.reDemands.dueDate,
        principal: schema.reDemands.principal,
        gst: schema.reDemands.gst,
        total: schema.reDemands.total,
        status: schema.reDemands.status,
        bookingNo: schema.reBookings.bookingNo,
        unitId: schema.reBookings.unitId,
      })
      .from(schema.reDemands)
      .leftJoin(schema.reBookings, eq(schema.reDemands.bookingId, schema.reBookings.id))
      .where(and(...conditions))
      .orderBy(asc(schema.reDemands.dueDate));

    const unitIds = Array.from(new Set(demands.map((d) => d.unitId).filter((id): id is number => id !== null)));
    const bookingIds = Array.from(new Set(demands.map((d) => d.bookingId)));

    const units = unitIds.length > 0
      ? await this.db.db
          .select({
            id: schema.reUnits.id,
            unitNo: schema.reUnits.unitNo,
            wingId: schema.reUnits.wingId,
            siteId: schema.reUnits.siteId,
          })
          .from(schema.reUnits)
          .where(inArray(schema.reUnits.id, unitIds))
      : [];
    const unitMap = new Map(units.map((u) => [u.id, u.unitNo]));
    const unitSiteMap = new Map(units.map((u) => [u.id, u.siteId]));

    const filteredDemands = filters.siteId
      ? demands.filter((d) => d.unitId && unitSiteMap.get(d.unitId) === filters.siteId)
      : demands;

    const applicants = bookingIds.length > 0
      ? await this.db.db
          .select({
            bookingId: schema.reBookingApplicants.bookingId,
            firstName: schema.reBookingApplicants.firstName,
            lastName: schema.reBookingApplicants.lastName,
            mobile: schema.reBookingApplicants.mobile,
          })
          .from(schema.reBookingApplicants)
          .where(
            and(
              inArray(schema.reBookingApplicants.bookingId, bookingIds),
              eq(schema.reBookingApplicants.type, 'primary')
            )
          )
      : [];
    const applicantMap = new Map(
      applicants.map((a) => [a.bookingId, { name: `${a.firstName} ${a.lastName}`.trim(), mobile: a.mobile }])
    );

    const now = new Date();
    let totalOutstanding = 0;
    const agingSummary = {
      bucket0_30: 0,
      bucket31_60: 0,
      bucket61_90: 0,
      bucket90Plus: 0,
    };

    const rows = filteredDemands.map((d) => {
      const total = Number(d.total) || 0;
      const balance = total;
      totalOutstanding += balance;

      const due = d.dueDate ? new Date(d.dueDate) : now;
      const diffDays = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));

      let bucket = '0-30';
      if (diffDays > 90) {
        bucket = '90+';
        agingSummary.bucket90Plus += balance;
      } else if (diffDays > 60) {
        bucket = '61-90';
        agingSummary.bucket61_90 += balance;
      } else if (diffDays > 30) {
        bucket = '31-60';
        agingSummary.bucket31_60 += balance;
      } else {
        agingSummary.bucket0_30 += balance;
      }

      const applicant = applicantMap.get(d.bookingId);

      return {
        id: d.id,
        demandNo: d.demandNo,
        bookingNo: d.bookingNo || '-',
        unitNo: d.unitId ? (unitMap.get(d.unitId) || '-') : '-',
        customerName: applicant?.name || 'Customer',
        mobile: applicant?.mobile || '-',
        demandDate: d.demandDate ? new Date(d.demandDate).toISOString().split('T')[0] : '-',
        dueDate: d.dueDate ? new Date(d.dueDate).toISOString().split('T')[0] : '-',
        daysOverdue: diffDays,
        bucket,
        totalAmount: total,
        paidAmount: 0,
        balanceOutstanding: balance,
        status: d.status,
      };
    });

    return {
      summary: {
        totalDemands: rows.length,
        totalOutstanding,
        agingSummary,
      },
      rows,
    };
  }

  /**
   * 3. Demand vs Collection Report
   * Grouped by construction stages.
   */
  async getDemandVsCollectionReport(tenantId: number, filters: ReportFilterDto) {
    const stageConditions = [eq(schema.rePayStages.tenantId, tenantId)];
    if (filters.siteId) {
      stageConditions.push(eq(schema.rePayStages.siteId, filters.siteId));
    }

    const stages = await this.db.db
      .select({
        id: schema.rePayStages.id,
        name: schema.rePayStages.name,
        sequence: schema.rePayStages.sequence,
        defaultPct: schema.rePayStages.defaultPct,
        status: schema.rePayStages.status,
        completedOn: schema.rePayStages.completedOn,
      })
      .from(schema.rePayStages)
      .where(and(...stageConditions))
      .orderBy(asc(schema.rePayStages.sequence));

    const demandConditions = [eq(schema.reDemands.tenantId, tenantId)];

    const demands = await this.db.db
      .select({
        id: schema.reDemands.id,
        payStageId: schema.reDemands.payStageId,
        total: schema.reDemands.total,
        status: schema.reDemands.status,
      })
      .from(schema.reDemands)
      .where(and(...demandConditions));

    let overallDemanded = 0;
    let overallCollected = 0;

    const rows = stages.map((s) => {
      const stageDemands = demands.filter((d) => d.payStageId === s.id);
      const totalDemanded = stageDemands.reduce((sum, d) => sum + (Number(d.total) || 0), 0);
      const paidDemands = stageDemands.filter((d) => d.status === 'paid');
      const totalCollected = paidDemands.reduce((sum, d) => sum + (Number(d.total) || 0), 0);
      const balance = Math.max(0, totalDemanded - totalCollected);
      const collectionPct = totalDemanded > 0 ? Math.round((totalCollected / totalDemanded) * 100) : 0;

      overallDemanded += totalDemanded;
      overallCollected += totalCollected;

      return {
        stageId: s.id,
        stageName: s.name,
        stageOrder: s.sequence,
        defaultPercentage: s.defaultPct,
        status: s.status,
        completedAt: s.completedOn ? new Date(s.completedOn).toISOString().split('T')[0] : null,
        demandsCount: stageDemands.length,
        totalDemanded,
        totalCollected,
        balanceOutstanding: balance,
        collectionPercentage: collectionPct,
      };
    });

    const overallPct = overallDemanded > 0 ? Math.round((overallCollected / overallDemanded) * 100) : 0;

    return {
      summary: {
        totalStages: stages.length,
        overallDemanded,
        overallCollected,
        overallOutstanding: overallDemanded - overallCollected,
        overallCollectionPercentage: overallPct,
      },
      rows,
    };
  }

  /**
   * 4. Receipt Register
   */
  async getReceiptRegister(tenantId: number, filters: ReportFilterDto) {
    const conditions = [eq(schema.reReceipts.tenantId, tenantId)];
    if (filters.status) {
      conditions.push(eq(schema.reReceipts.status, filters.status as any));
    }
    if (filters.fromDate) {
      conditions.push(gte(schema.reReceipts.receiptDate, new Date(filters.fromDate)));
    }
    if (filters.toDate) {
      conditions.push(lte(schema.reReceipts.receiptDate, new Date(filters.toDate)));
    }

    const receipts = await this.db.db
      .select({
        id: schema.reReceipts.id,
        receiptNo: schema.reReceipts.receiptNo,
        bookingId: schema.reReceipts.bookingId,
        receiptDate: schema.reReceipts.receiptDate,
        amount: schema.reReceipts.amount,
        mode: schema.reReceipts.mode,
        instrumentNo: schema.reReceipts.instrumentNo,
        instrumentDate: schema.reReceipts.instrumentDate,
        drawnOnBank: schema.reReceipts.drawnOnBank,
        status: schema.reReceipts.status,
        tdsApplicable: schema.reReceipts.tdsApplicable,
        tdsAmount: schema.reReceipts.tdsAmount,
        narration: schema.reReceipts.narration,
        bookingNo: schema.reBookings.bookingNo,
        unitId: schema.reBookings.unitId,
      })
      .from(schema.reReceipts)
      .leftJoin(schema.reBookings, eq(schema.reReceipts.bookingId, schema.reBookings.id))
      .where(and(...conditions))
      .orderBy(desc(schema.reReceipts.id));

    const unitIds = Array.from(new Set(receipts.map((r) => r.unitId).filter((id): id is number => id !== null)));
    const bookingIds = Array.from(new Set(receipts.map((r) => r.bookingId)));

    const units = unitIds.length > 0
      ? await this.db.db
          .select({ id: schema.reUnits.id, unitNo: schema.reUnits.unitNo, siteId: schema.reUnits.siteId })
          .from(schema.reUnits)
          .where(inArray(schema.reUnits.id, unitIds))
      : [];
    const unitMap = new Map(units.map((u) => [u.id, u.unitNo]));
    const unitSiteMap = new Map(units.map((u) => [u.id, u.siteId]));

    const filteredReceipts = filters.siteId
      ? receipts.filter((r) => r.unitId && unitSiteMap.get(r.unitId) === filters.siteId)
      : receipts;

    const applicants = bookingIds.length > 0
      ? await this.db.db
          .select({
            bookingId: schema.reBookingApplicants.bookingId,
            firstName: schema.reBookingApplicants.firstName,
            lastName: schema.reBookingApplicants.lastName,
          })
          .from(schema.reBookingApplicants)
          .where(
            and(
              inArray(schema.reBookingApplicants.bookingId, bookingIds),
              eq(schema.reBookingApplicants.type, 'primary')
            )
          )
      : [];
    const applicantMap = new Map(applicants.map((a) => [a.bookingId, `${a.firstName} ${a.lastName}`.trim()]));

    let totalAmount = 0;
    let totalTds = 0;

    const rows = filteredReceipts.map((r) => {
      const amt = Number(r.amount) || 0;
      const tds = Number(r.tdsAmount) || 0;
      totalAmount += amt;
      totalTds += tds;

      return {
        id: r.id,
        receiptNo: r.receiptNo,
        receiptDate: r.receiptDate ? new Date(r.receiptDate).toISOString().split('T')[0] : '-',
        bookingNo: r.bookingNo || '-',
        unitNo: r.unitId ? (unitMap.get(r.unitId) || '-') : '-',
        customerName: applicantMap.get(r.bookingId) || 'Customer',
        amount: amt,
        tdsAmount: tds,
        netReceived: amt - tds,
        mode: r.mode,
        instrumentNo: r.instrumentNo || '-',
        instrumentDate: r.instrumentDate ? new Date(r.instrumentDate).toISOString().split('T')[0] : '-',
        drawnOnBank: r.drawnOnBank || '-',
        status: r.status,
        narration: r.narration || '-',
      };
    });

    return {
      summary: {
        totalReceipts: rows.length,
        totalAmount,
        totalTds,
        netReceived: totalAmount - totalTds,
      },
      rows,
    };
  }

  /**
   * 5. Flat Status Register
   * Comprehensive unit inventory and financial registry.
   */
  async getFlatStatusRegister(tenantId: number, filters: ReportFilterDto) {
    const conditions = [eq(schema.reUnits.tenantId, tenantId)];
    if (filters.siteId) {
      conditions.push(eq(schema.reUnits.siteId, filters.siteId));
    }
    if (filters.wingId) {
      conditions.push(eq(schema.reUnits.wingId, filters.wingId));
    }
    if (filters.status) {
      conditions.push(eq(schema.reUnits.status, filters.status as any));
    }

    const units = await this.db.db
      .select({
        id: schema.reUnits.id,
        unitNo: schema.reUnits.unitNo,
        wingId: schema.reUnits.wingId,
        floorId: schema.reUnits.floorId,
        unitTypeId: schema.reUnits.unitTypeId,
        carpetArea: schema.reUnits.carpetArea,
        superBuiltupArea: schema.reUnits.saleableArea,
        baseRate: schema.reUnits.baseRate,
        status: schema.reUnits.status,
      })
      .from(schema.reUnits)
      .where(and(...conditions))
      .orderBy(asc(schema.reUnits.unitNo));

    const wingIds = Array.from(new Set(units.map((u) => u.wingId).filter((id): id is number => id !== null)));
    const typeIds = Array.from(new Set(units.map((u) => u.unitTypeId).filter((id): id is number => id !== null)));
    const unitIds = units.map((u) => u.id);

    const wings = wingIds.length > 0
      ? await this.db.db
          .select({ id: schema.reWings.id, name: schema.reWings.name })
          .from(schema.reWings)
          .where(inArray(schema.reWings.id, wingIds))
      : [];
    const wingMap = new Map(wings.map((w) => [w.id, w.name]));

    const unitTypes = typeIds.length > 0
      ? await this.db.db
          .select({ id: schema.reUnitTypes.id, name: schema.reUnitTypes.name })
          .from(schema.reUnitTypes)
          .where(inArray(schema.reUnitTypes.id, typeIds))
      : [];
    const typeMap = new Map(unitTypes.map((t) => [t.id, t.name]));

    const bookings = unitIds.length > 0
      ? await this.db.db
          .select({
            id: schema.reBookings.id,
            bookingNo: schema.reBookings.bookingNo,
            unitId: schema.reBookings.unitId,
            agreementValue: schema.reBookings.agreementValue,
            grandTotal: schema.reBookings.grandTotalInclGst,
            bookingStatus: schema.reBookings.status,
          })
          .from(schema.reBookings)
          .where(
            and(
              inArray(schema.reBookings.unitId, unitIds),
              inArray(schema.reBookings.status, ['booked', 'agreement_done', 'registered', 'pending_approval'])
            )
          )
      : [];
    const bookingByUnit = new Map(bookings.map((b) => [b.unitId, b]));

    const bookingIds = bookings.map((b) => b.id);
    const applicants = bookingIds.length > 0
      ? await this.db.db
          .select({
            bookingId: schema.reBookingApplicants.bookingId,
            firstName: schema.reBookingApplicants.firstName,
            lastName: schema.reBookingApplicants.lastName,
          })
          .from(schema.reBookingApplicants)
          .where(
            and(
              inArray(schema.reBookingApplicants.bookingId, bookingIds),
              eq(schema.reBookingApplicants.type, 'primary')
            )
          )
      : [];
    const applicantMap = new Map(applicants.map((a) => [a.bookingId, `${a.firstName} ${a.lastName}`.trim()]));

    const demands = bookingIds.length > 0
      ? await this.db.db
          .select({
            bookingId: schema.reDemands.bookingId,
            total: schema.reDemands.total,
            status: schema.reDemands.status,
          })
          .from(schema.reDemands)
          .where(inArray(schema.reDemands.bookingId, bookingIds))
      : [];

    const demandTotals = new Map<number, { demanded: number; collected: number }>();
    for (const d of demands) {
      const curr = demandTotals.get(d.bookingId) || { demanded: 0, collected: 0 };
      const tot = Number(d.total) || 0;
      curr.demanded += tot;
      if (d.status === 'paid') curr.collected += tot;
      demandTotals.set(d.bookingId, curr);
    }

    const rows = units.map((u) => {
      const b = bookingByUnit.get(u.id);
      const customer = b ? (applicantMap.get(b.id) || 'Valued Buyer') : '-';
      const dTotals = b ? (demandTotals.get(b.id) || { demanded: 0, collected: 0 }) : { demanded: 0, collected: 0 };
      const agreementVal = b ? (Number(b.agreementValue) || 0) : 0;
      const balanceDue = Math.max(0, dTotals.demanded - dTotals.collected);

      return {
        unitId: u.id,
        unitNo: u.unitNo,
        wing: u.wingId ? (wingMap.get(u.wingId) || '-') : '-',
        unitType: u.unitTypeId ? (typeMap.get(u.unitTypeId) || '-') : '-',
        carpetArea: Number(u.carpetArea) || 0,
        superBuiltupArea: Number(u.superBuiltupArea) || 0,
        baseRate: Number(u.baseRate) || 0,
        status: u.status,
        bookingNo: b?.bookingNo || '-',
        bookingStatus: b?.bookingStatus || '-',
        customerName: customer,
        agreementValue: agreementVal,
        totalDemanded: dTotals.demanded,
        totalCollected: dTotals.collected,
        balanceDue,
      };
    });

    const statusCounts: Record<string, number> = {};
    for (const r of rows) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }

    return {
      summary: {
        totalUnits: rows.length,
        statusCounts,
      },
      rows,
    };
  }

  /**
   * 6. Customer Directory
   */
  async getCustomerDirectory(tenantId: number, filters: ReportFilterDto) {
    const conditions = [
      eq(schema.reBookings.tenantId, tenantId),
      inArray(schema.reBookings.status, ['booked', 'agreement_done', 'registered', 'pending_approval']),
    ];

    const bookings = await this.db.db
      .select({
        id: schema.reBookings.id,
        bookingNo: schema.reBookings.bookingNo,
        bookingDate: schema.reBookings.bookingDate,
        status: schema.reBookings.status,
        agreementValue: schema.reBookings.agreementValue,
        grandTotal: schema.reBookings.grandTotalInclGst,
        unitId: schema.reBookings.unitId,
      })
      .from(schema.reBookings)
      .where(and(...conditions))
      .orderBy(desc(schema.reBookings.bookingDate));

    const bookingIds = bookings.map((b) => b.id);
    const unitIds = bookings.map((b) => b.unitId);

    const units = unitIds.length > 0
      ? await this.db.db
          .select({
            id: schema.reUnits.id,
            unitNo: schema.reUnits.unitNo,
            wingId: schema.reUnits.wingId,
            siteId: schema.reUnits.siteId,
          })
          .from(schema.reUnits)
          .where(inArray(schema.reUnits.id, unitIds))
      : [];
    const unitMap = new Map(units.map((u) => [u.id, u.unitNo]));
    const unitSiteMap = new Map(units.map((u) => [u.id, u.siteId]));

    const filteredBookings = filters.siteId
      ? bookings.filter((b) => unitSiteMap.get(b.unitId) === filters.siteId)
      : bookings;

    const applicants = bookingIds.length > 0
      ? await this.db.db
          .select({
            bookingId: schema.reBookingApplicants.bookingId,
            firstName: schema.reBookingApplicants.firstName,
            lastName: schema.reBookingApplicants.lastName,
            email: schema.reBookingApplicants.email,
            mobile: schema.reBookingApplicants.mobile,
            pan: schema.reBookingApplicants.pan,
            city: schema.reBookingApplicants.city,
            type: schema.reBookingApplicants.type,
          })
          .from(schema.reBookingApplicants)
          .where(
            and(
              inArray(schema.reBookingApplicants.bookingId, bookingIds),
              eq(schema.reBookingApplicants.type, 'primary')
            )
          )
      : [];
    const applicantMap = new Map(applicants.map((a) => [a.bookingId, a]));

    const rows = filteredBookings.map((b) => {
      const app = applicantMap.get(b.id);
      return {
        bookingId: b.id,
        bookingNo: b.bookingNo,
        bookingDate: b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0] : '-',
        status: b.status,
        unitNo: unitMap.get(b.unitId) || '-',
        customerName: app ? `${app.firstName} ${app.lastName}`.trim() : 'Customer',
        mobile: app?.mobile || '-',
        email: app?.email || '-',
        pan: app?.pan || '-',
        city: app?.city || '-',
        agreementValue: Number(b.agreementValue) || 0,
        totalCost: Number(b.grandTotal) || 0,
      };
    });

    return {
      summary: {
        totalCustomers: rows.length,
      },
      rows,
    };
  }

  /**
   * 7. Section 194-IA TDS Reconciliation Report
   * Applicable when agreement value >= ₹50,00,000.
   */
  async getTdsReconciliationReport(tenantId: number, filters: ReportFilterDto) {
    const conditions = [
      eq(schema.reBookings.tenantId, tenantId),
      inArray(schema.reBookings.status, ['booked', 'agreement_done', 'registered']),
      gte(schema.reBookings.agreementValue, '5000000'),
    ];

    const bookings = await this.db.db
      .select({
        id: schema.reBookings.id,
        bookingNo: schema.reBookings.bookingNo,
        bookingDate: schema.reBookings.bookingDate,
        agreementValue: schema.reBookings.agreementValue,
        unitId: schema.reBookings.unitId,
      })
      .from(schema.reBookings)
      .where(and(...conditions));

    const bookingIds = bookings.map((b) => b.id);
    const unitIds = bookings.map((b) => b.unitId);

    const units = unitIds.length > 0
      ? await this.db.db
          .select({ id: schema.reUnits.id, unitNo: schema.reUnits.unitNo, siteId: schema.reUnits.siteId })
          .from(schema.reUnits)
          .where(inArray(schema.reUnits.id, unitIds))
      : [];
    const unitMap = new Map(units.map((u) => [u.id, u.unitNo]));
    const unitSiteMap = new Map(units.map((u) => [u.id, u.siteId]));

    const filteredBookings = filters.siteId
      ? bookings.filter((b) => unitSiteMap.get(b.unitId) === filters.siteId)
      : bookings;

    const applicants = bookingIds.length > 0
      ? await this.db.db
          .select({
            bookingId: schema.reBookingApplicants.bookingId,
            firstName: schema.reBookingApplicants.firstName,
            lastName: schema.reBookingApplicants.lastName,
            pan: schema.reBookingApplicants.pan,
          })
          .from(schema.reBookingApplicants)
          .where(
            and(
              inArray(schema.reBookingApplicants.bookingId, bookingIds),
              eq(schema.reBookingApplicants.type, 'primary')
            )
          )
      : [];
    const applicantMap = new Map(applicants.map((a) => [a.bookingId, a]));

    const receipts = bookingIds.length > 0
      ? await this.db.db
          .select({
            bookingId: schema.reReceipts.bookingId,
            amount: schema.reReceipts.amount,
            tdsApplicable: schema.reReceipts.tdsApplicable,
            tdsAmount: schema.reReceipts.tdsAmount,
            status: schema.reReceipts.status,
          })
          .from(schema.reReceipts)
          .where(
            and(
              inArray(schema.reReceipts.bookingId, bookingIds),
              inArray(schema.reReceipts.status, ['passed', 'pending_approval'])
            )
          )
      : [];

    const receiptsByBooking = new Map<number, { totalPaid: number; totalTds: number }>();
    for (const r of receipts) {
      const curr = receiptsByBooking.get(r.bookingId) || { totalPaid: 0, totalTds: 0 };
      curr.totalPaid += Number(r.amount) || 0;
      curr.totalTds += Number(r.tdsAmount) || 0;
      receiptsByBooking.set(r.bookingId, curr);
    }

    let overallTdsDue = 0;
    let overallTdsDeposited = 0;

    const rows = filteredBookings.map((b) => {
      const app = applicantMap.get(b.id);
      const rData = receiptsByBooking.get(b.id) || { totalPaid: 0, totalTds: 0 };
      const agreementVal = Number(b.agreementValue) || 0;
      const totalTdsLiability = Math.round(agreementVal * 0.01);
      const tdsDeposited = rData.totalTds;
      const pendingTds = Math.max(0, totalTdsLiability - tdsDeposited);

      overallTdsDue += totalTdsLiability;
      overallTdsDeposited += tdsDeposited;

      return {
        bookingId: b.id,
        bookingNo: b.bookingNo,
        unitNo: unitMap.get(b.unitId) || '-',
        customerName: app ? `${app.firstName} ${app.lastName}`.trim() : 'Customer',
        pan: app?.pan || '-',
        agreementValue: agreementVal,
        totalTdsLiability,
        tdsDeposited,
        pendingTds,
        complianceStatus: pendingTds === 0 ? 'Compliant' : 'Pending Form 16B',
      };
    });

    return {
      summary: {
        totalEligibleBookings: rows.length,
        overallTdsDue,
        overallTdsDeposited,
        overallPendingTds: Math.max(0, overallTdsDue - overallTdsDeposited),
      },
      rows,
    };
  }

  /**
   * 8. GST Summary Report
   */
  async getGstReport(tenantId: number, filters: ReportFilterDto) {
    const demandConditions = [eq(schema.reDemands.tenantId, tenantId)];
    if (filters.fromDate) {
      demandConditions.push(gte(schema.reDemands.demandDate, new Date(filters.fromDate)));
    }
    if (filters.toDate) {
      demandConditions.push(lte(schema.reDemands.demandDate, new Date(filters.toDate)));
    }

    const demands = await this.db.db
      .select({
        id: schema.reDemands.id,
        demandNo: schema.reDemands.demandNo,
        demandDate: schema.reDemands.demandDate,
        principal: schema.reDemands.principal,
        gst: schema.reDemands.gst,
        total: schema.reDemands.total,
      })
      .from(schema.reDemands)
      .where(and(...demandConditions));

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalGst = 0;

    const rows = demands.map((d) => {
      const taxable = Number(d.principal) || 0;
      const gst = Number(d.gst) || 0;
      const cgst = Math.round(gst / 2);
      const sgst = gst - cgst;

      totalTaxable += taxable;
      totalCgst += cgst;
      totalSgst += sgst;
      totalGst += gst;

      return {
        demandId: d.id,
        demandNo: d.demandNo,
        demandDate: d.demandDate ? new Date(d.demandDate).toISOString().split('T')[0] : '-',
        taxableAmount: taxable,
        cgst,
        sgst,
        totalGst: gst,
        grossAmount: Number(d.total) || (taxable + gst),
      };
    });

    return {
      summary: {
        totalInvoices: rows.length,
        totalTaxable,
        totalCgst,
        totalSgst,
        totalGst,
        totalGross: totalTaxable + totalGst,
      },
      rows,
    };
  }

  /**
   * 9. Cancellations & Transfers Report
   */
  async getCancellationsReport(tenantId: number, _filters: ReportFilterDto) {
    const cancelConditions = [eq(schema.reCancellations.tenantId, tenantId)];

    const cancellations = await this.db.db
      .select({
        id: schema.reCancellations.id,
        cancellationNo: schema.reCancellations.cancellationNo,
        bookingId: schema.reCancellations.bookingId,
        createdAt: schema.reCancellations.createdAt,
        cancellationCharges: schema.reCancellations.cancellationCharges,
        refundAmount: schema.reCancellations.refundAmount,
        refundStatus: schema.reCancellations.refundStatus,
      })
      .from(schema.reCancellations)
      .where(and(...cancelConditions))
      .orderBy(desc(schema.reCancellations.id));

    const rows = cancellations.map((c) => ({
      id: c.id,
      cancellationNo: c.cancellationNo,
      bookingId: c.bookingId,
      cancellationDate: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '-',
      totalPaid: Number(c.refundAmount || 0) + Number(c.cancellationCharges || 0),
      forfeitureAmount: Number(c.cancellationCharges || 0),
      refundAmount: Number(c.refundAmount || 0),
      refundStatus: c.refundStatus,
      reason: 'Surrender of allotment',
    }));

    return {
      summary: {
        totalCancelled: rows.length,
        totalForfeited: rows.reduce((sum, c) => sum + c.forfeitureAmount, 0),
        totalRefundDue: rows.reduce((sum, c) => sum + c.refundAmount, 0),
      },
      rows,
    };
  }

  /**
   * 10. Parking Inventory Report
   */
  async getParkingInventoryReport(tenantId: number, filters: ReportFilterDto) {
    const conditions = [eq(schema.reParkingSlots.tenantId, tenantId)];
    if (filters.siteId) {
      conditions.push(eq(schema.reParkingSlots.siteId, filters.siteId));
    }

    const slots = await this.db.db
      .select({
        id: schema.reParkingSlots.id,
        slotNo: schema.reParkingSlots.slotNo,
        type: schema.reParkingSlots.type,
        status: schema.reParkingSlots.status,
      })
      .from(schema.reParkingSlots)
      .where(and(...conditions))
      .orderBy(asc(schema.reParkingSlots.slotNo));

    const statusCounts: Record<string, number> = {};
    for (const s of slots) {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    }

    return {
      summary: {
        totalSlots: slots.length,
        statusCounts,
      },
      rows: slots,
    };
  }
}
