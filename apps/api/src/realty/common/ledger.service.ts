import { Injectable } from '@nestjs/common';

export interface StageDue {
  scheduleId: number;
  payStageId: number;
  stageCode: string;
  stageName: string;
  totalDue: number; // principal + gst
  paidSoFar: number;
  balanceDue: number;
}

export interface AllocationItem {
  scheduleId: number;
  stageCode: string;
  stageName: string;
  allocatedAmount: number;
  isFullyPaid: boolean;
  remainingDueOnStage: number;
}

export interface FifoAllocationResult {
  allocations: AllocationItem[];
  totalAllocated: number;
  unallocatedExcess: number;
}

@Injectable()
export class RealtyLedgerService {
  /**
   * 1. FIFO (First-In, First-Out) Allocation of Receipt Amount
   * Allocates payment sequentially to the oldest unpaid milestone demands.
   */
  allocateReceiptFifo(stages: StageDue[], receiptAmount: number): FifoAllocationResult {
    let remainingPayment = Math.max(0, receiptAmount);
    const allocations: AllocationItem[] = [];

    // Filter stages that still have balance due, ordered by schedule/sequence
    const dueStages = stages.filter((s) => s.balanceDue > 0);

    for (const stage of dueStages) {
      if (remainingPayment <= 0) {
        break;
      }

      const canAllocate = Math.min(remainingPayment, stage.balanceDue);
      const remainingOnStage = stage.balanceDue - canAllocate;

      allocations.push({
        scheduleId: stage.scheduleId,
        stageCode: stage.stageCode,
        stageName: stage.stageName,
        allocatedAmount: Math.round(canAllocate * 100) / 100,
        isFullyPaid: remainingOnStage <= 0.001,
        remainingDueOnStage: Math.max(0, Math.round(remainingOnStage * 100) / 100),
      });

      remainingPayment = Math.max(0, remainingPayment - canAllocate);
    }

    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);

    return {
      allocations,
      totalAllocated: Math.round(totalAllocated * 100) / 100,
      unallocatedExcess: Math.round(remainingPayment * 100) / 100,
    };
  }

  /**
   * 2. Statutory TDS Section 194-IA Computation
   * When Property Agreement Value >= ₹50,00,000, buyer must deduct 1% TDS on installment payments.
   */
  calculateTds194IA(
    installmentAmount: number,
    agreementValue: number,
    optedOut = false
  ): {
    tdsApplicable: boolean;
    tdsRatePct: number;
    tdsAmount: number;
    netReceivableFromCustomer: number;
  } {
    const isApplicable = !optedOut && agreementValue >= 5000000;
    if (!isApplicable) {
      return {
        tdsApplicable: false,
        tdsRatePct: 0,
        tdsAmount: 0,
        netReceivableFromCustomer: installmentAmount,
      };
    }

    const tdsRatePct = 1.0;
    // TDS is 1% of the basic installment amount
    const tdsAmount = Math.round((installmentAmount * (tdsRatePct / 100)) * 100) / 100;
    const netReceivableFromCustomer = Math.round((installmentAmount - tdsAmount) * 100) / 100;

    return {
      tdsApplicable: true,
      tdsRatePct,
      tdsAmount,
      netReceivableFromCustomer,
    };
  }

  /**
   * 3. Number to Words in Indian Numbering System (Lakh / Crore)
   * Formats numbers into official Indian statutory text (e.g. "One Crore Twenty-Five Lakh").
   */
  numberToIndianWords(amount: number): string {
    const num = Math.floor(Math.abs(amount));
    if (num === 0) return 'Zero Rupees Only';

    const units = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanThousand = (n: number): string => {
      let str = '';
      if (n >= 100) {
        str += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += units[n] + ' ';
      }
      return str.trim();
    };

    let result = '';
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    if (crore > 0) {
      result += convertLessThanThousand(crore) + ' Crore ';
    }
    if (lakh > 0) {
      result += convertLessThanThousand(lakh) + ' Lakh ';
    }
    if (thousand > 0) {
      result += convertLessThanThousand(thousand) + ' Thousand ';
    }
    if (remainder > 0) {
      result += convertLessThanThousand(remainder) + ' ';
    }

    return `${result.trim()} Rupees Only`;
  }
}
