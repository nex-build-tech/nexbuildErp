import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { RealtyPricingService } from '../common/pricing.service';
import { RealtyLedgerService, StageDue } from '../common/ledger.service';
import { RealtyInterestService } from '../common/interest.service';
import { encryptAadhaar, decryptAadhaar, maskAadhaar } from '../common/encryption.util';
import { randomUUID } from 'crypto';

export interface CompleteStageDto {
  siteId: number;
  stageId: number;
  completionDate?: string | undefined;
  certificateNo?: string | undefined;
}

export interface BulkGenerateDemandsDto {
  siteId: number;
  stageId: number;
  dueDate: string;
  bookingIds?: number[] | undefined;
}

export interface CreateReceiptDto {
  bookingId: number;
  receiptDate?: string | undefined;
  amount: number;
  mode: 'cash' | 'cheque' | 'dd' | 'neft' | 'rtgs' | 'imps' | 'upi' | 'swift' | 'online';
  instrumentNo?: string | undefined;
  instrumentDate?: string | undefined;
  drawnOnBank?: string | undefined;
  depositBankId?: number | undefined;
  tdsApplicable?: boolean | undefined;
  narration?: string | undefined;
  attachmentUrl?: string | undefined;
}

export interface CancelBookingDto {
  cancellationCharges?: number | undefined;
  reason?: string | undefined;
}

export interface TransferBookingDto {
  newApplicant: {
    title?: string | undefined;
    firstName: string;
    lastName: string;
    pan?: string | undefined;
    aadhaar?: string | undefined;
    mobile: string;
    email?: string | undefined;
    address?: string | undefined;
  };
  transferFee?: number | undefined;
  reason?: string | undefined;
}

export interface IssueLetterDto {
  bookingId: number;
  templateType: 'demand' | 'allotment' | 'welcome' | 'agreement_intimation' | 'possession' | 'noc' | 'reminder' | 'interest' | 'cancellation' | 'other';
  customSubject?: string | undefined;
  customBody?: string | undefined;
}

export interface CreateBookingDto {
  siteId: number;
  unitId: number;
  leadId?: number | undefined;
  cpId?: number | undefined;
  schemeId: number;
  bookingDate?: string | undefined;
  areaBasis?: 'carpet' | 'saleable' | 'builtup' | undefined;
  discountPct?: number | undefined;
  flatDiscountAmt?: number | undefined;
  parkingSlotId?: number | undefined;
  stampByBuilder?: boolean | undefined;
  regByBuilder?: boolean | undefined;

  // Primary Applicant
  applicant: {
    title?: string | undefined;
    firstName: string;
    middleName?: string | undefined;
    lastName: string;
    dob?: string | undefined;
    gender?: 'male' | 'female' | 'other' | undefined;
    occupation?: string | undefined;
    pan?: string | undefined;
    aadhaar?: string | undefined;
    mobile: string;
    email?: string | undefined;
    permanentAddress?: string | undefined;
    correspondenceAddress?: string | undefined;
    sameAddress?: boolean | undefined;
    city?: string | undefined;
    stateCode?: string | undefined;
    pincode?: string | undefined;
  };

  // Co-Applicants
  coApplicants?: Array<{
    type: 'co1' | 'co2' | 'co3';
    title?: string | undefined;
    firstName: string;
    middleName?: string | undefined;
    lastName: string;
    pan?: string | undefined;
    aadhaar?: string | undefined;
    mobile?: string | undefined;
    email?: string | undefined;
    relation?: string | undefined;
  }> | undefined;

  // KYC Documents
  documents?: Array<{
    type: 'pan' | 'aadhaar' | 'photo' | 'agreement' | 'registration' | 'allotment' | 'other';
    fileUrl: string;
    isPrivate?: boolean | undefined;
  }> | undefined;

  // Booking Amount & Payment Mode
  bookingAmount?: number | undefined;
  paymentMode?: string | undefined;
  referenceNo?: string | undefined;
  remarks?: string | undefined;
}

@Injectable()
export class PostSalesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly pricingService: RealtyPricingService,
    private readonly ledgerService: RealtyLedgerService,
    private readonly interestService: RealtyInterestService
  ) {}

  // ════════════════════════════════════════════════════════════════════════════
  // 1. DOCUMENT NUMBER GENERATOR
  // ════════════════════════════════════════════════════════════════════════════

  private async generateDocNumber(tenantId: number, docType: string, prefixDefault: string): Promise<string> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const fy = currentMonth >= 4 ? `${currentYear % 100}-${(currentYear + 1) % 100}` : `${(currentYear - 1) % 100}-${currentYear % 100}`;

    const [series] = await this.db.db
      .select()
      .from(schema.documentSeries)
      .where(
        and(
          eq(schema.documentSeries.tenantId, tenantId),
          eq(schema.documentSeries.documentType, docType),
          eq(schema.documentSeries.financialYear, fy)
        )
      )
      .limit(1);

    let nextNum = 1;
    let prefix = prefixDefault;
    let padding = 4;

    if (!series) {
      await this.db.db.insert(schema.documentSeries).values({
        uuid: randomUUID(),
        tenantId,
        documentType: docType,
        prefix: prefixDefault,
        financialYear: fy,
        nextNumber: 2,
        padding: 4,
      });
      nextNum = 1;
    } else {
      nextNum = series.nextNumber;
      prefix = series.prefix;
      padding = series.padding;
      await this.db.db
        .update(schema.documentSeries)
        .set({ nextNumber: nextNum + 1, updatedAt: new Date() })
        .where(eq(schema.documentSeries.id, series.id));
    }

    const padded = String(nextNum).padStart(padding, '0');
    return `${prefix}-${fy}-${padded}`;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 2. CREATE BOOKING & GENERATE SCHEDULE
  // ════════════════════════════════════════════════════════════════════════════

  async createBooking(tenantId: number, userId: number, dto: CreateBookingDto) {
    // 1. Validate Unit Availability
    const unit = await this.db.db.query.reUnits.findFirst({
      where: and(eq(schema.reUnits.id, dto.unitId), eq(schema.reUnits.tenantId, tenantId)),
    });

    if (!unit) {
      throw new NotFoundException(`Unit ID ${dto.unitId} not found`);
    }

    if (unit.status === 'booked' || unit.status === 'agreement' || unit.status === 'registered') {
      throw new BadRequestException(`Unit ${unit.unitNo} is already booked.`);
    }

    let floorNo = 0;
    if (unit.floorId) {
      const fl = await this.db.db.query.reFloors.findFirst({
        where: eq(schema.reFloors.id, unit.floorId),
      });
      floorNo = fl?.levelNo || 0;
    }

    // 2. Fetch Project Settings
    const settings = await this.db.db.query.reProjectSettings.findFirst({
      where: eq(schema.reProjectSettings.siteId, dto.siteId),
    });

    // 3. Fetch Parking Slot if selected
    let parkingSlotPrice = 0;
    if (dto.parkingSlotId) {
      const slot = await this.db.db.query.reParkingSlots.findFirst({
        where: and(
          eq(schema.reParkingSlots.id, dto.parkingSlotId),
          eq(schema.reParkingSlots.tenantId, tenantId)
        ),
      });
      if (slot) {
        if (slot.status === 'booked') {
          throw new BadRequestException(`Parking slot ${slot.slotNo} is already booked`);
        }
        parkingSlotPrice = parseFloat(slot.price) || 0;
      }
    }

    // 4. Fetch Active Charge Heads
    const chargeHeads = await this.db.db
      .select()
      .from(schema.reChargeHeads)
      .where(eq(schema.reChargeHeads.tenantId, tenantId))
      .orderBy(schema.reChargeHeads.sequence);

    // 5. Fetch Scheme & Stages
    const scheme = await this.db.db.query.reSchemes.findFirst({
      where: and(eq(schema.reSchemes.id, dto.schemeId), eq(schema.reSchemes.tenantId, tenantId)),
    });

    if (!scheme) {
      throw new NotFoundException(`Payment Scheme ID ${dto.schemeId} not found`);
    }

    const schemeStages = await this.db.db
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

    // 6. Compute Accurate Financials via RealtyPricingService
    const calc = this.pricingService.calculateCostSheet({
      carpetArea: parseFloat(unit.carpetArea || '0') || 0,
      baseRate: parseFloat(unit.baseRate || '0') || 0,
      floorNo,
      floorRiseRate: parseFloat(unit.floorRiseRate || '0'),
      plcRateOrAmount: parseFloat(unit.plcAmount || '0'),
      isPlcPct: false,
      discountPct: dto.discountPct,
      flatDiscountAmt: dto.flatDiscountAmt,
      parkingCharges: parkingSlotPrice,
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
      schemeStages: schemeStages.map((st) => ({
        payStageId: st.payStageId,
        code: st.code,
        name: st.name,
        pct: parseFloat(st.pct) || 0,
      })),
    });

    // 7. Check if discount exceeds scheme allowed discount
    const maxDiscount = parseFloat(scheme.maxDiscountPct || '0');
    const isApprovalNeeded = (dto.discountPct || 0) > maxDiscount;
    const initialStatus = isApprovalNeeded ? 'pending_approval' : 'booked';

    // 8. Generate Booking Number
    const bookingNo = await this.generateDocNumber(tenantId, 'BK', 'BK');

    // 9. Insert Booking Record
    const now = new Date();
    const [bookingResult] = await this.db.db.insert(schema.reBookings).values({
      uuid: randomUUID(),
      tenantId,
      bookingNo,
      unitId: dto.unitId,
      leadId: dto.leadId ?? null,
      cpId: dto.cpId ?? null,
      schemeId: dto.schemeId,
      bookingDate: dto.bookingDate ? new Date(dto.bookingDate) : now,
      areaBasis: dto.areaBasis || 'carpet',
      soldRate: calc.baseRate.toFixed(2),
      basicCost: calc.basicCost.toFixed(2),
      floorRiseAmt: calc.floorRiseAmt.toFixed(2),
      plcAmt: calc.plcAmt.toFixed(2),
      discountPct: calc.discountPct.toFixed(4),
      discountAmt: calc.discountAmt.toFixed(2),
      netCost: calc.netAgreementValue.toFixed(2),
      agreementValue: calc.netAgreementValue.toFixed(2),
      gstPct: calc.gstPct.toFixed(4),
      gstAmt: calc.gstAmt.toFixed(2),
      stampDuty: calc.stampDutyAmt.toFixed(2),
      registrationFee: calc.registrationAmt.toFixed(2),
      stampByBuilder: dto.stampByBuilder ?? false,
      regByBuilder: dto.regByBuilder ?? false,
      otherChargesTotal: calc.otherChargesGrandTotal.toFixed(2),
      grandTotalInclGst: calc.grandTotalInclGst.toFixed(2),
      grandTotalExclGst: calc.grandTotalExclGst.toFixed(2),
      status: initialStatus,
      createdBy: userId,
    });

    const bookingId = bookingResult.insertId;

    // 10. Update Unit Status
    await this.db.db
      .update(schema.reUnits)
      .set({
        status: initialStatus === 'booked' ? 'booked' : 'hold',
        updatedAt: now,
      })
      .where(eq(schema.reUnits.id, dto.unitId));

    // 11. If Parking selected, record and mark slot booked
    if (dto.parkingSlotId) {
      await this.db.db.insert(schema.reBookingParkings).values({
        bookingId,
        slotId: dto.parkingSlotId,
        price: parkingSlotPrice.toFixed(2),
      });

      await this.db.db
        .update(schema.reParkingSlots)
        .set({
          status: 'booked',
          bookingId,
          updatedAt: now,
        })
        .where(eq(schema.reParkingSlots.id, dto.parkingSlotId));
    }

    // 12. Insert Primary Applicant with Encrypted Aadhaar
    const app = dto.applicant;
    const primaryAadhaarEnc = app.aadhaar ? encryptAadhaar(app.aadhaar) : null;

    await this.db.db.insert(schema.reBookingApplicants).values({
      uuid: randomUUID(),
      tenantId,
      bookingId,
      type: 'primary',
      title: app.title || 'Mr.',
      firstName: app.firstName,
      middleName: app.middleName || null,
      lastName: app.lastName,
      dob: app.dob ? new Date(app.dob) : null,
      gender: app.gender || 'male',
      occupation: app.occupation || null,
      pan: app.pan ? app.pan.toUpperCase() : null,
      aadhaarEnc: primaryAadhaarEnc,
      mobile: app.mobile,
      email: app.email || null,
      permanentAddress: app.permanentAddress || null,
      correspondenceAddress: app.correspondenceAddress || null,
      sameAddress: app.sameAddress ?? true,
      city: app.city || 'Mumbai',
      stateCode: app.stateCode || 'MH',
      pincode: app.pincode || null,
      createdBy: userId,
    });

    // 13. Insert Co-Applicants
    if (dto.coApplicants && dto.coApplicants.length > 0) {
      for (const co of dto.coApplicants) {
        const coAadhaarEnc = co.aadhaar ? encryptAadhaar(co.aadhaar) : null;
        await this.db.db.insert(schema.reBookingApplicants).values({
          uuid: randomUUID(),
          tenantId,
          bookingId,
          type: co.type,
          title: co.title || 'Mr.',
          firstName: co.firstName,
          middleName: co.middleName || null,
          lastName: co.lastName,
          pan: co.pan ? co.pan.toUpperCase() : null,
          aadhaarEnc: coAadhaarEnc,
          mobile: co.mobile || null,
          email: co.email || null,
          relation: co.relation || 'Co-Owner',
          createdBy: userId,
        });
      }
    }

    // 14. Insert KYC Documents
    if (dto.documents && dto.documents.length > 0) {
      for (const doc of dto.documents) {
        await this.db.db.insert(schema.reBookingDocuments).values({
          tenantId,
          bookingId,
          type: doc.type,
          fileUrl: doc.fileUrl,
          isPrivate: doc.isPrivate ?? true,
          createdBy: userId,
        });
      }
    }

    // 15. Insert Extra Charges Breakdown
    for (const ch of calc.otherChargesBreakdown) {
      const matchedHead = chargeHeads.find((h) => h.code === ch.code);
      if (matchedHead) {
        await this.db.db.insert(schema.reBookingCharges).values({
          bookingId,
          chargeHeadId: matchedHead.id,
          amount: ch.baseAmount.toFixed(2),
          gstAmt: ch.gstAmount.toFixed(2),
        });
      }
    }

    // 16. Generate Payment Schedule (100% Milestone Stages)
    for (const st of calc.paymentSchedule) {
      await this.db.db.insert(schema.rePaymentSchedule).values({
        tenantId,
        bookingId,
        payStageId: st.payStageId,
        pct: st.stagePct.toFixed(4),
        amount: st.demandedBasicAmount.toFixed(2),
        gstAmt: st.demandedGstAmount.toFixed(2),
        paidAmount: '0.00',
        status: 'not_due',
        createdBy: userId,
      });
    }

    // 17. If approval needed, register task in re_approvals
    if (isApprovalNeeded) {
      await this.db.db.insert(schema.reApprovals).values({
        uuid: randomUUID(),
        tenantId,
        entity: 'booking',
        entityId: bookingId,
        level: 1,
        approverRole: 'sales_head',
        status: 'pending',
        remarks: `Booking #${bookingNo} requested discount ${calc.discountPct}% exceeds scheme allowed ${maxDiscount}%.`,
      });
    }

    return {
      success: true,
      bookingId,
      bookingNo,
      status: initialStatus,
      agreementValue: calc.netAgreementValue,
      grandTotalInclGst: calc.grandTotalInclGst,
      isApprovalNeeded,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. LIST BOOKINGS
  // ════════════════════════════════════════════════════════════════════════════

  async listBookings(
    tenantId: number,
    query?: {
      siteId?: number | undefined;
      status?: string | undefined;
      search?: string | undefined;
    }
  ) {
    const conditions = [eq(schema.reBookings.tenantId, tenantId)];

    if (query?.siteId) {
      conditions.push(eq(schema.reUnits.siteId, query.siteId));
    }
    if (query?.status) {
      conditions.push(eq(schema.reBookings.status, query.status as any));
    }

    const rows = await this.db.db
      .select({
        id: schema.reBookings.id,
        uuid: schema.reBookings.uuid,
        bookingNo: schema.reBookings.bookingNo,
        bookingDate: schema.reBookings.bookingDate,
        status: schema.reBookings.status,
        unitId: schema.reBookings.unitId,
        unitNo: schema.reUnits.unitNo,
        siteId: schema.reUnits.siteId,
        carpetArea: schema.reUnits.carpetArea,
        soldRate: schema.reBookings.soldRate,
        agreementValue: schema.reBookings.agreementValue,
        grandTotalInclGst: schema.reBookings.grandTotalInclGst,
        discountPct: schema.reBookings.discountPct,
        schemeId: schema.reBookings.schemeId,
        schemeName: schema.reSchemes.name,
        applicantFirstName: schema.reBookingApplicants.firstName,
        applicantLastName: schema.reBookingApplicants.lastName,
        applicantMobile: schema.reBookingApplicants.mobile,
        applicantEmail: schema.reBookingApplicants.email,
        applicantPan: schema.reBookingApplicants.pan,
        approvalRemarks: schema.reApprovals.remarks,
        approvalStatus: schema.reApprovals.status,
        approvalActedAt: schema.reApprovals.actedAt,
      })
      .from(schema.reBookings)
      .innerJoin(schema.reUnits, eq(schema.reBookings.unitId, schema.reUnits.id))
      .leftJoin(schema.reSchemes, eq(schema.reBookings.schemeId, schema.reSchemes.id))
      .leftJoin(
        schema.reBookingApplicants,
        and(
          eq(schema.reBookingApplicants.bookingId, schema.reBookings.id),
          eq(schema.reBookingApplicants.type, 'primary')
        )
      )
      .leftJoin(
        schema.reApprovals,
        and(
          eq(schema.reApprovals.entity, 'booking'),
          eq(schema.reApprovals.entityId, schema.reBookings.id)
        )
      )
      .where(and(...conditions))
      .orderBy(desc(schema.reBookings.createdAt));

    if (query?.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      return rows.filter(
        (r) =>
          r.bookingNo.toLowerCase().includes(q) ||
          r.unitNo.toLowerCase().includes(q) ||
          (r.applicantFirstName || '').toLowerCase().includes(q) ||
          (r.applicantLastName || '').toLowerCase().includes(q) ||
          (r.applicantMobile || '').includes(q)
      );
    }

    return rows;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. CUSTOMER 360 (BOOKING DETAIL)
  // ════════════════════════════════════════════════════════════════════════════

  async getBookingCustomer360(tenantId: number, bookingId: number) {
    const booking = await this.db.db.query.reBookings.findFirst({
      where: and(eq(schema.reBookings.id, bookingId), eq(schema.reBookings.tenantId, tenantId)),
    });

    if (!booking) {
      throw new NotFoundException(`Booking ID ${bookingId} not found`);
    }

    const unit = await this.db.db.query.reUnits.findFirst({
      where: eq(schema.reUnits.id, booking.unitId),
    });
    let floorRecord: any = null;
    let unitTypeRecord: any = null;
    if (unit?.floorId) {
      floorRecord = await this.db.db.query.reFloors.findFirst({
        where: eq(schema.reFloors.id, unit.floorId),
      });
    }
    if (unit?.unitTypeId) {
      unitTypeRecord = await this.db.db.query.reUnitTypes.findFirst({
        where: eq(schema.reUnitTypes.id, unit.unitTypeId),
      });
    }
    const scheme = booking.schemeId
      ? await this.db.db.query.reSchemes.findFirst({
          where: eq(schema.reSchemes.id, booking.schemeId),
        })
      : null;
    const lead = booking.leadId
      ? await this.db.db.query.reLeads.findFirst({
          where: eq(schema.reLeads.id, booking.leadId),
        })
      : null;
    const channelPartner = booking.cpId
      ? await this.db.db.query.reChannelPartners.findFirst({
          where: eq(schema.reChannelPartners.id, booking.cpId),
        })
      : null;

    const enrichedBooking = {
      ...booking,
      unit: unit ? { ...unit, floor: floorRecord, unitType: unitTypeRecord } : null,
      scheme,
      lead,
      channelPartner,
    };

    // 1. Fetch Applicants & Mask Aadhaar
    const applicants = await this.db.db
      .select()
      .from(schema.reBookingApplicants)
      .where(
        and(
          eq(schema.reBookingApplicants.bookingId, bookingId),
          eq(schema.reBookingApplicants.tenantId, tenantId)
        )
      )
      .orderBy(schema.reBookingApplicants.type);

    const maskedApplicants = applicants.map((app) => {
      let maskedAadhaarNum = '';
      if (app.aadhaarEnc) {
        try {
          const decrypted = decryptAadhaar(app.aadhaarEnc);
          maskedAadhaarNum = maskAadhaar(decrypted);
        } catch {
          maskedAadhaarNum = 'XXXX-XXXX-****';
        }
      }
      return {
        ...app,
        aadhaarMasked: maskedAadhaarNum,
        aadhaarEnc: undefined, // do not leak ciphertext to client
      };
    });

    // 2. Fetch Payment Schedule with Pay Stages
    const schedule = await this.db.db
      .select({
        id: schema.rePaymentSchedule.id,
        bookingId: schema.rePaymentSchedule.bookingId,
        payStageId: schema.rePaymentSchedule.payStageId,
        code: schema.rePayStages.code,
        name: schema.rePayStages.name,
        pct: schema.rePaymentSchedule.pct,
        amount: schema.rePaymentSchedule.amount,
        gstAmt: schema.rePaymentSchedule.gstAmt,
        dueDate: schema.rePaymentSchedule.dueDate,
        paidAmount: schema.rePaymentSchedule.paidAmount,
        status: schema.rePaymentSchedule.status,
        demandId: schema.rePaymentSchedule.demandId,
        isConstructionLinked: schema.rePayStages.isConstructionLinked,
        stageStatus: schema.rePayStages.status,
      })
      .from(schema.rePaymentSchedule)
      .innerJoin(
        schema.rePayStages,
        eq(schema.rePaymentSchedule.payStageId, schema.rePayStages.id)
      )
      .where(
        and(
          eq(schema.rePaymentSchedule.bookingId, bookingId),
          eq(schema.rePaymentSchedule.tenantId, tenantId)
        )
      )
      .orderBy(schema.rePayStages.sequence);

    // 3. Fetch Allocated Parking
    const parkings = await this.db.db
      .select({
        id: schema.reBookingParkings.id,
        slotId: schema.reBookingParkings.slotId,
        price: schema.reBookingParkings.price,
        slotNo: schema.reParkingSlots.slotNo,
        type: schema.reParkingSlots.type,
      })
      .from(schema.reBookingParkings)
      .innerJoin(
        schema.reParkingSlots,
        eq(schema.reBookingParkings.slotId, schema.reParkingSlots.id)
      )
      .where(eq(schema.reBookingParkings.bookingId, bookingId));

    // 4. Fetch Documents
    const documents = await this.db.db
      .select()
      .from(schema.reBookingDocuments)
      .where(
        and(
          eq(schema.reBookingDocuments.bookingId, bookingId),
          eq(schema.reBookingDocuments.tenantId, tenantId)
        )
      );

    // 5. Fetch Charges
    const charges = await this.db.db
      .select({
        id: schema.reBookingCharges.id,
        chargeHeadId: schema.reBookingCharges.chargeHeadId,
        name: schema.reChargeHeads.name,
        code: schema.reChargeHeads.code,
        amount: schema.reBookingCharges.amount,
        gstAmt: schema.reBookingCharges.gstAmt,
      })
      .from(schema.reBookingCharges)
      .innerJoin(
        schema.reChargeHeads,
        eq(schema.reBookingCharges.chargeHeadId, schema.reChargeHeads.id)
      )
      .where(eq(schema.reBookingCharges.bookingId, bookingId));

    // 6. Fetch Approval Record if exists
    const approval = await this.db.db.query.reApprovals.findFirst({
      where: and(
        eq(schema.reApprovals.entity, 'booking'),
        eq(schema.reApprovals.entityId, bookingId),
        eq(schema.reApprovals.tenantId, tenantId)
      ),
    });

    // 7. Compute Real-Time Financial Reconciliation KPIs
    const agreementValue = parseFloat(booking.agreementValue || '0') || 0;
    const grandTotal = parseFloat(booking.grandTotalInclGst || '0') || 0;

    let totalDemanded = 0;
    let totalReceived = 0;

    schedule.forEach((s) => {
      const basicAmt = parseFloat(s.amount) || 0;
      const gst = parseFloat(s.gstAmt) || 0;
      const totalStage = basicAmt + gst;

      if (s.status === 'demanded' || s.status === 'partly_paid' || s.status === 'paid' || s.status === 'overdue') {
        totalDemanded += totalStage;
      }
      totalReceived += parseFloat(s.paidAmount) || 0;
    });

    const totalOutstanding = Math.max(0, totalDemanded - totalReceived);
    const balanceAgreementValue = Math.max(0, grandTotal - totalReceived);

    return {
      booking: enrichedBooking,
      approval: approval || null,
      kpis: {
        agreementValue,
        grandTotal,
        totalDemanded,
        totalReceived,
        totalOutstanding,
        balanceAgreementValue,
        collectionEfficiencyPct: totalDemanded > 0 ? Math.round((totalReceived / totalDemanded) * 100) : 100,
      },
      applicants: maskedApplicants,
      schedule,
      parkings,
      documents,
      charges,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 5. APPROVE / REJECT BOOKING
  // ════════════════════════════════════════════════════════════════════════════

  async approveBooking(
    tenantId: number,
    bookingId: number,
    userId: number,
    remarks: string
  ) {
    if (!remarks || !remarks.trim()) {
      throw new BadRequestException('Approval remarks are required');
    }

    const booking = await this.db.db.query.reBookings.findFirst({
      where: and(eq(schema.reBookings.id, bookingId), eq(schema.reBookings.tenantId, tenantId)),
    });

    if (!booking) {
      throw new NotFoundException(`Booking ID ${bookingId} not found`);
    }

    const now = new Date();
    await this.db.db
      .update(schema.reBookings)
      .set({
        status: 'booked',
        updatedAt: now,
      })
      .where(eq(schema.reBookings.id, bookingId));

    await this.db.db
      .update(schema.reUnits)
      .set({
        status: 'booked',
        updatedAt: now,
      })
      .where(eq(schema.reUnits.id, booking.unitId));

    const existingApproval = await this.db.db.query.reApprovals.findFirst({
      where: and(
        eq(schema.reApprovals.entity, 'booking'),
        eq(schema.reApprovals.entityId, bookingId),
        eq(schema.reApprovals.tenantId, tenantId)
      ),
    });

    if (existingApproval) {
      await this.db.db
        .update(schema.reApprovals)
        .set({
          status: 'approved',
          remarks: remarks.trim(),
          actedBy: userId,
          actedAt: now,
        })
        .where(eq(schema.reApprovals.id, existingApproval.id));
    } else {
      await this.db.db.insert(schema.reApprovals).values({
        uuid: randomUUID(),
        tenantId,
        entity: 'booking',
        entityId: bookingId,
        level: 1,
        approverRole: 'sales_head',
        status: 'approved',
        remarks: remarks.trim(),
        actedBy: userId,
        actedAt: now,
      });
    }

    return { success: true, status: 'booked', remarks: remarks.trim() };
  }

  async rejectBooking(
    tenantId: number,
    bookingId: number,
    userId: number,
    remarks: string
  ) {
    if (!remarks || !remarks.trim()) {
      throw new BadRequestException('Rejection remarks are required');
    }

    const booking = await this.db.db.query.reBookings.findFirst({
      where: and(eq(schema.reBookings.id, bookingId), eq(schema.reBookings.tenantId, tenantId)),
    });

    if (!booking) {
      throw new NotFoundException(`Booking ID ${bookingId} not found`);
    }

    const now = new Date();
    await this.db.db
      .update(schema.reBookings)
      .set({
        status: 'cancelled',
        updatedAt: now,
      })
      .where(eq(schema.reBookings.id, bookingId));

    await this.db.db
      .update(schema.reUnits)
      .set({
        status: 'available',
        updatedAt: now,
      })
      .where(eq(schema.reUnits.id, booking.unitId));

    const existingApproval = await this.db.db.query.reApprovals.findFirst({
      where: and(
        eq(schema.reApprovals.entity, 'booking'),
        eq(schema.reApprovals.entityId, bookingId),
        eq(schema.reApprovals.tenantId, tenantId)
      ),
    });

    if (existingApproval) {
      await this.db.db
        .update(schema.reApprovals)
        .set({
          status: 'rejected',
          remarks: remarks.trim(),
          actedBy: userId,
          actedAt: now,
        })
        .where(eq(schema.reApprovals.id, existingApproval.id));
    } else {
      await this.db.db.insert(schema.reApprovals).values({
        uuid: randomUUID(),
        tenantId,
        entity: 'booking',
        entityId: bookingId,
        level: 1,
        approverRole: 'sales_head',
        status: 'rejected',
        remarks: remarks.trim(),
        actedBy: userId,
        actedAt: now,
      });
    }

    return { success: true, status: 'cancelled', remarks: remarks.trim(), message: 'Booking rejected and unit released back to inventory' };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 6. STAGE COMPLETION & BULK DEMAND GENERATION
  // ════════════════════════════════════════════════════════════════════════════

  async completeStage(tenantId: number, _userId: number, dto: CompleteStageDto) {
    const stage = await this.db.db.query.rePayStages.findFirst({
      where: and(eq(schema.rePayStages.id, dto.stageId), eq(schema.rePayStages.tenantId, tenantId)),
    });

    if (!stage) {
      throw new NotFoundException(`Pay stage ID ${dto.stageId} not found`);
    }

    const completionDate = dto.completionDate ? new Date(dto.completionDate) : new Date();

    await this.db.db
      .update(schema.rePayStages)
      .set({
        status: 'completed',
        completedOn: completionDate,
        updatedAt: new Date(),
      })
      .where(eq(schema.rePayStages.id, dto.stageId));

    const eligibleBookings = await this.getEligibleBookingsForStage(tenantId, dto.stageId);

    return {
      success: true,
      stageId: dto.stageId,
      stageCode: stage.code,
      stageName: stage.name,
      status: 'completed',
      completionDate,
      eligibleBookingsCount: eligibleBookings.length,
      eligibleBookings,
    };
  }

  async getEligibleBookingsForStage(tenantId: number, stageId: number) {
    const rows = await this.db.db
      .select({
        scheduleId: schema.rePaymentSchedule.id,
        bookingId: schema.rePaymentSchedule.bookingId,
        bookingNo: schema.reBookings.bookingNo,
        bookingStatus: schema.reBookings.status,
        unitId: schema.reBookings.unitId,
        unitNo: schema.reUnits.unitNo,
        carpetArea: schema.reUnits.carpetArea,
        stagePct: schema.rePaymentSchedule.pct,
        principalAmount: schema.rePaymentSchedule.amount,
        gstAmt: schema.rePaymentSchedule.gstAmt,
        scheduleStatus: schema.rePaymentSchedule.status,
        applicantFirstName: schema.reBookingApplicants.firstName,
        applicantLastName: schema.reBookingApplicants.lastName,
        applicantMobile: schema.reBookingApplicants.mobile,
      })
      .from(schema.rePaymentSchedule)
      .innerJoin(schema.reBookings, eq(schema.rePaymentSchedule.bookingId, schema.reBookings.id))
      .innerJoin(schema.reUnits, eq(schema.reBookings.unitId, schema.reUnits.id))
      .leftJoin(
        schema.reBookingApplicants,
        and(
          eq(schema.reBookingApplicants.bookingId, schema.reBookings.id),
          eq(schema.reBookingApplicants.type, 'primary')
        )
      )
      .where(
        and(
          eq(schema.rePaymentSchedule.tenantId, tenantId),
          eq(schema.rePaymentSchedule.payStageId, stageId),
          inArray(schema.reBookings.status, ['booked', 'agreement_done', 'registered']),
          eq(schema.rePaymentSchedule.status, 'not_due')
        )
      );

    return rows.map((r) => {
      const principal = parseFloat(r.principalAmount) || 0;
      const gst = parseFloat(r.gstAmt) || 0;
      return {
        ...r,
        principal,
        gst,
        totalDue: Math.round((principal + gst) * 100) / 100,
      };
    });
  }

  async bulkGenerateDemands(tenantId: number, userId: number, dto: BulkGenerateDemandsDto) {
    const stage = await this.db.db.query.rePayStages.findFirst({
      where: and(eq(schema.rePayStages.id, dto.stageId), eq(schema.rePayStages.tenantId, tenantId)),
    });

    if (!stage) {
      throw new NotFoundException(`Pay stage ID ${dto.stageId} not found`);
    }

    const eligible = await this.getEligibleBookingsForStage(tenantId, dto.stageId);
    let toProcess = eligible;
    if (dto.bookingIds && dto.bookingIds.length > 0) {
      const allowedSet = new Set(dto.bookingIds);
      toProcess = eligible.filter((e) => allowedSet.has(e.bookingId));
    }

    if (toProcess.length === 0) {
      return {
        success: true,
        generatedCount: 0,
        demands: [],
        message: 'No eligible bookings pending demand generation for this stage.',
      };
    }

    const now = new Date();
    const dueDate = new Date(dto.dueDate);
    const generatedDemands: any[] = [];

    for (const item of toProcess) {
      const demandNo = await this.generateDocNumber(tenantId, 'DM', 'DM');

      const [demandResult] = await this.db.db.insert(schema.reDemands).values({
        uuid: randomUUID(),
        tenantId,
        demandNo,
        bookingId: item.bookingId,
        payStageId: dto.stageId,
        demandDate: now,
        dueDate,
        principal: item.principal.toFixed(2),
        gst: item.gst.toFixed(2),
        interestCarried: '0.00',
        total: item.totalDue.toFixed(2),
        status: 'draft',
        createdBy: userId,
      });

      const demandId = demandResult.insertId;

      // Update schedule item
      await this.db.db
        .update(schema.rePaymentSchedule)
        .set({
          status: 'demanded',
          demandId,
          dueDate,
          updatedAt: now,
        })
        .where(eq(schema.rePaymentSchedule.id, item.scheduleId));

      // Post Debit to Customer Ledger
      await this.db.db.insert(schema.reLedgerEntries).values({
        tenantId,
        bookingId: item.bookingId,
        entryDate: now,
        docType: 'demand',
        docId: demandId,
        debit: item.totalDue.toFixed(2),
        credit: '0.00',
        narration: `Milestone Demand #${demandNo} for Stage ${stage.code} - ${stage.name}`,
      });

      generatedDemands.push({
        demandId,
        demandNo,
        bookingId: item.bookingId,
        unitNo: item.unitNo,
        applicantName: `${item.applicantFirstName} ${item.applicantLastName}`,
        amount: item.totalDue,
        dueDate,
      });
    }

    return {
      success: true,
      stageCode: stage.code,
      stageName: stage.name,
      generatedCount: generatedDemands.length,
      demands: generatedDemands,
    };
  }

  async listDemands(
    tenantId: number,
    query?: { siteId?: number | undefined; bookingId?: number | undefined; status?: string | undefined; search?: string | undefined }
  ) {
    const conditions = [eq(schema.reDemands.tenantId, tenantId)];
    if (query?.bookingId) {
      conditions.push(eq(schema.reDemands.bookingId, query.bookingId));
    }
    if (query?.status) {
      conditions.push(eq(schema.reDemands.status, query.status as any));
    }

    const rows = await this.db.db
      .select({
        id: schema.reDemands.id,
        uuid: schema.reDemands.uuid,
        demandNo: schema.reDemands.demandNo,
        demandDate: schema.reDemands.demandDate,
        dueDate: schema.reDemands.dueDate,
        principal: schema.reDemands.principal,
        gst: schema.reDemands.gst,
        interestCarried: schema.reDemands.interestCarried,
        total: schema.reDemands.total,
        status: schema.reDemands.status,
        sentVia: schema.reDemands.sentVia,
        sentAt: schema.reDemands.sentAt,
        bookingId: schema.reDemands.bookingId,
        bookingNo: schema.reBookings.bookingNo,
        unitId: schema.reBookings.unitId,
        unitNo: schema.reUnits.unitNo,
        siteId: schema.reUnits.siteId,
        carpetArea: schema.reUnits.carpetArea,
        stageId: schema.reDemands.payStageId,
        stageCode: schema.rePayStages.code,
        stageName: schema.rePayStages.name,
        applicantFirstName: schema.reBookingApplicants.firstName,
        applicantLastName: schema.reBookingApplicants.lastName,
        applicantMobile: schema.reBookingApplicants.mobile,
      })
      .from(schema.reDemands)
      .innerJoin(schema.reBookings, eq(schema.reDemands.bookingId, schema.reBookings.id))
      .innerJoin(schema.reUnits, eq(schema.reBookings.unitId, schema.reUnits.id))
      .leftJoin(schema.rePayStages, eq(schema.reDemands.payStageId, schema.rePayStages.id))
      .leftJoin(
        schema.reBookingApplicants,
        and(
          eq(schema.reBookingApplicants.bookingId, schema.reBookings.id),
          eq(schema.reBookingApplicants.type, 'primary')
        )
      )
      .where(and(...conditions))
      .orderBy(desc(schema.reDemands.createdAt));

    if (query?.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      return rows.filter(
        (r) =>
          r.demandNo.toLowerCase().includes(q) ||
          r.bookingNo.toLowerCase().includes(q) ||
          r.unitNo.toLowerCase().includes(q) ||
          (r.applicantFirstName || '').toLowerCase().includes(q) ||
          (r.applicantLastName || '').toLowerCase().includes(q) ||
          (r.applicantMobile || '').includes(q)
      );
    }

    return rows;
  }

  async getDemandDetail(tenantId: number, demandId: number) {
    const demand = await this.db.db.query.reDemands.findFirst({
      where: and(eq(schema.reDemands.id, demandId), eq(schema.reDemands.tenantId, tenantId)),
    });

    if (!demand) {
      throw new NotFoundException(`Demand ID ${demandId} not found`);
    }

    const booking = await this.getBookingCustomer360(tenantId, demand.bookingId);
    const stage = demand.payStageId
      ? await this.db.db.query.rePayStages.findFirst({
          where: eq(schema.rePayStages.id, demand.payStageId),
        })
      : null;

    const totalAmt = parseFloat(demand.total) || 0;
    const amountInWords = this.ledgerService.numberToIndianWords(totalAmt);

    return {
      demand,
      booking: booking.booking,
      primaryApplicant: booking.applicants[0],
      stage,
      amountInWords,
    };
  }

  async sendDemand(tenantId: number, demandId: number, sentVia: string) {
    const demand = await this.db.db.query.reDemands.findFirst({
      where: and(eq(schema.reDemands.id, demandId), eq(schema.reDemands.tenantId, tenantId)),
    });

    if (!demand) {
      throw new NotFoundException(`Demand ID ${demandId} not found`);
    }

    const now = new Date();
    await this.db.db
      .update(schema.reDemands)
      .set({
        status: 'sent',
        sentVia: sentVia || 'whatsapp',
        sentAt: now,
        updatedAt: now,
      })
      .where(eq(schema.reDemands.id, demandId));

    return { success: true, demandId, status: 'sent', sentVia, sentAt: now };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 7. RECEIPTS & MAKER-CHECKER WORKFLOW
  // ════════════════════════════════════════════════════════════════════════════

  async createReceipt(tenantId: number, userId: number, dto: CreateReceiptDto) {
    const booking = await this.db.db.query.reBookings.findFirst({
      where: and(eq(schema.reBookings.id, dto.bookingId), eq(schema.reBookings.tenantId, tenantId)),
    });

    if (!booking) {
      throw new NotFoundException(`Booking ID ${dto.bookingId} not found`);
    }

    // 1. Fetch due stages for this booking to calculate FIFO allocation
    const scheduleRows = await this.db.db
      .select({
        scheduleId: schema.rePaymentSchedule.id,
        payStageId: schema.rePaymentSchedule.payStageId,
        stageCode: schema.rePayStages.code,
        stageName: schema.rePayStages.name,
        amount: schema.rePaymentSchedule.amount,
        gstAmt: schema.rePaymentSchedule.gstAmt,
        paidAmount: schema.rePaymentSchedule.paidAmount,
      })
      .from(schema.rePaymentSchedule)
      .innerJoin(schema.rePayStages, eq(schema.rePaymentSchedule.payStageId, schema.rePayStages.id))
      .where(
        and(
          eq(schema.rePaymentSchedule.tenantId, tenantId),
          eq(schema.rePaymentSchedule.bookingId, dto.bookingId)
        )
      )
      .orderBy(schema.rePayStages.sequence);

    const stagesDue: StageDue[] = scheduleRows.map((s) => {
      const basic = parseFloat(s.amount) || 0;
      const gst = parseFloat(s.gstAmt) || 0;
      const totalDue = basic + gst;
      const paidSoFar = parseFloat(s.paidAmount) || 0;
      return {
        scheduleId: s.scheduleId,
        payStageId: s.payStageId,
        stageCode: s.stageCode,
        stageName: s.stageName,
        totalDue,
        paidSoFar,
        balanceDue: Math.max(0, totalDue - paidSoFar),
      };
    });

    // 2. Perform FIFO allocation
    const fifo = this.ledgerService.allocateReceiptFifo(stagesDue, dto.amount);

    // 3. Check TDS 194-IA
    const agreementValue = parseFloat(booking.agreementValue || '0') || 0;
    const tdsCalc = this.ledgerService.calculateTds194IA(dto.amount, agreementValue, !dto.tdsApplicable);

    // 4. Generate Receipt Number
    const receiptNo = await this.generateDocNumber(tenantId, 'RC', 'RC');

    const now = new Date();
    const receiptDate = dto.receiptDate ? new Date(dto.receiptDate) : now;

    // 5. Insert Receipt in 'pending_approval' status (Maker step)
    const [receiptResult] = await this.db.db.insert(schema.reReceipts).values({
      uuid: randomUUID(),
      tenantId,
      receiptNo,
      bookingId: dto.bookingId,
      receiptDate,
      mode: dto.mode,
      instrumentNo: dto.instrumentNo || null,
      instrumentDate: dto.instrumentDate ? new Date(dto.instrumentDate) : null,
      drawnOnBank: dto.drawnOnBank || null,
      depositBankId: dto.depositBankId || null,
      amount: dto.amount.toFixed(2),
      tdsApplicable: tdsCalc.tdsApplicable,
      tdsPct: tdsCalc.tdsRatePct.toFixed(4),
      tdsAmount: tdsCalc.tdsAmount.toFixed(2),
      gstComponent: '0.00',
      status: 'pending_approval',
      narration: dto.narration || null,
      attachmentUrl: dto.attachmentUrl || null,
      tallySynced: false,
      createdBy: userId,
    });

    const receiptId = receiptResult.insertId;

    // 6. Save Allocations
    for (const alloc of fifo.allocations) {
      await this.db.db.insert(schema.reReceiptAllocations).values({
        receiptId,
        scheduleId: alloc.scheduleId,
        chargeType: 'milestone_installment',
        amount: alloc.allocatedAmount.toFixed(2),
      });
    }

    // 7. Register Approval task for Collections Accountant
    await this.db.db.insert(schema.reApprovals).values({
      uuid: randomUUID(),
      tenantId,
      entity: 'receipt',
      entityId: receiptId,
      level: 1,
      approverRole: 'crm_accounts',
      status: 'pending',
      remarks: `Receipt #${receiptNo} for ₹${dto.amount.toLocaleString('en-IN')} via ${dto.mode.toUpperCase()} pending clearance verification.`,
    });

    return {
      success: true,
      receiptId,
      receiptNo,
      amount: dto.amount,
      status: 'pending_approval',
      tds: tdsCalc,
      fifo,
    };
  }

  async listReceipts(
    tenantId: number,
    query?: { bookingId?: number | undefined; status?: string | undefined; search?: string | undefined }
  ) {
    const conditions = [eq(schema.reReceipts.tenantId, tenantId)];
    if (query?.bookingId) {
      conditions.push(eq(schema.reReceipts.bookingId, query.bookingId));
    }
    if (query?.status) {
      conditions.push(eq(schema.reReceipts.status, query.status as any));
    }

    const rows = await this.db.db
      .select({
        id: schema.reReceipts.id,
        uuid: schema.reReceipts.uuid,
        receiptNo: schema.reReceipts.receiptNo,
        receiptDate: schema.reReceipts.receiptDate,
        mode: schema.reReceipts.mode,
        instrumentNo: schema.reReceipts.instrumentNo,
        instrumentDate: schema.reReceipts.instrumentDate,
        drawnOnBank: schema.reReceipts.drawnOnBank,
        amount: schema.reReceipts.amount,
        tdsAmount: schema.reReceipts.tdsAmount,
        status: schema.reReceipts.status,
        realisedOn: schema.reReceipts.realisedOn,
        tallySynced: schema.reReceipts.tallySynced,
        bookingId: schema.reReceipts.bookingId,
        bookingNo: schema.reBookings.bookingNo,
        unitId: schema.reBookings.unitId,
        unitNo: schema.reUnits.unitNo,
        applicantFirstName: schema.reBookingApplicants.firstName,
        applicantLastName: schema.reBookingApplicants.lastName,
        applicantMobile: schema.reBookingApplicants.mobile,
      })
      .from(schema.reReceipts)
      .innerJoin(schema.reBookings, eq(schema.reReceipts.bookingId, schema.reBookings.id))
      .innerJoin(schema.reUnits, eq(schema.reBookings.unitId, schema.reUnits.id))
      .leftJoin(
        schema.reBookingApplicants,
        and(
          eq(schema.reBookingApplicants.bookingId, schema.reBookings.id),
          eq(schema.reBookingApplicants.type, 'primary')
        )
      )
      .where(and(...conditions))
      .orderBy(desc(schema.reReceipts.createdAt));

    if (query?.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      return rows.filter(
        (r) =>
          r.receiptNo.toLowerCase().includes(q) ||
          r.bookingNo.toLowerCase().includes(q) ||
          r.unitNo.toLowerCase().includes(q) ||
          (r.instrumentNo || '').toLowerCase().includes(q) ||
          (r.applicantFirstName || '').toLowerCase().includes(q) ||
          (r.applicantLastName || '').toLowerCase().includes(q)
      );
    }

    return rows;
  }

  async getReceiptDetail(tenantId: number, receiptId: number) {
    const receipt = await this.db.db.query.reReceipts.findFirst({
      where: and(eq(schema.reReceipts.id, receiptId), eq(schema.reReceipts.tenantId, tenantId)),
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt ID ${receiptId} not found`);
    }

    const booking = await this.getBookingCustomer360(tenantId, receipt.bookingId);

    const allocations = await this.db.db
      .select({
        id: schema.reReceiptAllocations.id,
        amount: schema.reReceiptAllocations.amount,
        chargeType: schema.reReceiptAllocations.chargeType,
        scheduleId: schema.reReceiptAllocations.scheduleId,
        stageCode: schema.rePayStages.code,
        stageName: schema.rePayStages.name,
      })
      .from(schema.reReceiptAllocations)
      .leftJoin(schema.rePaymentSchedule, eq(schema.reReceiptAllocations.scheduleId, schema.rePaymentSchedule.id))
      .leftJoin(schema.rePayStages, eq(schema.rePaymentSchedule.payStageId, schema.rePayStages.id))
      .where(eq(schema.reReceiptAllocations.receiptId, receiptId));

    const totalAmt = parseFloat(receipt.amount) || 0;
    const amountInWords = this.ledgerService.numberToIndianWords(totalAmt);

    return {
      receipt,
      booking: booking.booking,
      primaryApplicant: booking.applicants[0],
      allocations,
      amountInWords,
    };
  }

  async approveReceipt(tenantId: number, receiptId: number, userId: number) {
    const receipt = await this.db.db.query.reReceipts.findFirst({
      where: and(eq(schema.reReceipts.id, receiptId), eq(schema.reReceipts.tenantId, tenantId)),
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt ID ${receiptId} not found`);
    }

    if (receipt.status === 'passed') {
      return { success: true, message: 'Receipt already passed.' };
    }

    const now = new Date();

    // 1. Mark receipt as 'passed'
    await this.db.db
      .update(schema.reReceipts)
      .set({
        status: 'passed',
        realisedOn: now,
        updatedAt: now,
      })
      .where(eq(schema.reReceipts.id, receiptId));

    // 2. Fetch allocations and update re_payment_schedule
    const allocations = await this.db.db
      .select()
      .from(schema.reReceiptAllocations)
      .where(eq(schema.reReceiptAllocations.receiptId, receiptId));

    for (const alloc of allocations) {
      if (alloc.scheduleId) {
        const scheduleRow = await this.db.db.query.rePaymentSchedule.findFirst({
          where: eq(schema.rePaymentSchedule.id, alloc.scheduleId),
        });

        if (scheduleRow) {
          const currentPaid = parseFloat(scheduleRow.paidAmount || '0') || 0;
          const allocAmt = parseFloat(alloc.amount) || 0;
          const newPaid = currentPaid + allocAmt;
          const stageTotal = (parseFloat(scheduleRow.amount) || 0) + (parseFloat(scheduleRow.gstAmt) || 0);

          const newStatus = newPaid >= stageTotal - 0.01 ? 'paid' : 'partly_paid';

          await this.db.db
            .update(schema.rePaymentSchedule)
            .set({
              paidAmount: newPaid.toFixed(2),
              status: newStatus,
              updatedAt: now,
            })
            .where(eq(schema.rePaymentSchedule.id, alloc.scheduleId));
        }
      }
    }

    // 3. Post Credit to Customer Ledger
    await this.db.db.insert(schema.reLedgerEntries).values({
      tenantId,
      bookingId: receipt.bookingId,
      entryDate: receipt.receiptDate,
      docType: 'receipt',
      docId: receiptId,
      debit: '0.00',
      credit: receipt.amount,
      narration: `Payment Received #${receipt.receiptNo} via ${receipt.mode.toUpperCase()}${receipt.instrumentNo ? ' Ref: ' + receipt.instrumentNo : ''}`,
    });

    // 4. Mark approval task completed
    await this.db.db
      .update(schema.reApprovals)
      .set({
        status: 'approved',
        actedBy: userId,
        actedAt: now,
        remarks: 'Receipt verified and realized into escrow account.',
      })
      .where(
        and(
          eq(schema.reApprovals.entity, 'receipt'),
          eq(schema.reApprovals.entityId, receiptId),
          eq(schema.reApprovals.tenantId, tenantId)
        )
      );

    return { success: true, receiptId, status: 'passed' };
  }

  async bounceReceipt(
    tenantId: number,
    receiptId: number,
    userId: number,
    reason: string,
    bounceCharges = 750
  ) {
    const receipt = await this.db.db.query.reReceipts.findFirst({
      where: and(eq(schema.reReceipts.id, receiptId), eq(schema.reReceipts.tenantId, tenantId)),
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt ID ${receiptId} not found`);
    }

    const now = new Date();

    // 1. Mark receipt as 'bounced'
    await this.db.db
      .update(schema.reReceipts)
      .set({
        status: 'bounced',
        bounceCharges: bounceCharges.toFixed(2),
        narration: reason || 'Cheque dishonored / funds insufficient',
        updatedAt: now,
      })
      .where(eq(schema.reReceipts.id, receiptId));

    // 2. Post Bounce Penalty Debit to Ledger
    await this.db.db.insert(schema.reLedgerEntries).values({
      tenantId,
      bookingId: receipt.bookingId,
      entryDate: now,
      docType: 'cheque_bounce',
      docId: receiptId,
      debit: bounceCharges.toFixed(2),
      credit: '0.00',
      narration: `Cheque Bounce Penalty #${receipt.receiptNo} (${receipt.instrumentNo || 'N/A'}): ${reason}`,
    });

    // 3. Mark approval rejected
    await this.db.db
      .update(schema.reApprovals)
      .set({
        status: 'rejected',
        actedBy: userId,
        actedAt: now,
        remarks: `Receipt bounced: ${reason}`,
      })
      .where(
        and(
          eq(schema.reApprovals.entity, 'receipt'),
          eq(schema.reApprovals.entityId, receiptId),
          eq(schema.reApprovals.tenantId, tenantId)
        )
      );

    return { success: true, receiptId, status: 'bounced', bounceCharges };
  }

  async exportReceiptToTally(tenantId: number, receiptId: number) {
    const receiptDetail = await this.getReceiptDetail(tenantId, receiptId);
    const r = receiptDetail.receipt;
    const b = receiptDetail.booking;
    const app = receiptDetail.primaryApplicant;

    const tallyDate = (r.receiptDate ? new Date(r.receiptDate) : new Date())
      .toISOString()
      .split('T')[0]!
      .replace(/-/g, '');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Receipt" ACTION="Create">
            <DATE>${tallyDate}</DATE>
            <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${r.receiptNo}</VOUCHERNUMBER>
            <REFERENCE>${r.instrumentNo || ''}</REFERENCE>
            <PARTYLEDGERNAME>${app?.firstName || 'Customer'} ${app?.lastName || ''} (Unit ${b?.unit?.unitNo})</PARTYLEDGERNAME>
            <NARRATION>BuildERP Realty: ${r.receiptNo} | Unit: ${b?.unit?.unitNo} | Mode: ${r.mode.toUpperCase()}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${r.mode === 'cash' ? 'Cash' : 'Bank Escrow Account'}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${r.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${app?.firstName || 'Customer'} ${app?.lastName || ''}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${r.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    await this.db.db
      .update(schema.reReceipts)
      .set({ tallySynced: true, updatedAt: new Date() })
      .where(eq(schema.reReceipts.id, receiptId));

    return {
      success: true,
      receiptNo: r.receiptNo,
      tallyXml: xml,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 8. CUSTOMER LEDGER & STATEMENT OF ACCOUNT (SOA)
  // ════════════════════════════════════════════════════════════════════════════

  async getBookingLedger(tenantId: number, bookingId: number) {
    const booking = await this.db.db.query.reBookings.findFirst({
      where: and(eq(schema.reBookings.id, bookingId), eq(schema.reBookings.tenantId, tenantId)),
    });

    if (!booking) {
      throw new NotFoundException(`Booking ID ${bookingId} not found`);
    }

    const unit = await this.db.db.query.reUnits.findFirst({
      where: and(eq(schema.reUnits.id, booking.unitId), eq(schema.reUnits.tenantId, tenantId)),
    });

    const primaryApplicant = await this.db.db.query.reBookingApplicants.findFirst({
      where: and(
        eq(schema.reBookingApplicants.bookingId, bookingId),
        eq(schema.reBookingApplicants.tenantId, tenantId),
        eq(schema.reBookingApplicants.type, 'primary')
      ),
    });

    // Fetch ledger entries ordered by entryDate ASC
    const entries = await this.db.db
      .select()
      .from(schema.reLedgerEntries)
      .where(
        and(
          eq(schema.reLedgerEntries.tenantId, tenantId),
          eq(schema.reLedgerEntries.bookingId, bookingId)
        )
      )
      .orderBy(asc(schema.reLedgerEntries.entryDate), asc(schema.reLedgerEntries.id));

    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const statementRows = entries.map((e) => {
      const debit = parseFloat(e.debit) || 0;
      const credit = parseFloat(e.credit) || 0;
      totalDebit += debit;
      totalCredit += credit;
      runningBalance = runningBalance + debit - credit;

      return {
        id: e.id,
        entryDate: e.entryDate,
        docType: e.docType,
        docId: e.docId,
        narration: e.narration,
        debit,
        credit,
        runningBalance: Math.round(runningBalance * 100) / 100,
      };
    });

    return {
      booking: {
        id: booking.id,
        bookingNo: booking.bookingNo,
        bookingDate: booking.bookingDate,
        status: booking.status,
        unitNo: unit?.unitNo || '-',
        agreementValue: parseFloat(booking.agreementValue || '0'),
        grandTotal: parseFloat(booking.grandTotalInclGst || '0'),
      },
      customer: {
        name: `${primaryApplicant?.firstName || ''} ${primaryApplicant?.lastName || ''}`.trim(),
        mobile: primaryApplicant?.mobile,
        email: primaryApplicant?.email,
        pan: primaryApplicant?.pan,
      },
      summary: {
        openingBalance: 0,
        totalDebit: Math.round(totalDebit * 100) / 100,
        totalCredit: Math.round(totalCredit * 100) / 100,
        closingBalance: Math.round(runningBalance * 100) / 100,
      },
      entries: statementRows,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 9. NIGHTLY INTEREST ACCRUAL & WAIVER
  // ════════════════════════════════════════════════════════════════════════════

  async accrueNightlyInterest(tenantId: number, asOfDateStr?: string) {
    const asOf = asOfDateStr ? new Date(asOfDateStr) : new Date();

    // Fetch all overdue schedule items
    const overdueSchedules = await this.db.db
      .select({
        scheduleId: schema.rePaymentSchedule.id,
        bookingId: schema.rePaymentSchedule.bookingId,
        amount: schema.rePaymentSchedule.amount,
        gstAmt: schema.rePaymentSchedule.gstAmt,
        paidAmount: schema.rePaymentSchedule.paidAmount,
        dueDate: schema.rePaymentSchedule.dueDate,
        status: schema.rePaymentSchedule.status,
      })
      .from(schema.rePaymentSchedule)
      .where(
        and(
          eq(schema.rePaymentSchedule.tenantId, tenantId),
          inArray(schema.rePaymentSchedule.status, ['demanded', 'partly_paid', 'overdue'])
        )
      );

    let accruedCount = 0;
    let totalAccruedAmount = 0;

    for (const s of overdueSchedules) {
      if (!s.dueDate) continue;

      const totalDue = (parseFloat(s.amount) || 0) + (parseFloat(s.gstAmt) || 0);
      const paid = parseFloat(s.paidAmount) || 0;
      const principal = Math.max(0, totalDue - paid);

      if (principal <= 0) continue;

      const calc = this.interestService.calculateInterest({
        principalAmount: principal,
        dueDate: s.dueDate,
        asOfDate: asOf,
        annualRatePct: 18.0,
        graceDays: 7,
      });

      if (calc.isOverdue && calc.interestAmount > 0) {
        // Record interest entry
        await this.db.db.insert(schema.reInterestEntries).values({
          tenantId,
          bookingId: s.bookingId,
          scheduleId: s.scheduleId,
          fromDate: s.dueDate,
          toDate: asOf,
          days: calc.billableDays,
          rate: calc.annualRatePct.toFixed(4),
          amount: calc.interestAmount.toFixed(2),
          waivedAmount: '0.00',
        });

        // Mark schedule as overdue
        await this.db.db
          .update(schema.rePaymentSchedule)
          .set({ status: 'overdue', updatedAt: new Date() })
          .where(eq(schema.rePaymentSchedule.id, s.scheduleId));

        accruedCount++;
        totalAccruedAmount += calc.interestAmount;
      }
    }

    return {
      success: true,
      asOfDate: asOf,
      accruedCount,
      totalAccruedAmount: Math.round(totalAccruedAmount * 100) / 100,
    };
  }

  async waiveInterest(
    tenantId: number,
    interestId: number,
    userId: number,
    waivedAmount: number,
    remarks: string
  ) {
    const entry = await this.db.db.query.reInterestEntries.findFirst({
      where: and(eq(schema.reInterestEntries.id, interestId), eq(schema.reInterestEntries.tenantId, tenantId)),
    });

    if (!entry) {
      throw new NotFoundException(`Interest entry ID ${interestId} not found`);
    }

    const currentAmount = parseFloat(entry.amount) || 0;
    const finalWaived = Math.min(currentAmount, Math.max(0, waivedAmount));

    await this.db.db
      .update(schema.reInterestEntries)
      .set({
        waivedAmount: finalWaived.toFixed(2),
      })
      .where(eq(schema.reInterestEntries.id, interestId));

    // Register waiver approval audit log
    await this.db.db.insert(schema.reApprovals).values({
      uuid: randomUUID(),
      tenantId,
      entity: 'interest_waiver',
      entityId: interestId,
      level: 1,
      approverRole: 'sales_head',
      status: 'approved',
      actedBy: userId,
      actedAt: new Date(),
      remarks: `Waived ₹${finalWaived.toLocaleString('en-IN')}: ${remarks}`,
    });

    return {
      success: true,
      interestId,
      originalAmount: currentAmount,
      waivedAmount: finalWaived,
      netPayable: Math.max(0, currentAmount - finalWaived),
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 10. LETTERS & NOTICES ISSUANCE
  // ════════════════════════════════════════════════════════════════════════════

  async getLetterTemplates(tenantId: number) {
    return this.db.db
      .select()
      .from(schema.reLetterTemplates)
      .where(eq(schema.reLetterTemplates.tenantId, tenantId));
  }

  async issueLetter(tenantId: number, _userId: number, dto: IssueLetterDto) {
    const bookingDetail = await this.getBookingCustomer360(tenantId, dto.bookingId);
    const b = bookingDetail.booking;
    const app = bookingDetail.applicants[0];
    const unit = b?.unit;

    const templates = await this.getLetterTemplates(tenantId);
    let template = templates.find((t) => t.type === dto.templateType);

    const customerName = `${app?.firstName || 'Valued Customer'} ${app?.lastName || ''}`.trim();
    const unitNo = unit?.unitNo || 'N/A';
    const agreementValue = parseFloat(b?.agreementValue || '0').toLocaleString('en-IN');
    const outstanding = bookingDetail.kpis.totalOutstanding.toLocaleString('en-IN');
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    let subject = dto.customSubject || `Letter from Kings Heights: ${dto.templateType.toUpperCase()}`;
    let body = dto.customBody || template?.bodyHtml || '';

    // If template was not seeded yet, fallback to high-quality template
    if (!body) {
      if (dto.templateType === 'demand') {
        subject = `Demand Intimation for Unit ${unitNo} - Kings Heights`;
        body = `Dear ${customerName},<br><br>This is to intimate you that the milestone construction for your unit <strong>${unitNo}</strong> has been achieved. Please find the demand for ₹${outstanding} due within 15 days.<br><br>Thank you,<br>Kings Builders & Developers`;
      } else if (dto.templateType === 'allotment') {
        subject = `Allotment Letter for Apartment ${unitNo} - Kings Heights`;
        body = `Dear ${customerName},<br><br>We take immense pleasure in issuing this Provisional Allotment Letter for Unit <strong>${unitNo}</strong> at Kings Heights with an Agreement Value of ₹${agreementValue}.<br><br>Warm Regards,<br>Kings Builders & Developers`;
      } else {
        subject = `Communication for Unit ${unitNo}`;
        body = `Dear ${customerName},<br><br>Regarding your booking for Unit ${unitNo} at Kings Heights on ${today}. Current outstanding balance: ₹${outstanding}.<br><br>Regards,<br>Kings Builders`;
      }
    } else {
      // Replace merge fields
      body = body
        .replace(/{{customer_name}}/g, customerName)
        .replace(/{{unit_no}}/g, unitNo)
        .replace(/{{agreement_value}}/g, agreementValue)
        .replace(/{{outstanding_amount}}/g, outstanding)
        .replace(/{{date}}/g, today);
    }

    const [letterResult] = await this.db.db.insert(schema.reLettersIssued).values({
      tenantId,
      bookingId: dto.bookingId,
      templateId: template?.id || 1,
      sentVia: 'email',
      sentAt: new Date(),
      pdfUrl: null,
    });

    return {
      success: true,
      letterId: letterResult.insertId,
      subject,
      bodyHtml: body,
      issuedTo: customerName,
      unitNo,
      issuedAt: new Date(),
    };
  }

  async listLettersIssued(tenantId: number, bookingId?: number) {
    const conditions = [eq(schema.reLettersIssued.tenantId, tenantId)];
    if (bookingId) {
      conditions.push(eq(schema.reLettersIssued.bookingId, bookingId));
    }

    const rows = await this.db.db
      .select({
        id: schema.reLettersIssued.id,
        bookingId: schema.reLettersIssued.bookingId,
        templateId: schema.reLettersIssued.templateId,
        issuedAt: schema.reLettersIssued.issuedAt,
        sentVia: schema.reLettersIssued.sentVia,
        bookingNo: schema.reBookings.bookingNo,
        unitNo: schema.reUnits.unitNo,
        applicantFirstName: schema.reBookingApplicants.firstName,
        applicantLastName: schema.reBookingApplicants.lastName,
        templateName: schema.reLetterTemplates.name,
        templateType: schema.reLetterTemplates.type,
        bodyHtml: schema.reLetterTemplates.bodyHtml,
      })
      .from(schema.reLettersIssued)
      .innerJoin(schema.reBookings, eq(schema.reLettersIssued.bookingId, schema.reBookings.id))
      .leftJoin(schema.reUnits, eq(schema.reBookings.unitId, schema.reUnits.id))
      .leftJoin(schema.reLetterTemplates, eq(schema.reLettersIssued.templateId, schema.reLetterTemplates.id))
      .leftJoin(
        schema.reBookingApplicants,
        and(
          eq(schema.reBookingApplicants.bookingId, schema.reBookings.id),
          eq(schema.reBookingApplicants.type, 'primary')
        )
      )
      .where(and(...conditions))
      .orderBy(desc(schema.reLettersIssued.issuedAt));

    return rows.map((r) => {
      const custName = r.applicantFirstName
        ? `${r.applicantFirstName} ${r.applicantLastName || ''}`.trim()
        : 'Valued Customer';
      const uNo = r.unitNo || 'N/A';
      const tName = r.templateName || (r.templateType ? r.templateType.toUpperCase() : 'Notice');
      return {
        id: r.id,
        letterNo: `LTR-${String(r.id).padStart(5, '0')}`,
        bookingId: r.bookingId,
        bookingNo: r.bookingNo,
        unitNo: uNo,
        customerName: custName,
        templateType: r.templateType || 'allotment',
        templateName: tName,
        issueDate: r.issuedAt ? new Date(r.issuedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        sentVia: r.sentVia || 'email',
        subject: `${tName} - Unit ${uNo}`,
        content: r.bodyHtml || '',
      };
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 11. CANCELLATION & TRANSFER
  // ════════════════════════════════════════════════════════════════════════════

  async cancelBooking(
    tenantId: number,
    bookingId: number,
    userId: number,
    dto: CancelBookingDto
  ) {
    const booking = await this.db.db.query.reBookings.findFirst({
      where: and(eq(schema.reBookings.id, bookingId), eq(schema.reBookings.tenantId, tenantId)),
    });

    if (!booking) {
      throw new NotFoundException(`Booking ID ${bookingId} not found`);
    }

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking is already cancelled.');
    }

    // 1. Calculate total received till date
    const receipts = await this.db.db
      .select({ amount: schema.reReceipts.amount })
      .from(schema.reReceipts)
      .where(
        and(
          eq(schema.reReceipts.bookingId, bookingId),
          eq(schema.reReceipts.tenantId, tenantId),
          eq(schema.reReceipts.status, 'passed')
        )
      );

    const receivedTotal = receipts.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const cancellationFee = dto.cancellationCharges ?? (receivedTotal > 0 ? Math.min(200000, receivedTotal * 0.1) : 0);
    const refundAmount = Math.max(0, receivedTotal - cancellationFee);

    const now = new Date();
    const cancellationNo = await this.generateDocNumber(tenantId, 'CX', 'CX');

    // 2. Insert into re_cancellations
    await this.db.db.insert(schema.reCancellations).values({
      uuid: randomUUID(),
      tenantId,
      bookingId,
      cancellationNo,
      receivedTillDate: now,
      cancellationCharges: cancellationFee.toFixed(2),
      tds: '0.00',
      gstReversal: '0.00',
      refundAmount: refundAmount.toFixed(2),
      refundStatus: refundAmount > 0 ? 'pending' : 'processed',
      createdBy: userId,
    });

    // 3. Update Booking Status to cancelled
    await this.db.db
      .update(schema.reBookings)
      .set({
        status: 'cancelled',
        updatedAt: now,
      })
      .where(eq(schema.reBookings.id, bookingId));

    // 4. Release Unit back to available
    await this.db.db
      .update(schema.reUnits)
      .set({
        status: 'available',
        holdBy: null,
        holdTill: null,
        updatedAt: now,
      })
      .where(eq(schema.reUnits.id, booking.unitId));

    // 5. Release Parking Slot back to available
    const allocatedParking = await this.db.db.query.reBookingParkings.findFirst({
      where: eq(schema.reBookingParkings.bookingId, bookingId),
    });

    if (allocatedParking) {
      await this.db.db
        .update(schema.reParkingSlots)
        .set({
          status: 'available',
          bookingId: null,
          updatedAt: now,
        })
        .where(eq(schema.reParkingSlots.id, allocatedParking.slotId));
    }

    return {
      success: true,
      bookingId,
      status: 'cancelled',
      cancellationNo,
      receivedTotal,
      cancellationFee,
      refundAmount,
    };
  }

  async transferBooking(
    tenantId: number,
    bookingId: number,
    userId: number,
    dto: TransferBookingDto
  ) {
    const booking = await this.db.db.query.reBookings.findFirst({
      where: and(eq(schema.reBookings.id, bookingId), eq(schema.reBookings.tenantId, tenantId)),
    });

    if (!booking) {
      throw new NotFoundException(`Booking ID ${bookingId} not found`);
    }

    const primaryApp = await this.db.db.query.reBookingApplicants.findFirst({
      where: and(
        eq(schema.reBookingApplicants.bookingId, bookingId),
        eq(schema.reBookingApplicants.type, 'primary')
      ),
    });

    const now = new Date();
    const transferFee = dto.transferFee ?? 50000;

    // 1. Insert new primary applicant
    const newAadhaarEnc = dto.newApplicant.aadhaar ? encryptAadhaar(dto.newApplicant.aadhaar) : null;
    const [newAppResult] = await this.db.db.insert(schema.reBookingApplicants).values({
      uuid: randomUUID(),
      tenantId,
      bookingId,
      type: 'primary',
      title: dto.newApplicant.title || 'Mr.',
      firstName: dto.newApplicant.firstName,
      lastName: dto.newApplicant.lastName,
      pan: dto.newApplicant.pan ? dto.newApplicant.pan.toUpperCase() : null,
      aadhaarEnc: newAadhaarEnc,
      mobile: dto.newApplicant.mobile,
      email: dto.newApplicant.email || null,
      permanentAddress: dto.newApplicant.address || null,
      createdBy: userId,
    });

    // 2. Mark old applicant as transferred
    if (primaryApp) {
      await this.db.db
        .update(schema.reBookingApplicants)
        .set({ type: 'co3', updatedAt: now })
        .where(eq(schema.reBookingApplicants.id, primaryApp.id));
    }

    // 3. Record in re_transfers
    await this.db.db.insert(schema.reTransfers).values({
      uuid: randomUUID(),
      tenantId,
      oldBookingId: bookingId,
      newBookingId: bookingId,
      transferDate: now,
      reason: dto.reason || 'Unit transferred to new allottee',
      status: 'completed',
      createdBy: userId,
    });

    // 4. Record transfer fee debit in ledger
    if (transferFee > 0) {
      await this.db.db.insert(schema.reLedgerEntries).values({
        tenantId,
        bookingId,
        entryDate: now,
        docType: 'transfer_fee',
        docId: bookingId,
        debit: transferFee.toFixed(2),
        credit: '0.00',
        narration: `Nomination / Unit Transfer Administrative Fee`,
      });
    }

    return {
      success: true,
      bookingId,
      newApplicantId: newAppResult.insertId,
      newApplicantName: `${dto.newApplicant.firstName} ${dto.newApplicant.lastName}`,
      transferFee,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 12. DPR MILESTONE LINKAGE NOTIFICATION HOOK
  // ════════════════════════════════════════════════════════════════════════════

  async notifyDprMilestoneCompleted(tenantId: number, milestoneName: string, siteId: number) {
    // Find matching pay stage by name similarity or milestone
    const stages = await this.db.db
      .select()
      .from(schema.rePayStages)
      .where(and(eq(schema.rePayStages.tenantId, tenantId), eq(schema.rePayStages.siteId, siteId)));

    const matched = stages.find(
      (s) =>
        s.name.toLowerCase().includes(milestoneName.toLowerCase()) ||
        milestoneName.toLowerCase().includes(s.name.toLowerCase())
    );

    if (matched) {
      const eligible = await this.getEligibleBookingsForStage(tenantId, matched.id);
      return {
        matchedStageId: matched.id,
        matchedStageCode: matched.code,
        matchedStageName: matched.name,
        eligibleBookingsCount: eligible.length,
        notificationMessage: `DPR Milestone "${milestoneName}" completed on site: ${eligible.length} bookings eligible for demand generation under Stage ${matched.code}.`,
      };
    }

    return {
      matchedStageId: null,
      message: `No matching payment stage found for milestone "${milestoneName}".`,
    };
  }

  // ── 8. BOOKING & RECEIPT LIFECYCLE EXTENSIONS (Update/Delete) ──────────────
  async deleteBooking(tenantId: number, bookingId: number, _userId: number) {
    const booking = await this.db.db.query.reBookings.findFirst({
      where: and(eq(schema.reBookings.id, bookingId), eq(schema.reBookings.tenantId, tenantId)),
    });

    if (!booking) {
      throw new NotFoundException(`Booking ID ${bookingId} not found`);
    }

    if (['agreement_done', 'registered', 'possession'].includes(booking.status)) {
      throw new BadRequestException('Cannot hard delete an executed/registered booking. Use Cancel Booking instead.');
    }

    // 1. Release unit status back to available
    await this.db.db
      .update(schema.reUnits)
      .set({ status: 'available' })
      .where(eq(schema.reUnits.id, booking.unitId));

    // 2. Cascade delete linked records
    await this.db.db.delete(schema.reBookingApplicants).where(eq(schema.reBookingApplicants.bookingId, bookingId));
    await this.db.db.delete(schema.reBookingDocuments).where(eq(schema.reBookingDocuments.bookingId, bookingId));
    await this.db.db.delete(schema.reBookingCharges).where(eq(schema.reBookingCharges.bookingId, bookingId));
    await this.db.db.delete(schema.reBookingParkings).where(eq(schema.reBookingParkings.bookingId, bookingId));
    await this.db.db.delete(schema.rePaymentSchedule).where(eq(schema.rePaymentSchedule.bookingId, bookingId));
    await this.db.db.delete(schema.reApprovals).where(and(eq(schema.reApprovals.entity, 'booking'), eq(schema.reApprovals.entityId, bookingId)));
    await this.db.db.delete(schema.reLedgerEntries).where(eq(schema.reLedgerEntries.bookingId, bookingId));

    // 3. Delete booking
    await this.db.db.delete(schema.reBookings).where(eq(schema.reBookings.id, bookingId));

    return { message: `Booking ${booking.bookingNo} deleted successfully and Unit released back to inventory.` };
  }

  async updateReceipt(tenantId: number, receiptId: number, _userId: number, dto: any) {
    const receipt = await this.db.db.query.reReceipts.findFirst({
      where: and(eq(schema.reReceipts.id, receiptId), eq(schema.reReceipts.tenantId, tenantId)),
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt ID ${receiptId} not found`);
    }

    if (receipt.status === 'passed') {
      throw new BadRequestException('Approved / realized receipts cannot be modified.');
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (dto.amount !== undefined) updateData.amount = String(dto.amount);
    if (dto.mode !== undefined) updateData.mode = dto.mode;
    if (dto.instrumentNo !== undefined) updateData.instrumentNo = dto.instrumentNo;
    if (dto.instrumentDate !== undefined) updateData.instrumentDate = dto.instrumentDate ? new Date(dto.instrumentDate) : null;
    if (dto.drawnOnBank !== undefined) updateData.drawnOnBank = dto.drawnOnBank;
    if (dto.narration !== undefined) updateData.narration = dto.narration;
    if (dto.tdsApplicable !== undefined) updateData.tdsApplicable = dto.tdsApplicable;
    if (dto.tdsAmount !== undefined) updateData.tdsAmount = String(dto.tdsAmount);

    await this.db.db
      .update(schema.reReceipts)
      .set(updateData)
      .where(eq(schema.reReceipts.id, receiptId));

    return this.getReceiptDetail(tenantId, receiptId);
  }

  async deleteReceipt(tenantId: number, receiptId: number, _userId: number) {
    const receipt = await this.db.db.query.reReceipts.findFirst({
      where: and(eq(schema.reReceipts.id, receiptId), eq(schema.reReceipts.tenantId, tenantId)),
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt ID ${receiptId} not found`);
    }

    if (receipt.status === 'passed') {
      throw new BadRequestException('Approved receipts cannot be deleted. Use Mark Bounced instead.');
    }

    // Delete allocations and approvals
    await this.db.db.delete(schema.reReceiptAllocations).where(eq(schema.reReceiptAllocations.receiptId, receiptId));
    await this.db.db.delete(schema.reApprovals).where(and(eq(schema.reApprovals.entity, 'receipt'), eq(schema.reApprovals.entityId, receiptId)));
    await this.db.db.delete(schema.reReceipts).where(eq(schema.reReceipts.id, receiptId));

    return { message: `Receipt ${receipt.receiptNo} deleted successfully.` };
  }
}
