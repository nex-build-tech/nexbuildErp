/**
 * Pure GST Calculation Engine for Indian Invoicing & Purchase Orders.
 * Handles intra-state (CGST + SGST) and inter-state (IGST),
 * mixed tax rates (0%, 5%, 12%, 18%, 28%, Exempt),
 * round-off and amount in Indian words.
 */

export interface GstLineItemInput {
  hsnCode?: string;
  qty: number;
  rate: number;
  discountPercent?: number;
  gstRate: number | 'Exempt' | '0'; // 0, 5, 12, 18, 28 or 'Exempt'
}

export interface GstTaxRateSummary {
  rateLabel: string;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
}

export interface GstCalculationResult {
  items: Array<{
    taxableAmount: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    igstRate: number;
    igstAmount: number;
    totalAmount: number;
  }>;
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  subTotal: number;
  roundOff: number;
  grandTotal: number;
  rateWiseSummary: GstTaxRateSummary[];
  amountInWords: string;
}

export function calculateGst(
  items: GstLineItemInput[],
  companyStateCode: string = '27', // 27 = Maharashtra
  vendorStateCode: string = '27',
): GstCalculationResult {
  const isIntraState = companyStateCode.trim() === vendorStateCode.trim();

  let taxableTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  // Rate-wise map
  const rateMap: Record<
    string,
    {
      taxable: number;
      rateNum: number;
      isExempt: boolean;
      cgst: number;
      sgst: number;
      igst: number;
    }
  > = {};

  const calculatedItems = items.map((item) => {
    const rawAmount = item.qty * item.rate;
    const discount = item.discountPercent ? (rawAmount * item.discountPercent) / 100 : 0;
    const lineTaxable = Math.round((rawAmount - discount) * 100) / 100;

    const isExempt = item.gstRate === 'Exempt' || String(item.gstRate).toLowerCase() === 'exempt';
    const rateNum = isExempt ? 0 : Number(item.gstRate) || 0;
    const rateKey = isExempt ? 'Exempt' : `${rateNum}%`;

    let lineCgst = 0;
    let lineSgst = 0;
    let lineIgst = 0;

    if (!isExempt && rateNum > 0) {
      if (isIntraState) {
        const halfRate = rateNum / 2;
        lineCgst = Math.round(((lineTaxable * halfRate) / 100) * 100) / 100;
        lineSgst = Math.round(((lineTaxable * halfRate) / 100) * 100) / 100;
      } else {
        lineIgst = Math.round(((lineTaxable * rateNum) / 100) * 100) / 100;
      }
    }

    const lineTotal = Math.round((lineTaxable + lineCgst + lineSgst + lineIgst) * 100) / 100;

    taxableTotal += lineTaxable;
    cgstTotal += lineCgst;
    sgstTotal += lineSgst;
    igstTotal += lineIgst;

    if (!rateMap[rateKey]) {
      rateMap[rateKey] = {
        taxable: 0,
        rateNum,
        isExempt,
        cgst: 0,
        sgst: 0,
        igst: 0,
      };
    }
    rateMap[rateKey].taxable += lineTaxable;
    rateMap[rateKey].cgst += lineCgst;
    rateMap[rateKey].sgst += lineSgst;
    rateMap[rateKey].igst += lineIgst;

    return {
      taxableAmount: lineTaxable,
      cgstRate: isIntraState ? (isExempt ? 0 : rateNum / 2) : 0,
      cgstAmount: lineCgst,
      sgstRate: isIntraState ? (isExempt ? 0 : rateNum / 2) : 0,
      sgstAmount: lineSgst,
      igstRate: !isIntraState ? rateNum : 0,
      igstAmount: lineIgst,
      totalAmount: lineTotal,
    };
  });

  taxableTotal = Math.round(taxableTotal * 100) / 100;
  cgstTotal = Math.round(cgstTotal * 100) / 100;
  sgstTotal = Math.round(sgstTotal * 100) / 100;
  igstTotal = Math.round(igstTotal * 100) / 100;
  const taxTotal = Math.round((cgstTotal + sgstTotal + igstTotal) * 100) / 100;
  const subTotal = Math.round((taxableTotal + taxTotal) * 100) / 100;

  // Round off (nearest rupee or exact paise as in quotation)
  const roundOff = 0; // standard 2 decimals
  const grandTotal = subTotal;

  const rateWiseSummary: GstTaxRateSummary[] = Object.keys(rateMap).map((key) => {
    const r = rateMap[key]!;
    return {
      rateLabel: key,
      taxableAmount: Math.round(r.taxable * 100) / 100,
      cgstRate: isIntraState ? (r.isExempt ? 0 : r.rateNum / 2) : 0,
      cgstAmount: Math.round(r.cgst * 100) / 100,
      sgstRate: isIntraState ? (r.isExempt ? 0 : r.rateNum / 2) : 0,
      sgstAmount: Math.round(r.sgst * 100) / 100,
      igstRate: !isIntraState ? r.rateNum : 0,
      igstAmount: Math.round(r.igst * 100) / 100,
      totalTax: Math.round((r.cgst + r.sgst + r.igst) * 100) / 100,
    };
  });

  return {
    items: calculatedItems,
    taxableTotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    taxTotal,
    subTotal,
    roundOff,
    grandTotal,
    rateWiseSummary,
    amountInWords: numberToIndianWords(grandTotal),
  };
}

/**
 * Converts a decimal amount into Indian words format (e.g. Rupees Twenty Two Thousand Nine Hundred Twenty Eight and Thirty Paise Only)
 */
export function numberToIndianWords(amount: number): string {
  const [rupeesStr, paiseStr = '00'] = amount.toFixed(2).split('.');
  const rupees = parseInt(rupeesStr || '0', 10);
  const paise = parseInt(paiseStr.slice(0, 2), 10);

  if (rupees === 0 && paise === 0) return 'Rupees Zero Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return units[n]!;
    if (n < 20) return teens[n - 10]!;
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return `${tens[ten]}${unit > 0 ? ' ' + units[unit] : ''}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) res += `${units[hundred]} Hundred`;
    if (rest > 0) res += (res ? ' ' : '') + convertTwoDigits(rest);
    return res;
  }

  let words = '';
  let rem = rupees;

  // Crores
  const crores = Math.floor(rem / 10000000);
  if (crores > 0) {
    words += `${convertTwoDigits(crores)} Crore `;
    rem %= 10000000;
  }

  // Lakhs
  const lakhs = Math.floor(rem / 100000);
  if (lakhs > 0) {
    words += `${convertTwoDigits(lakhs)} Lakh `;
    rem %= 100000;
  }

  // Thousands
  const thousands = Math.floor(rem / 1000);
  if (thousands > 0) {
    words += `${convertTwoDigits(thousands)} Thousand `;
    rem %= 1000;
  }

  // Hundreds & units
  if (rem > 0) {
    words += convertThreeDigits(rem);
  }

  words = `Rupees ${words.trim()}`;
  if (paise > 0) {
    words += ` and ${convertTwoDigits(paise)} Paise`;
  }
  words += ' Only';

  return words;
}
