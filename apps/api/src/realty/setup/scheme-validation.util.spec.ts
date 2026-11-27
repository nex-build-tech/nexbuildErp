import { validateSchemeStages } from './scheme-validation.util';

describe('Payment Scheme Stage Validation (100% Rule)', () => {
  it('should accept valid stages totaling exactly 100%', () => {
    const stages = [
      { payStageId: 1, pct: 10 },
      { payStageId: 2, pct: 15 },
      { payStageId: 3, pct: 25 },
      { payStageId: 4, pct: 50 },
    ];
    const result = validateSchemeStages(stages);
    expect(result.valid).toBe(true);
    expect(result.total).toBe(100);
    expect(result.error).toBeUndefined();
  });

  it('should accept 21 stages totaling 100% (Kings Heights setup)', () => {
    // 13 + 10 + 17 + (12 * 4 = 48) + (6 * 2 = 12) = 100
    const stages = [
      { payStageId: 1, pct: 13 },
      { payStageId: 2, pct: 10 },
      { payStageId: 3, pct: 17 },
      ...Array.from({ length: 12 }, (_, i) => ({ payStageId: i + 4, pct: 4 })),
      ...Array.from({ length: 6 }, (_, i) => ({ payStageId: i + 16, pct: 2 })),
    ];
    const result = validateSchemeStages(stages);
    expect(result.valid).toBe(true);
    expect(result.total).toBe(100);
  });

  it('should accept fractional percentages totaling 100%', () => {
    const stages = [
      { payStageId: 1, pct: '33.3333' },
      { payStageId: 2, pct: '33.3333' },
      { payStageId: 3, pct: '33.3334' },
    ];
    const result = validateSchemeStages(stages);
    expect(result.valid).toBe(true);
    expect(result.total).toBe(100);
  });

  it('should reject stages summing to less than 100%', () => {
    const stages = [
      { payStageId: 1, pct: 20 },
      { payStageId: 2, pct: 30 },
      { payStageId: 3, pct: 40 },
    ];
    const result = validateSchemeStages(stages);
    expect(result.valid).toBe(false);
    expect(result.total).toBe(90);
    expect(result.error).toContain('Scheme stages must total exactly 100%');
  });

  it('should reject stages summing to more than 100%', () => {
    const stages = [
      { payStageId: 1, pct: 50 },
      { payStageId: 2, pct: 51 },
    ];
    const result = validateSchemeStages(stages);
    expect(result.valid).toBe(false);
    expect(result.total).toBe(101);
    expect(result.error).toContain('Scheme stages must total exactly 100%');
  });

  it('should reject empty stages array', () => {
    const result = validateSchemeStages([]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Scheme must have at least one payment stage');
  });

  it('should reject zero or negative stage percentages', () => {
    const stages = [
      { payStageId: 1, pct: 110 },
      { payStageId: 2, pct: -10 },
    ];
    const result = validateSchemeStages(stages);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Must be positive');
  });
});
