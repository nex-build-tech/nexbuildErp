import { RealtyInterestService } from './interest.service';

describe('RealtyInterestService', () => {
  let service: RealtyInterestService;

  beforeEach(() => {
    service = new RealtyInterestService();
  });

  it('should not charge interest if within grace period', () => {
    const dueDate = new Date('2026-06-01');
    const asOfDate = new Date('2026-06-05'); // 4 days overdue, grace is 7 days

    const res = service.calculateInterest({
      principalAmount: 1000000,
      dueDate,
      asOfDate,
      annualRatePct: 18.0,
      graceDays: 7,
    });

    expect(res.daysOverdue).toBe(4);
    expect(res.billableDays).toBe(0);
    expect(res.interestAmount).toBe(0);
  });

  it('should calculate interest once grace period is exceeded', () => {
    const dueDate = new Date('2026-06-01');
    const asOfDate = new Date('2026-07-01'); // 30 days overdue

    const res = service.calculateInterest({
      principalAmount: 1000000,
      dueDate,
      asOfDate,
      annualRatePct: 18.0,
      graceDays: 7,
    });

    expect(res.isOverdue).toBe(true);
    expect(res.daysOverdue).toBe(30);
    expect(res.billableDays).toBe(30);

    // 1,000,000 * 0.18 * (30 / 365) = 14,794.52
    expect(res.interestAmount).toBe(14794.52);
    expect(res.netInterestPayable).toBe(14794.52);
  });

  it('should apply waiver amount correctly', () => {
    const dueDate = new Date('2026-06-01');
    const asOfDate = new Date('2026-07-01');

    const res = service.calculateInterest({
      principalAmount: 1000000,
      dueDate,
      asOfDate,
      annualRatePct: 18.0,
      waivedAmount: 5000,
    });

    expect(res.interestAmount).toBe(14794.52);
    expect(res.waivedAmount).toBe(5000);
    expect(res.netInterestPayable).toBe(9794.52);
  });
});
