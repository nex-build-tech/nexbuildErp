import { ChannelPartnersService } from './channel-partners.service';

describe('ChannelPartnersService - Brokerage Engine & Section 194-H TDS', () => {
  let cpService: ChannelPartnersService;

  beforeEach(() => {
    cpService = new ChannelPartnersService({ db: {} } as any);
  });

  describe('calculateBrokerageCalculation', () => {
    it('should calculate gross brokerage, 18% GST, 5% Section 194-H TDS, and net payable with GSTIN', () => {
      const agreementValue = 8500000; // ₹85,00,000 (Kings Heights 2 BHK)
      const slabPct = 2.5; // 2.5% brokerage slab
      const hasGstin = true;

      const result = cpService.calculateBrokerageCalculation(agreementValue, slabPct, hasGstin);

      // Base: ₹85,00,000
      expect(result.base).toBe(8500000);
      expect(result.pct).toBe(2.5);

      // Gross Brokerage: 85,00,000 * 2.5% = ₹2,12,500
      expect(result.brokerage).toBe(212500);

      // GST @ 18% on Brokerage: 2,12,500 * 18% = ₹38,250
      expect(result.gst).toBe(38250);

      // Section 194-H TDS @ 5% on Gross Brokerage: 2,12,500 * 5% = ₹10,625
      expect(result.tds194h).toBe(10625);

      // Net Payable = Brokerage + GST - TDS = 2,12,500 + 38,250 - 10,625 = ₹2,40,125
      expect(result.net).toBe(240125);
    });

    it('should calculate brokerage without GST when CP does not have GSTIN', () => {
      const agreementValue = 6000000; // ₹60,00,000
      const slabPct = 2.0; // 2.0% silver slab
      const hasGstin = false;

      const result = cpService.calculateBrokerageCalculation(agreementValue, slabPct, hasGstin);

      // Base: ₹60,00,000
      expect(result.base).toBe(6000000);
      // Gross: 60,00,000 * 2% = ₹1,20,000
      expect(result.brokerage).toBe(120000);
      // GST: 0
      expect(result.gst).toBe(0);
      // TDS 194-H: 1,20,000 * 5% = ₹6,000
      expect(result.tds194h).toBe(6000);
      // Net: 1,20,000 - 6,000 = ₹1,14,000
      expect(result.net).toBe(114000);
    });

    it('should calculate platinum tier brokerage (3.0%) accurately', () => {
      const agreementValue = 12000000; // ₹1.20 Crore (3 BHK Luxury)
      const slabPct = 3.0;
      const hasGstin = true;

      const result = cpService.calculateBrokerageCalculation(agreementValue, slabPct, hasGstin);

      // Gross: 1,20,00,000 * 3.0% = ₹3,60,000
      expect(result.brokerage).toBe(360000);
      // GST: 3,60,000 * 18% = ₹64,800
      expect(result.gst).toBe(64800);
      // TDS 194-H: 3,60,000 * 5% = ₹18,000
      expect(result.tds194h).toBe(18000);
      // Net: 3,60,000 + 64,800 - 18,000 = ₹4,06,800
      expect(result.net).toBe(406800);
    });
  });
});
