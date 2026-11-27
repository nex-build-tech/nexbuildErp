import { RealtyLedgerService } from './ledger.service';

describe('RealtyLedgerService', () => {
  let service: RealtyLedgerService;

  beforeEach(() => {
    service = new RealtyLedgerService();
  });

  describe('FIFO Allocation', () => {
    it('should allocate receipt amount across stages in FIFO order', () => {
      const stages = [
        { scheduleId: 1, payStageId: 101, stageCode: 'A', stageName: 'Token', totalDue: 500000, paidSoFar: 0, balanceDue: 500000 },
        { scheduleId: 2, payStageId: 102, stageCode: 'B', stageName: 'Agreement', totalDue: 500000, paidSoFar: 0, balanceDue: 500000 },
        { scheduleId: 3, payStageId: 103, stageCode: 'C', stageName: 'Plinth', totalDue: 1000000, paidSoFar: 0, balanceDue: 1000000 },
      ];

      // Pay 750,000 -> Should fully clear Stage A (500k), and partly pay Stage B (250k)
      const res = service.allocateReceiptFifo(stages, 750000);

      expect(res.totalAllocated).toBe(750000);
      expect(res.unallocatedExcess).toBe(0);
      expect(res.allocations).toHaveLength(2);

      expect(res.allocations[0]!.stageCode).toBe('A');
      expect(res.allocations[0]!.allocatedAmount).toBe(500000);
      expect(res.allocations[0]!.isFullyPaid).toBe(true);
      expect(res.allocations[0]!.remainingDueOnStage).toBe(0);

      expect(res.allocations[1]!.stageCode).toBe('B');
      expect(res.allocations[1]!.allocatedAmount).toBe(250000);
      expect(res.allocations[1]!.isFullyPaid).toBe(false);
      expect(res.allocations[1]!.remainingDueOnStage).toBe(250000);
    });

    it('should handle overpayment with unallocated excess', () => {
      const stages = [
        { scheduleId: 1, payStageId: 101, stageCode: 'A', stageName: 'Token', totalDue: 200000, paidSoFar: 0, balanceDue: 200000 },
      ];

      const res = service.allocateReceiptFifo(stages, 250000);
      expect(res.totalAllocated).toBe(200000);
      expect(res.unallocatedExcess).toBe(50000);
      expect(res.allocations[0]!.isFullyPaid).toBe(true);
    });
  });

  describe('TDS Section 194-IA', () => {
    it('should apply 1% TDS if agreement value >= 50,00,000', () => {
      const agreementValue = 6500000;
      const installment = 1000000;

      const res = service.calculateTds194IA(installment, agreementValue);
      expect(res.tdsApplicable).toBe(true);
      expect(res.tdsRatePct).toBe(1.0);
      expect(res.tdsAmount).toBe(10000);
      expect(res.netReceivableFromCustomer).toBe(990000);
    });

    it('should NOT apply TDS if agreement value < 50,00,000', () => {
      const agreementValue = 4200000;
      const installment = 500000;

      const res = service.calculateTds194IA(installment, agreementValue);
      expect(res.tdsApplicable).toBe(false);
      expect(res.tdsAmount).toBe(0);
      expect(res.netReceivableFromCustomer).toBe(500000);
    });
  });

  describe('Indian Numbering Words Converter', () => {
    it('should convert Lakh and Crore correctly', () => {
      expect(service.numberToIndianWords(12500000)).toBe('One Crore Twenty Five Lakh Rupees Only');
      expect(service.numberToIndianWords(450000)).toBe('Four Lakh Fifty Thousand Rupees Only');
      expect(service.numberToIndianWords(0)).toBe('Zero Rupees Only');
    });
  });
});
