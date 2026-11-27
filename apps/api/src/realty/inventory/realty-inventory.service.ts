import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, sql, desc, inArray, lt } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { RealtyPricingService } from '../common/pricing.service';
import { randomUUID } from 'crypto';

@Injectable()
export class RealtyInventoryService {
  constructor(
    private readonly db: DatabaseService,
    private readonly pricingService: RealtyPricingService
  ) {}

  // ════════════════════════════════════════════════════════════════════════════
  // 1. INVENTORY GRID & ELEVATION
  // ════════════════════════════════════════════════════════════════════════════

  async getInventoryGrid(
    tenantId: number,
    siteId: number,
    filters?: {
      wingId?: number | undefined;
      unitTypeId?: number | undefined;
      status?: string | undefined;
      facing?: string | undefined;
    }
  ) {
    // 1. Fetch Wings for the Site
    const wings = await this.db.db
      .select({
        id: schema.reWings.id,
        name: schema.reWings.name,
        totalFloors: schema.reWings.totalFloors,
        phaseId: schema.reWings.phaseId,
        phaseName: schema.rePhases.name,
      })
      .from(schema.reWings)
      .innerJoin(schema.rePhases, eq(schema.reWings.phaseId, schema.rePhases.id))
      .where(
        and(
          eq(schema.reWings.tenantId, tenantId),
          eq(schema.rePhases.siteId, siteId)
        )
      );

    if (wings.length === 0) {
      return {
        wings: [],
        counts: { total: 0, available: 0, hold: 0, blocked: 0, booked: 0, registered: 0 },
        units: [],
      };
    }

    const targetWingId = filters?.wingId || wings[0]?.id;

    // 2. Fetch Floors for the Selected Wing (ordered by levelNo DESC so top floor comes first)
    const floors = await this.db.db
      .select()
      .from(schema.reFloors)
      .where(
        and(
          eq(schema.reFloors.tenantId, tenantId),
          targetWingId ? eq(schema.reFloors.wingId, targetWingId) : sql`1=1`
        )
      )
      .orderBy(desc(schema.reFloors.levelNo));

    // 3. Fetch Units for the Selected Wing
    const conditions = [
      eq(schema.reUnits.tenantId, tenantId),
      eq(schema.reUnits.siteId, siteId),
    ];
    if (targetWingId) {
      conditions.push(eq(schema.reUnits.wingId, targetWingId));
    }
    if (filters?.unitTypeId) {
      conditions.push(eq(schema.reUnits.unitTypeId, filters.unitTypeId));
    }
    if (filters?.status) {
      conditions.push(eq(schema.reUnits.status, filters.status as any));
    }
    if (filters?.facing) {
      conditions.push(eq(schema.reUnits.facing, filters.facing as any));
    }

    const units = await this.db.db
      .select({
        id: schema.reUnits.id,
        uuid: schema.reUnits.uuid,
        siteId: schema.reUnits.siteId,
        wingId: schema.reUnits.wingId,
        floorId: schema.reUnits.floorId,
        unitNo: schema.reUnits.unitNo,
        unitTypeId: schema.reUnits.unitTypeId,
        unitTypeCode: schema.reUnitTypes.code,
        unitTypeName: schema.reUnitTypes.name,
        category: schema.reUnitTypes.category,
        carpetArea: schema.reUnits.carpetArea,
        balconyArea: schema.reUnits.balconyArea,
        terraceArea: schema.reUnits.terraceArea,
        saleableArea: schema.reUnits.saleableArea,
        facing: schema.reUnits.facing,
        baseRate: schema.reUnits.baseRate,
        floorRiseRate: schema.reUnits.floorRiseRate,
        plcAmount: schema.reUnits.plcAmount,
        status: schema.reUnits.status,
        holdBy: schema.reUnits.holdBy,
        holdTill: schema.reUnits.holdTill,
        isInvestor: schema.reUnits.isInvestor,
      })
      .from(schema.reUnits)
      .innerJoin(schema.reUnitTypes, eq(schema.reUnits.unitTypeId, schema.reUnitTypes.id))
      .where(and(...conditions))
      .orderBy(schema.reUnits.unitNo);

    // 4. Calculate unit status counts
    const allUnitsForCounts = await this.db.db
      .select({ status: schema.reUnits.status })
      .from(schema.reUnits)
      .where(
        and(
          eq(schema.reUnits.tenantId, tenantId),
          eq(schema.reUnits.siteId, siteId),
          targetWingId ? eq(schema.reUnits.wingId, targetWingId) : sql`1=1`
        )
      );

    const counts = {
      total: allUnitsForCounts.length,
      available: 0,
      hold: 0,
      blocked: 0,
      booked: 0,
      registered: 0,
      other: 0,
    };

    allUnitsForCounts.forEach((u) => {
      if (u.status === 'available') counts.available++;
      else if (u.status === 'hold') counts.hold++;
      else if (u.status === 'blocked') counts.blocked++;
      else if (u.status === 'booked' || u.status === 'agreement') counts.booked++;
      else if (u.status === 'registered' || u.status === 'possession') counts.registered++;
      else counts.other++;
    });

    // 5. Structure Floors with Units for Elevation Display
    const floorElevation = floors.map((fl) => {
      const floorUnits = units.filter((u) => u.floorId === fl.id);
      return {
        ...fl,
        units: floorUnits,
      };
    });

    return {
      wings,
      selectedWingId: targetWingId,
      counts,
      floors: floorElevation,
      allUnits: units,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 2. HOLD, BLOCK, RELEASE ACTIONS + HOLD EXPIRY
  // ════════════════════════════════════════════════════════════════════════════

  async holdUnit(
    tenantId: number,
    unitId: number,
    userId: number,
    dto: { leadId?: number | undefined; holdHours?: number | undefined; remarks?: string | undefined }
  ) {
    const unit = await this.db.db.query.reUnits.findFirst({
      where: and(eq(schema.reUnits.id, unitId), eq(schema.reUnits.tenantId, tenantId)),
    });

    if (!unit) {
      throw new NotFoundException(`Unit ID ${unitId} not found`);
    }

    if (unit.status !== 'available') {
      throw new BadRequestException(
        `Cannot hold unit ${unit.unitNo}. Current status is '${unit.status}'. Only 'available' units can be held.`
      );
    }

    const hours = Math.max(1, dto.holdHours || 48);
    const holdTill = new Date(Date.now() + hours * 3600 * 1000);

    await this.db.db
      .update(schema.reUnits)
      .set({
        status: 'hold',
        holdBy: userId,
        holdTill,
        updatedAt: new Date(),
      })
      .where(eq(schema.reUnits.id, unitId));

    return {
      success: true,
      unitId,
      unitNo: unit.unitNo,
      status: 'hold',
      holdTill,
      heldForHours: hours,
    };
  }

  async blockUnit(
    tenantId: number,
    unitId: number,
    dto: { reason?: string | undefined; isInvestor?: boolean | undefined }
  ) {
    const unit = await this.db.db.query.reUnits.findFirst({
      where: and(eq(schema.reUnits.id, unitId), eq(schema.reUnits.tenantId, tenantId)),
    });

    if (!unit) {
      throw new NotFoundException(`Unit ID ${unitId} not found`);
    }

    if (unit.status === 'booked' || unit.status === 'registered') {
      throw new BadRequestException(`Unit ${unit.unitNo} is already booked/registered`);
    }

    await this.db.db
      .update(schema.reUnits)
      .set({
        status: 'blocked',
        isInvestor: dto.isInvestor ?? unit.isInvestor,
        updatedAt: new Date(),
      })
      .where(eq(schema.reUnits.id, unitId));

    return {
      success: true,
      unitId,
      unitNo: unit.unitNo,
      status: 'blocked',
    };
  }

  async releaseUnit(tenantId: number, unitId: number) {
    const unit = await this.db.db.query.reUnits.findFirst({
      where: and(eq(schema.reUnits.id, unitId), eq(schema.reUnits.tenantId, tenantId)),
    });

    if (!unit) {
      throw new NotFoundException(`Unit ID ${unitId} not found`);
    }

    if (unit.status === 'booked' || unit.status === 'registered') {
      throw new BadRequestException(
        `Unit ${unit.unitNo} is already booked/registered. Use Cancellation workflow instead.`
      );
    }

    await this.db.db
      .update(schema.reUnits)
      .set({
        status: 'available',
        holdBy: null,
        holdTill: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.reUnits.id, unitId));

    return {
      success: true,
      unitId,
      unitNo: unit.unitNo,
      status: 'available',
    };
  }

  /**
   * Hold-expiry cron task: releases all units whose hold_till has elapsed.
   */
  async releaseExpiredHolds(): Promise<{ releasedCount: number; unitNumbers: string[] }> {
    const now = new Date();
    const expiredUnits = await this.db.db
      .select({ id: schema.reUnits.id, unitNo: schema.reUnits.unitNo })
      .from(schema.reUnits)
      .where(
        and(
          eq(schema.reUnits.status, 'hold'),
          lt(schema.reUnits.holdTill, now)
        )
      );

    if (expiredUnits.length === 0) {
      return { releasedCount: 0, unitNumbers: [] };
    }

    const ids = expiredUnits.map((u) => u.id);
    await this.db.db
      .update(schema.reUnits)
      .set({
        status: 'available',
        holdBy: null,
        holdTill: null,
        updatedAt: now,
      })
      .where(inArray(schema.reUnits.id, ids));

    return {
      releasedCount: expiredUnits.length,
      unitNumbers: expiredUnits.map((u) => u.unitNo),
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. PARKING VIEW & INVENTORY
  // ════════════════════════════════════════════════════════════════════════════

  async getParkingGrid(tenantId: number, siteId: number) {
    const slots = await this.db.db
      .select({
        id: schema.reParkingSlots.id,
        slotNo: schema.reParkingSlots.slotNo,
        type: schema.reParkingSlots.type,
        price: schema.reParkingSlots.price,
        status: schema.reParkingSlots.status,
        bookingId: schema.reParkingSlots.bookingId,
        wingId: schema.reParkingSlots.wingId,
      })
      .from(schema.reParkingSlots)
      .where(
        and(
          eq(schema.reParkingSlots.tenantId, tenantId),
          eq(schema.reParkingSlots.siteId, siteId)
        )
      )
      .orderBy(schema.reParkingSlots.slotNo);

    const counts = {
      total: slots.length,
      available: slots.filter((s) => s.status === 'available').length,
      hold: slots.filter((s) => s.status === 'hold').length,
      booked: slots.filter((s) => s.status === 'booked').length,
    };

    return {
      counts,
      slots,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. COST SHEET CALCULATION ENGINE & APPROVAL FLOW
  // ════════════════════════════════════════════════════════════════════════════

  async previewCostSheetCalculation(
    tenantId: number,
    dto: {
      siteId: number;
      unitId: number;
      schemeId?: number | undefined;
      discountPct?: number | undefined;
      flatDiscountAmt?: number | undefined;
      parkingSlotId?: number | undefined;
    }
  ) {
    // 1. Fetch Unit & Floor
    const unit = await this.db.db.query.reUnits.findFirst({
      where: and(eq(schema.reUnits.id, dto.unitId), eq(schema.reUnits.tenantId, tenantId)),
    });

    if (!unit) {
      throw new NotFoundException(`Unit ID ${dto.unitId} not found`);
    }

    const floorRecord = unit.floorId
      ? await this.db.db.query.reFloors.findFirst({
          where: eq(schema.reFloors.id, unit.floorId),
        })
      : undefined;

    const unitTypeRecord = unit.unitTypeId
      ? await this.db.db.query.reUnitTypes.findFirst({
          where: eq(schema.reUnitTypes.id, unit.unitTypeId),
        })
      : undefined;

    // 2. Fetch Project Settings for Statutory Rates
    const settings = await this.db.db.query.reProjectSettings.findFirst({
      where: eq(schema.reProjectSettings.siteId, dto.siteId),
    });

    // 3. Fetch Parking Charges if a slot was chosen
    let parkingCharges = 0;
    if (dto.parkingSlotId) {
      const slot = await this.db.db.query.reParkingSlots.findFirst({
        where: and(
          eq(schema.reParkingSlots.id, dto.parkingSlotId),
          eq(schema.reParkingSlots.tenantId, tenantId)
        ),
      });
      if (slot) {
        parkingCharges = parseFloat(slot.price) || 0;
      }
    }

    // 4. Fetch Active Charge Heads
    const chargeHeads = await this.db.db
      .select()
      .from(schema.reChargeHeads)
      .where(eq(schema.reChargeHeads.tenantId, tenantId))
      .orderBy(schema.reChargeHeads.sequence);

    // 5. Fetch Scheme & Milestone Stages if scheme specified
    let schemeStagesInput: Array<{
      payStageId: number;
      code: string;
      name: string;
      pct: number;
    }> = [];
    let maxAllowedDiscount = 0;

    if (dto.schemeId) {
      const scheme = await this.db.db.query.reSchemes.findFirst({
        where: and(
          eq(schema.reSchemes.id, dto.schemeId),
          eq(schema.reSchemes.tenantId, tenantId)
        ),
      });
      if (scheme) {
        maxAllowedDiscount = parseFloat(scheme.maxDiscountPct || '0');
        const stRows = await this.db.db
          .select({
            payStageId: schema.reSchemeStages.payStageId,
            pct: schema.reSchemeStages.pct,
            code: schema.rePayStages.code,
            name: schema.rePayStages.name,
          })
          .from(schema.reSchemeStages)
          .innerJoin(
            schema.rePayStages,
            eq(schema.reSchemeStages.payStageId, schema.rePayStages.id)
          )
          .where(eq(schema.reSchemeStages.schemeId, dto.schemeId))
          .orderBy(schema.rePayStages.sequence);

        schemeStagesInput = stRows.map((r) => ({
          payStageId: r.payStageId,
          code: r.code,
          name: r.name,
          pct: parseFloat(r.pct) || 0,
        }));
      }
    }

    const floorNo = floorRecord ? floorRecord.levelNo : 0;

    const calcResult = this.pricingService.calculateCostSheet({
      carpetArea: parseFloat(unit.carpetArea || '0') || 0,
      baseRate: parseFloat(unit.baseRate || '0') || 0,
      floorNo,
      floorRiseRate: parseFloat(unit.floorRiseRate || '0'),
      plcRateOrAmount: parseFloat(unit.plcAmount || '0'),
      isPlcPct: false,
      discountPct: dto.discountPct,
      flatDiscountAmt: dto.flatDiscountAmt,
      parkingCharges,
      stampDutyPct: settings && settings.stampDutyPct ? parseFloat(settings.stampDutyPct) : 6.0,
      metroCessPct: settings && settings.metroCessPct ? parseFloat(settings.metroCessPct) : 1.0,
      registrationPct: settings && settings.registrationPct ? parseFloat(settings.registrationPct) : 1.0,
      registrationCap: settings && settings.registrationCap ? parseFloat(settings.registrationCap) : 30000,
      gstRate: settings && settings.gstRateUnderConstruction ? parseFloat(settings.gstRateUnderConstruction) : 5.0,
      otherCharges: chargeHeads.map((ch) => ({
        code: ch.code,
        name: ch.name,
        calcType: ch.calcType,
        value: parseFloat(ch.defaultValue || '0') || 0,
        gstApplicable: ch.gstApplicable,
        gstRate: ch.gstRate ? parseFloat(ch.gstRate) : 18.0,
        months: 12,
      })),
      schemeStages: schemeStagesInput,
    });

    const isApprovalRequired = (dto.discountPct || 0) > maxAllowedDiscount;

    return {
      unit: {
        id: unit.id,
        unitNo: unit.unitNo,
        unitType: unitTypeRecord?.name || '',
        category: unitTypeRecord?.category || '',
        facing: unit.facing,
        floorNo,
        carpetArea: unit.carpetArea,
      },
      calculation: calcResult,
      maxAllowedDiscount,
      isApprovalRequired,
    };
  }

  async createCostSheet(
    tenantId: number,
    userId: number,
    dto: {
      siteId: number;
      leadId?: number | undefined;
      unitId: number;
      schemeId?: number | undefined;
      discountPct?: number | undefined;
      flatDiscountAmt?: number | undefined;
      parkingSlotId?: number | undefined;
      validDays?: number | undefined;
      remarks?: string | undefined;
    }
  ) {
    const preview = await this.previewCostSheetCalculation(tenantId, dto);
    const validTill = new Date(Date.now() + (dto.validDays || 15) * 86400 * 1000);

    const initialStatus = preview.isApprovalRequired ? 'pending_approval' : 'draft';

    const [inserted] = await this.db.db.insert(schema.reCostSheets).values({
      uuid: randomUUID(),
      tenantId,
      leadId: dto.leadId ?? null,
      unitId: dto.unitId,
      schemeId: dto.schemeId ?? null,
      rate: preview.calculation.baseRate.toFixed(2),
      discountPct: preview.calculation.discountPct.toFixed(4),
      lines: preview.calculation,
      totals: {
        basicCost: preview.calculation.basicCost,
        floorRiseAmt: preview.calculation.floorRiseAmt,
        plcAmt: preview.calculation.plcAmt,
        grossAgreementValue: preview.calculation.grossAgreementValue,
        discountAmt: preview.calculation.discountAmt,
        netAgreementValue: preview.calculation.netAgreementValue,
        statutoryTaxesTotal: preview.calculation.statutoryTaxesTotal,
        parkingCharges: preview.calculation.parkingCharges,
        otherChargesGrandTotal: preview.calculation.otherChargesGrandTotal,
        grandTotalInclGst: preview.calculation.grandTotalInclGst,
      },
      validTill,
      status: initialStatus,
      createdBy: userId,
    });

    const costSheetId = inserted.insertId;

    // If approval is required, register approval task
    if (preview.isApprovalRequired) {
      await this.db.db.insert(schema.reApprovals).values({
        uuid: randomUUID(),
        tenantId,
        entity: 'cost_sheet',
        entityId: costSheetId,
        level: 1,
        approverRole: 'sales_head',
        status: 'pending',
        remarks: `Requested discount ${preview.calculation.discountPct}% exceeds scheme allowed ${preview.maxAllowedDiscount}%. Remarks: ${dto.remarks || 'None'}`,
      });
    }

    return {
      success: true,
      costSheetId,
      status: initialStatus,
      isApprovalRequired: preview.isApprovalRequired,
      calculation: preview.calculation,
    };
  }

  async listCostSheets(
    tenantId: number,
    query?: {
      siteId?: number | undefined;
      status?: string | undefined;
      leadId?: number | undefined;
      unitId?: number | undefined;
    }
  ) {
    const conditions = [eq(schema.reCostSheets.tenantId, tenantId)];
    if (query?.siteId) {
      conditions.push(eq(schema.reUnits.siteId, query.siteId));
    }
    if (query?.status) {
      conditions.push(eq(schema.reCostSheets.status, query.status as any));
    }
    if (query?.leadId) {
      conditions.push(eq(schema.reCostSheets.leadId, query.leadId));
    }
    if (query?.unitId) {
      conditions.push(eq(schema.reCostSheets.unitId, query.unitId));
    }

    const items = await this.db.db
      .select({
        id: schema.reCostSheets.id,
        uuid: schema.reCostSheets.uuid,
        siteId: schema.reUnits.siteId,
        leadId: schema.reCostSheets.leadId,
        leadName: schema.reLeads.name,
        leadMobile: schema.reLeads.mobile,
        unitId: schema.reCostSheets.unitId,
        unitNo: schema.reUnits.unitNo,
        schemeId: schema.reCostSheets.schemeId,
        schemeName: schema.reSchemes.name,
        rate: schema.reCostSheets.rate,
        discountPct: schema.reCostSheets.discountPct,
        lines: schema.reCostSheets.lines,
        totals: schema.reCostSheets.totals,
        validTill: schema.reCostSheets.validTill,
        status: schema.reCostSheets.status,
        approvedBy: schema.reCostSheets.approvedBy,
        approvalRemarks: schema.reApprovals.remarks,
        createdAt: schema.reCostSheets.createdAt,
      })
      .from(schema.reCostSheets)
      .innerJoin(schema.reUnits, eq(schema.reCostSheets.unitId, schema.reUnits.id))
      .leftJoin(schema.reLeads, eq(schema.reCostSheets.leadId, schema.reLeads.id))
      .leftJoin(schema.reSchemes, eq(schema.reCostSheets.schemeId, schema.reSchemes.id))
      .leftJoin(
        schema.reApprovals,
        and(
          eq(schema.reApprovals.entity, 'cost_sheet'),
          eq(schema.reApprovals.entityId, schema.reCostSheets.id)
        )
      )
      .where(and(...conditions))
      .orderBy(desc(schema.reCostSheets.createdAt));

    return items;
  }

  async getCostSheetById(tenantId: number, costSheetId: number) {
    const sheet = await this.db.db.query.reCostSheets.findFirst({
      where: and(
        eq(schema.reCostSheets.id, costSheetId),
        eq(schema.reCostSheets.tenantId, tenantId)
      ),
    });

    if (!sheet) {
      throw new NotFoundException(`Cost Sheet ID ${costSheetId} not found`);
    }

    const unit = sheet.unitId
      ? await this.db.db.query.reUnits.findFirst({
          where: eq(schema.reUnits.id, sheet.unitId),
        })
      : null;

    const floor = unit?.floorId
      ? await this.db.db.query.reFloors.findFirst({
          where: eq(schema.reFloors.id, unit.floorId),
        })
      : null;

    const unitType = unit?.unitTypeId
      ? await this.db.db.query.reUnitTypes.findFirst({
          where: eq(schema.reUnitTypes.id, unit.unitTypeId),
        })
      : null;

    const lead = sheet.leadId
      ? await this.db.db.query.reLeads.findFirst({
          where: eq(schema.reLeads.id, sheet.leadId),
        })
      : null;

    const scheme = sheet.schemeId
      ? await this.db.db.query.reSchemes.findFirst({
          where: eq(schema.reSchemes.id, sheet.schemeId),
        })
      : null;

    const siteId = unit?.siteId || 1;

    // Also fetch Project Settings for company name, RERA, letterhead
    const settings = await this.db.db.query.reProjectSettings.findFirst({
      where: eq(schema.reProjectSettings.siteId, siteId),
    });

    const tenant = await this.db.db.query.tenants.findFirst({
      where: eq(schema.tenants.id, tenantId),
    });

    const site = await this.db.db.query.sites.findFirst({
      where: eq(schema.sites.id, siteId),
    });

    return {
      costSheet: {
        ...sheet,
        unit: unit ? { ...unit, floor, unitType } : null,
        lead,
        scheme,
      },
      projectSettings: settings,
      tenant,
      site,
    };
  }

  async requestCostSheetApproval(
    tenantId: number,
    costSheetId: number,
    remarks?: string | undefined
  ) {
    const sheet = await this.db.db.query.reCostSheets.findFirst({
      where: and(
        eq(schema.reCostSheets.id, costSheetId),
        eq(schema.reCostSheets.tenantId, tenantId)
      ),
    });

    if (!sheet) {
      throw new NotFoundException(`Cost Sheet ID ${costSheetId} not found`);
    }

    await this.db.db
      .update(schema.reCostSheets)
      .set({
        status: 'pending_approval',
        updatedAt: new Date(),
      })
      .where(eq(schema.reCostSheets.id, costSheetId));

    await this.db.db.insert(schema.reApprovals).values({
      uuid: randomUUID(),
      tenantId,
      entity: 'cost_sheet',
      entityId: costSheetId,
      level: 1,
      approverRole: 'sales_head',
      status: 'pending',
      remarks: remarks || `Approval requested for Cost Sheet #${costSheetId}`,
    });

    return { success: true, status: 'pending_approval' };
  }

  async approveCostSheet(
    tenantId: number,
    costSheetId: number,
    userId: number,
    remarks: string
  ) {
    if (!remarks || !remarks.trim()) {
      throw new BadRequestException('Approval remarks are required');
    }

    const sheet = await this.db.db.query.reCostSheets.findFirst({
      where: and(
        eq(schema.reCostSheets.id, costSheetId),
        eq(schema.reCostSheets.tenantId, tenantId)
      ),
    });

    if (!sheet) {
      throw new NotFoundException(`Cost Sheet ID ${costSheetId} not found`);
    }

    const now = new Date();
    await this.db.db
      .update(schema.reCostSheets)
      .set({
        status: 'approved',
        approvedBy: userId,
        updatedAt: now,
      })
      .where(eq(schema.reCostSheets.id, costSheetId));

    await this.db.db
      .update(schema.reApprovals)
      .set({
        status: 'approved',
        remarks: remarks.trim(),
        actedBy: userId,
        actedAt: now,
      })
      .where(
        and(
          eq(schema.reApprovals.entity, 'cost_sheet'),
          eq(schema.reApprovals.entityId, costSheetId),
          eq(schema.reApprovals.tenantId, tenantId)
        )
      );

    return { success: true, status: 'approved', remarks: remarks.trim() };
  }

  async rejectCostSheet(
    tenantId: number,
    costSheetId: number,
    userId: number,
    remarks: string
  ) {
    if (!remarks || !remarks.trim()) {
      throw new BadRequestException('Rejection remarks are required');
    }

    const sheet = await this.db.db.query.reCostSheets.findFirst({
      where: and(
        eq(schema.reCostSheets.id, costSheetId),
        eq(schema.reCostSheets.tenantId, tenantId)
      ),
    });

    if (!sheet) {
      throw new NotFoundException(`Cost Sheet ID ${costSheetId} not found`);
    }

    const now = new Date();
    await this.db.db
      .update(schema.reCostSheets)
      .set({
        status: 'rejected',
        updatedAt: now,
      })
      .where(eq(schema.reCostSheets.id, costSheetId));

    await this.db.db
      .update(schema.reApprovals)
      .set({
        status: 'rejected',
        remarks: remarks || 'Discount rejected',
        actedBy: userId,
        actedAt: now,
      })
      .where(
        and(
          eq(schema.reApprovals.entity, 'cost_sheet'),
          eq(schema.reApprovals.entityId, costSheetId),
          eq(schema.reApprovals.tenantId, tenantId)
        )
      );

    return { success: true, status: 'rejected' };
  }
}
