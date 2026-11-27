import { StubWhatsAppProvider } from '../src/notifications/providers/stub-whatsapp.provider';
import { generateSecret, generateURI, verifySync } from 'otplib';

describe('Phase P7 System Tests', () => {
  describe('StubWhatsAppProvider', () => {
    let provider: StubWhatsAppProvider;

    beforeEach(() => {
      provider = new StubWhatsAppProvider();
    });

    it('should send a direct WhatsApp message and return success with messageId', async () => {
      const result = await provider.sendMessage({
        to: '+919820011111',
        body: 'PO KB/PO/26-27/0001 has been approved and issued.',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.status).toBe('sent');
      expect(result.messageId).toContain('wa-stub-');
    });

    it('should format and send a template message', async () => {
      const result = await provider.sendMessage({
        to: '+919820011111',
        templateName: 'po_approval_alert',
        parameters: { poNumber: 'KB/PO/26-27/0001', vendor: 'Kheteshwar' },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('sent');
    });
  });

  describe('TOTP 2FA Authentication', () => {
    it('should generate valid TOTP secret and verify tokens correctly', () => {
      const secret = generateSecret();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(15);

      const uri = generateURI({
        issuer: 'BuildERP (Kings Builders)',
        label: 'owner@kingsbuilders.com',
        secret,
      });
      expect(uri).toContain('otpauth://totp/');
      expect(uri).toContain('BuildERP');

      // Verify token generated for current timestamp
      const { generateSync } = require('otplib');
      const token = generateSync({ secret });
      expect(token).toHaveLength(6);

      const isValid = verifySync({ token, secret });
      expect(isValid).toBe(true);

      const isInvalid = verifySync({ token: '000000', secret });
      expect(isInvalid).toBe(false);
    });
  });
});
