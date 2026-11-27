import { Injectable } from '@nestjs/common';

export interface InterestCalculationResult {
  isOverdue: boolean;
  dueDate: Date;
  asOfDate: Date;
  daysOverdue: number;
  billableDays: number;
  annualRatePct: number;
  principalAmount: number;
  interestAmount: number;
  waivedAmount: number;
  netInterestPayable: number;
}

@Injectable()
export class RealtyInterestService {
  /**
   * Calculates overdue interest according to RERA / Maharashtra RERA rules.
   * Standard interest: SBI Highest Marginal Cost of Lending Rate (MCLR) + 2% (approx 10.85% to 18% p.a.).
   * Grace period: typically 7 to 15 days before interest accrual commences.
   */
  calculateInterest(params: {
    principalAmount: number;
    dueDate: Date | string;
    asOfDate?: Date | string | undefined;
    annualRatePct?: number | undefined; // default 18.00%
    graceDays?: number | undefined; // default 7 days
    waivedAmount?: number | undefined;
  }): InterestCalculationResult {
    const due = new Date(params.dueDate);
    const asOf = params.asOfDate ? new Date(params.asOfDate) : new Date();
    const annualRate = params.annualRatePct ?? 18.0;
    const graceDays = params.graceDays ?? 7;
    const waived = params.waivedAmount ?? 0;
    const principal = Math.max(0, params.principalAmount);

    const diffMs = asOf.getTime() - due.getTime();
    const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (daysOverdue <= graceDays || principal <= 0) {
      return {
        isOverdue: daysOverdue > 0,
        dueDate: due,
        asOfDate: asOf,
        daysOverdue,
        billableDays: 0,
        annualRatePct: annualRate,
        principalAmount: principal,
        interestAmount: 0,
        waivedAmount: 0,
        netInterestPayable: 0,
      };
    }

    // When grace period is breached, interest accrues for the days overdue
    const billableDays = daysOverdue;
    const dailyRate = annualRate / 100 / 365;
    const rawInterest = principal * dailyRate * billableDays;
    const interestAmount = Math.round(rawInterest * 100) / 100;
    const netInterestPayable = Math.max(0, Math.round((interestAmount - waived) * 100) / 100);

    return {
      isOverdue: true,
      dueDate: due,
      asOfDate: asOf,
      daysOverdue,
      billableDays,
      annualRatePct: annualRate,
      principalAmount: principal,
      interestAmount,
      waivedAmount: waived,
      netInterestPayable,
    };
  }
}
