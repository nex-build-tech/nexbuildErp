import { CrmService } from './crm.service';

describe('CrmService - Lead Scoring and Qualification Engine', () => {
  let crmService: CrmService;

  beforeEach(() => {
    // We instantiate with a mock database provider since calculateLeadScore is pure
    crmService = new CrmService({ db: {} } as any);
  });

  it('should score high budget end-user with CP referral as hot (>= 60)', () => {
    const result = crmService.calculateLeadScore({
      budgetMax: 9500000,
      purpose: 'end_use',
      configPref: '2 BHK',
      cpId: 5,
    });

    // Base: 20 + Budget (>= 80L): 30 + Purpose (end_use): 20 + Config: 10 + CP: 15 = 95
    expect(result.score).toBe(95);
    expect(result.temperature).toBe('hot');
  });

  it('should score mid-range budget investor as hot or warm', () => {
    const result = crmService.calculateLeadScore({
      budgetMax: 5500000,
      purpose: 'investment',
      configPref: '1 BHK',
    });

    // Base: 20 + Budget (>= 50L): 20 + Purpose (investment): 15 + Config: 10 = 65
    expect(result.score).toBe(65);
    expect(result.temperature).toBe('hot');
  });

  it('should score low budget without purpose or preference as cold (< 40)', () => {
    const result = crmService.calculateLeadScore({
      budgetMax: 0,
    });

    // Base: 20
    expect(result.score).toBe(20);
    expect(result.temperature).toBe('cold');
  });

  it('should classify score between 40 and 59 as warm', () => {
    const result = crmService.calculateLeadScore({
      budgetMax: 3000000, // +10
      configPref: '1 RK', // +10
      // Base: 20 -> Total 40
    });

    expect(result.score).toBe(40);
    expect(result.temperature).toBe('warm');
  });
});
