export interface SchemeStageInput {
  payStageId: number;
  pct: number | string;
}

export interface SchemeValidationResult {
  valid: boolean;
  total: number;
  error?: string;
}

/**
 * Validates that payment scheme stages sum exactly to 100%.
 * Allows a micro-rounding tolerance of 0.0001 for 4-decimal precision.
 */
export function validateSchemeStages(stages: SchemeStageInput[]): SchemeValidationResult {
  if (!stages || stages.length === 0) {
    return {
      valid: false,
      total: 0,
      error: 'Scheme must have at least one payment stage.',
    };
  }

  let total = 0;
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]!;
    const pctVal = typeof stage.pct === 'string' ? parseFloat(stage.pct) : stage.pct;

    if (isNaN(pctVal) || pctVal <= 0) {
      return {
        valid: false,
        total,
        error: `Stage at index ${i} has invalid percentage (${stage.pct}). Must be positive.`,
      };
    }
    total += pctVal;
  }

  // Rounded to 4 decimal places for comparison
  const roundedTotal = Math.round(total * 10000) / 10000;
  const diff = Math.abs(roundedTotal - 100);

  if (diff > 0.0001) {
    return {
      valid: false,
      total: roundedTotal,
      error: `Scheme stages must total exactly 100%. Current sum: ${roundedTotal}% (Difference: ${(
        roundedTotal - 100
      ).toFixed(4)}%)`,
    };
  }

  return {
    valid: true,
    total: 100,
  };
}
