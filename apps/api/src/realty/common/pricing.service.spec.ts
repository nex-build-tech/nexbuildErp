import { RealtyPricingService } from './pricing.service';

describe('RealtyPricingService', () => {
  let service: RealtyPricingService;

  beforeEach(() => {
    service = new RealtyPricingService();
  });

  describe('Basic Agreement Value & Floor Rise', () => {
    it('should compute basic cost accurately (680 sq ft @ ₹26,250)', () => {
      const res = service.calculateCostSheet({
        carpetArea: 680,
        baseRate: 26250,
        floorNo: 3,
        floorRiseRate: 50,
      });

      expect(res.basicCost).toBe(17850000); // 680 * 26250
      expect(res.floorRiseAmt).toBe(0); // 3rd floor <= 4th floor
      expect(res.grossAgreementValue).toBe(17850000);
      expect(res.netAgreementValue).toBe(17850000);
    });

    it('should not apply floor rise for floors 0 (Ground) to 4', () => {
      [0, 1, 2, 3, 4].forEach((floor) => {
        const res = service.calculateCostSheet({
          carpetArea: 500,
          baseRate: 20000,
          floorNo: floor,
          floorRiseRate: 50,
        });
        expect(res.floorRiseAmt).toBe(0);
        expect(res.floorRiseApplicableFloors).toBe(0);
      });
    });

    it('should calculate floor rise accurately for floors above 4', () => {
      // 5th floor = 1 floor rise: 1 * 50 * 680 = ₹34,000
      const res5 = service.calculateCostSheet({
        carpetArea: 680,
        baseRate: 26250,
        floorNo: 5,
        floorRiseRate: 50,
      });
      expect(res5.floorRiseApplicableFloors).toBe(1);
      expect(res5.floorRiseAmt).toBe(34000);

      // 10th floor = 6 floors rise: 6 * 50 * 680 = ₹2,04,000
      const res10 = service.calculateCostSheet({
        carpetArea: 680,
        baseRate: 26250,
        floorNo: 10,
        floorRiseRate: 50,
      });
      expect(res10.floorRiseApplicableFloors).toBe(6);
      expect(res10.floorRiseAmt).toBe(204000);
    });

    it('should support PLC as flat amount or percentage', () => {
      // Flat PLC
      const flatRes = service.calculateCostSheet({
        carpetArea: 1000,
        baseRate: 10000,
        floorNo: 1,
        plcRateOrAmount: 250000,
        isPlcPct: false,
      });
      expect(flatRes.plcAmt).toBe(250000);
      expect(flatRes.grossAgreementValue).toBe(10250000);

      // Percentage PLC: 3% of 1,00,00,000 = ₹3,00,000
      const pctRes = service.calculateCostSheet({
        carpetArea: 1000,
        baseRate: 10000,
        floorNo: 1,
        plcRateOrAmount: 3,
        isPlcPct: true,
      });
      expect(pctRes.plcAmt).toBe(300000);
      expect(pctRes.grossAgreementValue).toBe(10300000);
    });
  });

  describe('Discounts & Net Agreement Value', () => {
    it('should apply percentage discount correctly', () => {
      const res = service.calculateCostSheet({
        carpetArea: 1000,
        baseRate: 10000, // ₹1,00,00,000 basic
        floorNo: 1,
        discountPct: 2.5, // 2.5% discount = ₹2,50,000
      });

      expect(res.grossAgreementValue).toBe(10000000);
      expect(res.discountAmt).toBe(250000);
      expect(res.netAgreementValue).toBe(9750000);
    });

    it('should apply flat discount amount correctly', () => {
      const res = service.calculateCostSheet({
        carpetArea: 1000,
        baseRate: 10000,
        floorNo: 1,
        flatDiscountAmt: 500000,
      });

      expect(res.discountAmt).toBe(500000);
      expect(res.netAgreementValue).toBe(9500000);
    });
  });

  describe('Statutory Taxes & Maharashtra Caps', () => {
    it('should cap Maharashtra registration fee at ₹30,000', () => {
      // Agreement value = ₹1,00,00,000. 1% would be ₹1,00,000, but capped at ₹30,000.
      const res = service.calculateCostSheet({
        carpetArea: 1000,
        baseRate: 10000,
        floorNo: 1,
        registrationPct: 1.0,
        registrationCap: 30000,
      });

      expect(res.registrationAmt).toBe(30000);
    });

    it('should apply uncapped registration fee when below ₹30,000', () => {
      // Agreement value = ₹20,00,000. 1% is ₹20,000 < ₹30,000 cap.
      const res = service.calculateCostSheet({
        carpetArea: 200,
        baseRate: 10000,
        floorNo: 1,
        registrationPct: 1.0,
        registrationCap: 30000,
      });

      expect(res.registrationAmt).toBe(20000);
    });

    it('should compute Stamp Duty (6%) and Metro Cess (1%) and GST (5%) accurately', () => {
      // Agreement value = ₹1,00,00,000
      const res = service.calculateCostSheet({
        carpetArea: 1000,
        baseRate: 10000,
        floorNo: 1,
        stampDutyPct: 6.0,
        metroCessPct: 1.0,
        gstRate: 5.0,
      });

      expect(res.stampDutyAmt).toBe(600000); // 6% of 1 Cr
      expect(res.metroCessAmt).toBe(100000); // 1% of 1 Cr
      expect(res.gstAmt).toBe(500000); // 5% of 1 Cr
    });
  });

  describe('TDS Section 194-IA Rule', () => {
    it('should NOT apply TDS 194-IA when net agreement value is below ₹50,00,000', () => {
      const res = service.calculateCostSheet({
        carpetArea: 400,
        baseRate: 10000, // ₹40,00,000 < 50L
        floorNo: 1,
      });

      expect(res.isTdsApplicable).toBe(false);
      expect(res.tdsPct).toBe(0);
      expect(res.tdsAmt).toBe(0);
    });

    it('should apply 1% TDS 194-IA when net agreement value is >= ₹50,00,000', () => {
      const res = service.calculateCostSheet({
        carpetArea: 500,
        baseRate: 10000, // ₹50,00,000 = 50L exactly
        floorNo: 1,
      });

      expect(res.isTdsApplicable).toBe(true);
      expect(res.tdsPct).toBe(1.0);
      expect(res.tdsAmt).toBe(50000); // 1% of 50L
    });
  });

  describe('Other Charge Heads & GST', () => {
    it('should compute diverse charge heads with 18% GST', () => {
      const res = service.calculateCostSheet({
        carpetArea: 500,
        baseRate: 20000,
        floorNo: 1,
        otherCharges: [
          {
            code: 'MSEB',
            name: 'Electricity Connection',
            calcType: 'fixed',
            value: 100000,
            gstApplicable: true,
            gstRate: 18,
          },
          {
            code: 'DEV',
            name: 'Development Charges',
            calcType: 'per_sqft',
            value: 200, // 200 * 500 = 1,00,000
            gstApplicable: true,
            gstRate: 18,
          },
          {
            code: 'MAINT',
            name: 'Society Maintenance',
            calcType: 'per_month',
            value: 3000,
            months: 12, // 3000 * 12 = 36,000
            gstApplicable: false,
          },
        ],
      });

      expect(res.otherChargesBreakdown.length).toBe(3);
      // MSEB: 1,00,000 + 18,000 GST = 1,18,000
      expect(res.otherChargesBreakdown[0]?.baseAmount).toBe(100000);
      expect(res.otherChargesBreakdown[0]?.gstAmount).toBe(18000);
      expect(res.otherChargesBreakdown[0]?.totalAmount).toBe(118000);

      // DEV: 1,00,000 + 18,000 GST = 1,18,000
      expect(res.otherChargesBreakdown[1]?.baseAmount).toBe(100000);
      expect(res.otherChargesBreakdown[1]?.gstAmount).toBe(18000);

      // MAINT: 36,000 exempt = 36,000
      expect(res.otherChargesBreakdown[2]?.baseAmount).toBe(36000);
      expect(res.otherChargesBreakdown[2]?.gstAmount).toBe(0);

      expect(res.otherChargesBaseTotal).toBe(236000);
      expect(res.otherChargesGstTotal).toBe(36000);
      expect(res.otherChargesGrandTotal).toBe(272000);
    });
  });

  describe('Milestone Payment Schedule Generation', () => {
    it('should generate demand schedule summing exactly to 100% of agreement value', () => {
      const res = service.calculateCostSheet({
        carpetArea: 1000,
        baseRate: 10000, // 1 Cr
        floorNo: 1,
        schemeStages: [
          { payStageId: 1, code: 'A', name: 'Token', pct: 10 },
          { payStageId: 2, code: 'B', name: 'Plinth', pct: 20 },
          { payStageId: 3, code: 'C', name: 'Structure', pct: 40 },
          { payStageId: 4, code: 'D', name: 'Finishing', pct: 20 },
          { payStageId: 5, code: 'E', name: 'Possession', pct: 10 },
        ],
      });

      expect(res.paymentSchedule.length).toBe(5);
      const totalDemandedBasic = res.paymentSchedule.reduce(
        (sum, st) => sum + st.demandedBasicAmount,
        0
      );
      expect(totalDemandedBasic).toBe(res.netAgreementValue);
      expect(res.paymentSchedule[4]?.cumulativePct).toBe(100);
    });
  });
});
