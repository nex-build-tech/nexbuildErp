import { Injectable } from '@nestjs/common';

export interface CostSheetCalculationInput {
  carpetArea: number; // in sq ft
  baseRate: number; // in ₹ per sq ft
  floorNo: number; // level_no (0 = Ground, 1..N)
  floorRiseRate?: number | undefined; // ₹ per sq ft per floor (applies from 5th floor upwards, i.e. floorNo - 4)
  plcRateOrAmount?: number | undefined; // flat ₹ or % based
  isPlcPct?: boolean | undefined;
  discountPct?: number | undefined; // discount percentage on agreement value
  flatDiscountAmt?: number | undefined; // flat discount amount in ₹
  parkingCharges?: number | undefined; // total parking charge
  stampDutyPct?: number | undefined; // default 6.0%
  metroCessPct?: number | undefined; // default 1.0%
  registrationPct?: number | undefined; // default 1.0%
  registrationCap?: number | undefined; // default ₹30,000 cap
  gstRate?: number | undefined; // default 5.0% for residential under-construction
  otherCharges?: Array<{
    code: string;
    name: string;
    calcType: 'fixed' | 'per_sqft' | 'pct_of_agreement' | 'per_month';
    value: number;
    gstApplicable: boolean;
    gstRate?: number | undefined; // e.g. 18.0%
    months?: number | undefined; // for per_month
  }> | undefined;
  schemeStages?: Array<{
    payStageId: number;
    code: string;
    name: string;
    pct: number;
  }> | undefined;
}

export interface CostSheetCalculationResult {
  // 1. Basic & Agreement Value Components
  carpetArea: number;
  baseRate: number;
  basicCost: number;
  floorNo: number;
  floorRiseApplicableFloors: number;
  floorRiseRate: number;
  floorRiseAmt: number;
  plcAmt: number;
  grossAgreementValue: number;

  // 2. Discount & Net Agreement
  discountPct: number;
  discountAmt: number;
  netAgreementValue: number;

  // 3. Statutory Taxes & Stamp Duty
  gstPct: number;
  gstAmt: number;
  stampDutyPct: number;
  stampDutyAmt: number;
  metroCessPct: number;
  metroCessAmt: number;
  registrationPct: number;
  registrationAmt: number;
  statutoryTaxesTotal: number;

  // 4. TDS 194-IA
  isTdsApplicable: boolean; // true if netAgreementValue >= 50,00,000
  tdsPct: number; // 1%
  tdsAmt: number; // 1% of netAgreementValue

  // 5. Parking
  parkingCharges: number;

  // 6. Other / Extra Charge Heads
  otherChargesBreakdown: Array<{
    code: string;
    name: string;
    baseAmount: number;
    gstRate: number;
    gstAmount: number;
    totalAmount: number;
  }>;
  otherChargesBaseTotal: number;
  otherChargesGstTotal: number;
  otherChargesGrandTotal: number;

  // 7. Overall Summary Totals
  grandTotalExclGst: number;
  totalGst: number;
  grandTotalInclGst: number;

  // 8. Milestone Payment Schedule (if scheme stages provided)
  paymentSchedule: Array<{
    payStageId: number;
    code: string;
    name: string;
    stagePct: number;
    demandedBasicAmount: number;
    demandedGstAmount: number;
    totalStageAmount: number;
    cumulativePct: number;
  }>;
}

@Injectable()
export class RealtyPricingService {
  /**
   * Computes the complete cost sheet and milestone payment schedule according to RERA
   * and Indian statutory tax rules (GST 5%, Stamp Duty 6%, Metro Cess 1%, Registration max 30k, TDS 194-IA 1%).
   */
  calculateCostSheet(input: CostSheetCalculationInput): CostSheetCalculationResult {
    const carpetArea = Math.max(0, Number(input.carpetArea) || 0);
    const baseRate = Math.max(0, Number(input.baseRate) || 0);
    const basicCost = Math.round(carpetArea * baseRate * 100) / 100;

    // Floor rise: applies above 4th floor (i.e. floor 5 = 1 rise, floor 6 = 2 rises, etc.)
    const floorNo = Math.max(0, Number(input.floorNo) || 0);
    const floorRiseApplicableFloors = Math.max(0, floorNo - 4);
    const floorRiseRate = Math.max(0, Number(input.floorRiseRate) || 0);
    const floorRiseAmt =
      Math.round(floorRiseApplicableFloors * floorRiseRate * carpetArea * 100) / 100;

    // PLC (Preferential Location Charges)
    let plcAmt = 0;
    const plcVal = Number(input.plcRateOrAmount) || 0;
    if (input.isPlcPct) {
      plcAmt = Math.round(basicCost * (plcVal / 100) * 100) / 100;
    } else {
      plcAmt = Math.max(0, plcVal);
    }

    const grossAgreementValue = Math.round((basicCost + floorRiseAmt + plcAmt) * 100) / 100;

    // Discount
    let discountAmt = 0;
    const discountPct = Math.max(0, Number(input.discountPct) || 0);
    if (discountPct > 0) {
      discountAmt = Math.round(grossAgreementValue * (discountPct / 100) * 100) / 100;
    } else if (input.flatDiscountAmt && input.flatDiscountAmt > 0) {
      discountAmt = Math.min(grossAgreementValue, Number(input.flatDiscountAmt));
    }

    const netAgreementValue = Math.max(0, Math.round((grossAgreementValue - discountAmt) * 100) / 100);

    // GST on under-construction property (default 5.0%)
    const gstPct = input.gstRate !== undefined ? Number(input.gstRate) : 5.0;
    const gstAmt = Math.round(netAgreementValue * (gstPct / 100) * 100) / 100;

    // Stamp duty (default 6.0%)
    const stampDutyPct = input.stampDutyPct !== undefined ? Number(input.stampDutyPct) : 6.0;
    const stampDutyAmt = Math.round(netAgreementValue * (stampDutyPct / 100) * 100) / 100;

    // Metro Cess (default 1.0%)
    const metroCessPct = input.metroCessPct !== undefined ? Number(input.metroCessPct) : 1.0;
    const metroCessAmt = Math.round(netAgreementValue * (metroCessPct / 100) * 100) / 100;

    // Registration (default 1.0%, capped at ₹30,000 in Maharashtra)
    const registrationPct = input.registrationPct !== undefined ? Number(input.registrationPct) : 1.0;
    const registrationCap = input.registrationCap !== undefined ? Number(input.registrationCap) : 30000;
    const rawRegistration = Math.round(netAgreementValue * (registrationPct / 100) * 100) / 100;
    const registrationAmt = Math.min(rawRegistration, registrationCap);

    const statutoryTaxesTotal =
      Math.round((gstAmt + stampDutyAmt + metroCessAmt + registrationAmt) * 100) / 100;

    // TDS 194-IA: 1% if Net Agreement Value >= ₹50,00,000 (50 Lakhs)
    const isTdsApplicable = netAgreementValue >= 5000000;
    const tdsPct = isTdsApplicable ? 1.0 : 0;
    const tdsAmt = isTdsApplicable ? Math.round(netAgreementValue * 0.01 * 100) / 100 : 0;

    // Parking
    const parkingCharges = Math.max(0, Number(input.parkingCharges) || 0);

    // Extra Charge Heads
    const otherChargesBreakdown: CostSheetCalculationResult['otherChargesBreakdown'] = [];
    let otherChargesBaseTotal = 0;
    let otherChargesGstTotal = 0;

    if (input.otherCharges && Array.isArray(input.otherCharges)) {
      for (const ch of input.otherCharges) {
        let baseAmount = 0;
        const val = Number(ch.value) || 0;

        if (ch.calcType === 'fixed') {
          baseAmount = val;
        } else if (ch.calcType === 'per_sqft') {
          baseAmount = Math.round(val * carpetArea * 100) / 100;
        } else if (ch.calcType === 'pct_of_agreement') {
          baseAmount = Math.round(netAgreementValue * (val / 100) * 100) / 100;
        } else if (ch.calcType === 'per_month') {
          const months = Number(ch.months) || 12;
          baseAmount = Math.round(val * months * 100) / 100;
        }

        let chGstRate = 0;
        let chGstAmt = 0;
        if (ch.gstApplicable) {
          chGstRate = Number(ch.gstRate) || 18.0;
          chGstAmt = Math.round(baseAmount * (chGstRate / 100) * 100) / 100;
        }

        const totalAmount = Math.round((baseAmount + chGstAmt) * 100) / 100;

        otherChargesBreakdown.push({
          code: ch.code,
          name: ch.name,
          baseAmount,
          gstRate: chGstRate,
          gstAmount: chGstAmt,
          totalAmount,
        });

        otherChargesBaseTotal += baseAmount;
        otherChargesGstTotal += chGstAmt;
      }
    }

    otherChargesBaseTotal = Math.round(otherChargesBaseTotal * 100) / 100;
    otherChargesGstTotal = Math.round(otherChargesGstTotal * 100) / 100;
    const otherChargesGrandTotal =
      Math.round((otherChargesBaseTotal + otherChargesGstTotal) * 100) / 100;

    // Grand Totals
    const grandTotalExclGst =
      Math.round(
        (netAgreementValue + parkingCharges + otherChargesBaseTotal + stampDutyAmt + metroCessAmt + registrationAmt) *
          100
      ) / 100;

    const totalGst = Math.round((gstAmt + otherChargesGstTotal) * 100) / 100;

    const grandTotalInclGst =
      Math.round((grandTotalExclGst + totalGst) * 100) / 100;

    // Payment Schedule Breakdown
    const paymentSchedule: CostSheetCalculationResult['paymentSchedule'] = [];
    if (input.schemeStages && Array.isArray(input.schemeStages)) {
      let cumulativePct = 0;
      for (const st of input.schemeStages) {
        const stagePct = Number(st.pct) || 0;
        cumulativePct += stagePct;
        const demandedBasicAmount =
          Math.round(netAgreementValue * (stagePct / 100) * 100) / 100;
        const demandedGstAmount =
          Math.round(demandedBasicAmount * (gstPct / 100) * 100) / 100;
        const totalStageAmount =
          Math.round((demandedBasicAmount + demandedGstAmount) * 100) / 100;

        paymentSchedule.push({
          payStageId: st.payStageId,
          code: st.code,
          name: st.name,
          stagePct,
          demandedBasicAmount,
          demandedGstAmount,
          totalStageAmount,
          cumulativePct: Math.round(cumulativePct * 10000) / 10000,
        });
      }
    }

    return {
      carpetArea,
      baseRate,
      basicCost,
      floorNo,
      floorRiseApplicableFloors,
      floorRiseRate,
      floorRiseAmt,
      plcAmt,
      grossAgreementValue,
      discountPct,
      discountAmt,
      netAgreementValue,
      gstPct,
      gstAmt,
      stampDutyPct,
      stampDutyAmt,
      metroCessPct,
      metroCessAmt,
      registrationPct,
      registrationAmt,
      statutoryTaxesTotal,
      isTdsApplicable,
      tdsPct,
      tdsAmt,
      parkingCharges,
      otherChargesBreakdown,
      otherChargesBaseTotal,
      otherChargesGstTotal,
      otherChargesGrandTotal,
      grandTotalExclGst,
      totalGst,
      grandTotalInclGst,
      paymentSchedule,
    };
  }
}
