import { Injectable } from '@nestjs/common';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';

@Injectable()
export class RealtyDashboardService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Post-Sales Reconciled Executive KPIs
   * Derived from a single reconciled source so unit counts and financials never drift.
   */
  async getPostSalesDashboard(tenantId: number, siteId?: number) {
    const conditions = [eq(schema.reUnits.tenantId, tenantId)];
    if (siteId) {
      conditions.push(eq(schema.reUnits.siteId, siteId));
    }

    // 1. Reconciled Unit Inventory Statuses
    const allUnits = await this.db.db
      .select({
        id: schema.reUnits.id,
        unitNo: schema.reUnits.unitNo,
        status: schema.reUnits.status,
        baseRate: schema.reUnits.baseRate,
        carpetArea: schema.reUnits.carpetArea,
      })
      .from(schema.reUnits)
      .where(and(...conditions));

    const totalUnits = allUnits.length;
    const availableUnits = allUnits.filter((u) => u.status === 'available').length;
    const heldUnits = allUnits.filter((u) => u.status === 'hold').length;
    const bookedOnlyUnits = allUnits.filter((u) => u.status === 'booked').length;
    const agreementUnits = allUnits.filter((u) => u.status === 'registered').length;
    const registeredUnits = allUnits.filter((u) => u.status === 'registered').length;
    const possessionUnits = allUnits.filter((u) => u.status === 'possession').length;
    const bookedUnits = allUnits.filter((u) => ['booked', 'registered', 'possession'].includes(u.status)).length;
    const blockedUnits = allUnits.filter((u) => u.status === 'blocked').length;

    // 2. Fetch Active Bookings for Financial Reconciliation
    const bookingRows = await this.db.db
      .select({
        id: schema.reBookings.id,
        bookingNo: schema.reBookings.bookingNo,
        status: schema.reBookings.status,
        agreementValue: schema.reBookings.agreementValue,
        grandTotal: schema.reBookings.grandTotalInclGst,
      })
      .from(schema.reBookings)
      .where(
        and(
          eq(schema.reBookings.tenantId, tenantId),
          inArray(schema.reBookings.status, ['booked', 'agreement_done', 'registered', 'possession'])
        )
      );

    const totalBookedValue = bookingRows.reduce(
      (sum, b) => sum + (parseFloat(b.agreementValue || '0') || 0),
      0
    );
    const totalGrandValue = bookingRows.reduce(
      (sum, b) => sum + (parseFloat(b.grandTotal || '0') || 0),
      0
    );

    // 3. Demands & Payment Schedule Financials
    const scheduleRows = await this.db.db
      .select({
        id: schema.rePaymentSchedule.id,
        amount: schema.rePaymentSchedule.amount,
        gstAmt: schema.rePaymentSchedule.gstAmt,
        paidAmount: schema.rePaymentSchedule.paidAmount,
        dueDate: schema.rePaymentSchedule.dueDate,
        status: schema.rePaymentSchedule.status,
      })
      .from(schema.rePaymentSchedule)
      .where(eq(schema.rePaymentSchedule.tenantId, tenantId));

    const now = new Date();
    let totalDemanded = 0;
    let totalCollected = 0;
    let totalOverdue = 0;

    const aging = {
      under30Days: 0,
      days31to60: 0,
      days61to90: 0,
      over90Days: 0,
    };

    scheduleRows.forEach((s) => {
      const basic = parseFloat(s.amount) || 0;
      const gst = parseFloat(s.gstAmt) || 0;
      const stageTotal = basic + gst;
      const paid = parseFloat(s.paidAmount) || 0;

      if (['demanded', 'partly_paid', 'paid', 'overdue'].includes(s.status)) {
        totalDemanded += stageTotal;
      }
      totalCollected += paid;

      const outstandingOnStage = Math.max(0, stageTotal - paid);
      if (s.dueDate && new Date(s.dueDate) < now && outstandingOnStage > 0) {
        totalOverdue += outstandingOnStage;

        const overdueDays = Math.floor((now.getTime() - new Date(s.dueDate).getTime()) / (1000 * 3600 * 24));
        if (overdueDays <= 30) {
          aging.under30Days += outstandingOnStage;
        } else if (overdueDays <= 60) {
          aging.days31to60 += outstandingOnStage;
        } else if (overdueDays <= 90) {
          aging.days61to90 += outstandingOnStage;
        } else {
          aging.over90Days += outstandingOnStage;
        }
      }
    });

    const totalOutstanding = Math.max(0, totalDemanded - totalCollected);
    const collectionEfficiencyPct =
      totalDemanded > 0 ? Math.round((totalCollected / totalDemanded) * 100) : 100;

    // 4. Monthly Collections Trend (Last 6 Months)
    const passedReceipts = await this.db.db
      .select({
        amount: schema.reReceipts.amount,
        receiptDate: schema.reReceipts.receiptDate,
      })
      .from(schema.reReceipts)
      .where(
        and(
          eq(schema.reReceipts.tenantId, tenantId),
          eq(schema.reReceipts.status, 'passed')
        )
      )
      .orderBy(desc(schema.reReceipts.receiptDate));

    const monthlyTrendsMap = new Map<string, { amount: number; count: number }>();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      monthlyTrendsMap.set(key, { amount: 0, count: 0 });
    }

    passedReceipts.forEach((r) => {
      const d = new Date(r.receiptDate);
      const key = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      if (monthlyTrendsMap.has(key)) {
        const item = monthlyTrendsMap.get(key)!;
        item.amount += parseFloat(r.amount) || 0;
        item.count += 1;
      }
    });

    const monthlyRecovery = Array.from(monthlyTrendsMap.entries()).map(([month, val]) => ({
      month,
      amount: Math.round(val.amount),
      count: val.count,
    }));

    const financialsData = {
      totalBookedValue: Math.round(totalBookedValue),
      totalGrandValue: Math.round(totalGrandValue),
      totalDemanded: Math.round(totalDemanded),
      totalCollected: Math.round(totalCollected),
      totalOutstanding: Math.round(totalOutstanding),
      totalOverdue: Math.round(totalOverdue),
      collectionEfficiency: collectionEfficiencyPct,
      collectionEfficiencyPct,
    };

    const agingData = {
      bucket0_30: Math.round(aging.under30Days),
      bucket31_60: Math.round(aging.days31to60),
      bucket61_90: Math.round(aging.days61to90),
      bucket90Plus: Math.round(aging.over90Days),
      total: Math.round(aging.under30Days + aging.days31to60 + aging.days61to90 + aging.over90Days),
      under30Days: Math.round(aging.under30Days),
      days31to60: Math.round(aging.days31to60),
      days61to90: Math.round(aging.days61to90),
      over90Days: Math.round(aging.over90Days),
    };

    const occupancyBreakdown = {
      available: availableUnits,
      hold: heldUnits,
      booked: bookedOnlyUnits,
      agreement: agreementUnits,
      registered: registeredUnits,
      possession: possessionUnits,
      blocked: blockedUnits,
    };

    return {
      summary: {
        totalUnits,
        occupancyBreakdown,
        financials: financialsData,
      },
      inventory: {
        totalUnits,
        availableUnits,
        heldUnits,
        bookedUnits,
        blockedUnits,
        occupancyPct: totalUnits > 0 ? Math.round((bookedUnits / totalUnits) * 100) : 0,
      },
      financials: financialsData,
      aging: agingData,
      monthlyRecovery,
      monthlyCollections: monthlyRecovery,
    };
  }
}
