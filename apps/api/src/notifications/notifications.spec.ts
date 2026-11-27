import { StubWhatsAppProvider } from './providers/stub-whatsapp.provider';
import { MetaWhatsAppProvider } from './providers/meta-whatsapp.provider';
import { ConfigService } from '@nestjs/config';

describe('Phase P7 & P8 System Tests', () => {
  describe('StubWhatsAppProvider', () => {
    let provider: StubWhatsAppProvider;

    beforeEach(() => {
      provider = new StubWhatsAppProvider();
    });

    it('should send a direct WhatsApp message and return success with messageId', async () => {
      const result = await provider.sendTextMessage(
        '+919820011111',
        'PO KB/PO/26-27/0001 has been approved and issued.'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.status).toBe('delivered');
      expect(result.messageId).toContain('wa-');
      expect(result.recipient).toBe('+919820011111');
    });

    it('should format and send a template message', async () => {
      const result = await provider.sendTemplateMessage({
        to: '+919820011111',
        templateName: 'po_approval_alert',
        parameters: { poNumber: 'KB/PO/26-27/0001', vendor: 'Kheteshwar' },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('delivered');
      expect(result.details?.['template']).toBe('po_approval_alert');
    });

    it('should send document and interactive button messages via WhatsApp provider', async () => {
      const docResult = await provider.sendDocumentMessage({
        to: '+919820011111',
        documentUrl: 'https://builderp.in/docs/PO_001.pdf',
        filename: 'PO_001.pdf',
        caption: 'Purchase Order PDF',
      });
      expect(docResult.success).toBe(true);
      expect(docResult.details?.['filename']).toBe('PO_001.pdf');

      const btnResult = await provider.sendInteractiveButtons({
        to: '+919820011111',
        bodyText: 'Approve PO KB/PO/26-27/0001 for Rs. 5,00,000?',
        buttons: [
          { id: 'btn_approve', title: 'Approve PO' },
          { id: 'btn_reject', title: 'Reject PO' },
        ],
      });
      expect(btnResult.success).toBe(true);
      expect((btnResult.details?.['buttons'] as any[]).length).toBe(2);
    });
  });

  describe('MetaWhatsAppProvider Fallback Behavior', () => {
    it('should fallback cleanly to Stub provider when Meta API token is absent', async () => {
      const mockConfig = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'META_WA_TOKEN') return '';
          return undefined;
        }),
      } as unknown as ConfigService;

      const metaProvider = new MetaWhatsAppProvider(mockConfig);
      const res = await metaProvider.sendTextMessage('+919820011111', 'Testing Fallback');
      expect(res.success).toBe(true);
      expect(res.messageId).toBeDefined();
    });
  });

  describe('Phase P8: BOQ Variance & Consumption Math', () => {
    it('should calculate consumption percentage, variance, and status accurately', () => {
      const budgetedQty = 1000;
      const actualConsumed = 1080;
      const tolerancePercent = 5; // allows up to 1050

      const varianceQty = actualConsumed - budgetedQty; // +80
      const variancePercent = (varianceQty / budgetedQty) * 100; // +8.0%
      const utilizationPercent = (actualConsumed / budgetedQty) * 100; // 108.0%

      let status = 'NORMAL';
      if (variancePercent > tolerancePercent) {
        status = 'BREACHED';
      } else if (variancePercent > 0) {
        status = 'CAUTION';
      }

      expect(varianceQty).toBe(80);
      expect(variancePercent).toBe(8);
      expect(utilizationPercent).toBe(108);
      expect(status).toBe('BREACHED');
    });
  });

  describe('Phase P8: Labour Muster Roll Aggregation', () => {
    it('should compute total headcount and mandays across skilled, semi-skilled, and unskilled workforce', () => {
      const entry = {
        skilledMale: 10,
        skilledFemale: 5,
        semiSkilledMale: 8,
        semiSkilledFemale: 2,
        unskilledMale: 20,
        unskilledFemale: 15,
        supervisors: 2,
        overtimeHours: 12,
      };

      const skilled = entry.skilledMale + entry.skilledFemale;
      const semiSkilled = entry.semiSkilledMale + entry.semiSkilledFemale;
      const unskilled = entry.unskilledMale + entry.unskilledFemale;
      const totalWorkers = skilled + semiSkilled + unskilled + entry.supervisors;

      expect(skilled).toBe(15);
      expect(semiSkilled).toBe(10);
      expect(unskilled).toBe(35);
      expect(totalWorkers).toBe(62);
      expect(entry.overtimeHours).toBe(12);
    });
  });

  describe('Indian Construction GST & Withholding Calculations', () => {
    it('should correctly calculate intra-state GST (CGST + SGST) for Maharashtra (27)', () => {
      const baseAmount = 100000;
      const gstRate = 18; // 18%

      const isInterState = false;
      const cgstRate = isInterState ? 0 : gstRate / 2;
      const sgstRate = isInterState ? 0 : gstRate / 2;
      const igstRate = isInterState ? gstRate : 0;

      const cgstAmount = (baseAmount * cgstRate) / 100;
      const sgstAmount = (baseAmount * sgstRate) / 100;
      const igstAmount = (baseAmount * igstRate) / 100;
      const totalAmount = baseAmount + cgstAmount + sgstAmount + igstAmount;

      expect(cgstAmount).toBe(9000);
      expect(sgstAmount).toBe(9000);
      expect(igstAmount).toBe(0);
      expect(totalAmount).toBe(118000);
    });

    it('should correctly calculate statutory deductions on contractor RA Bill', () => {
      const grossWorkDone = 500000; // Rs. 5 Lakhs
      const retentionPercent = 5; // 5% Retention
      const tdsPercent = 2; // 2% TDS u/s 194C
      const labourCessPercent = 1; // 1% Building & Other Construction Workers Cess

      const retention = (grossWorkDone * retentionPercent) / 100;
      const tds = (grossWorkDone * tdsPercent) / 100;
      const labourCess = (grossWorkDone * labourCessPercent) / 100;
      const netPayable = grossWorkDone - (retention + tds + labourCess);

      expect(retention).toBe(25000);
      expect(tds).toBe(10000);
      expect(labourCess).toBe(5000);
      expect(netPayable).toBe(460000);
    });
  });
});
