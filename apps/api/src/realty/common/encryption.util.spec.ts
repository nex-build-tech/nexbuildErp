import { encryptAadhaar, decryptAadhaar, maskAadhaar } from './encryption.util';

describe('Aadhaar Encryption & Masking Utility', () => {
  const sampleAadhaar = '5489 1234 5678';
  const customSecret = 'my_super_secret_test_key_for_testing';

  it('should encrypt and decrypt Aadhaar accurately using AES-256-GCM', () => {
    const encrypted = encryptAadhaar(sampleAadhaar);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(sampleAadhaar);

    const decrypted = decryptAadhaar(encrypted);
    expect(decrypted).toBe(sampleAadhaar);
  });

  it('should encrypt and decrypt with custom secret', () => {
    const encrypted = encryptAadhaar(sampleAadhaar, customSecret);
    const decrypted = decryptAadhaar(encrypted, customSecret);
    expect(decrypted).toBe(sampleAadhaar);
  });

  it('should fail decryption with wrong secret / corrupted payload', () => {
    const encrypted = encryptAadhaar(sampleAadhaar, customSecret);
    expect(() => decryptAadhaar(encrypted, 'wrong_key')).toThrow();
  });

  it('should mask Aadhaar number to display only last 4 digits', () => {
    expect(maskAadhaar('5489 1234 5678')).toBe('XXXX-XXXX-5678');
    expect(maskAadhaar('548912345678')).toBe('XXXX-XXXX-5678');
    expect(maskAadhaar('1234')).toBe('XXXX-XXXX-1234');
    expect(maskAadhaar('')).toBe('');
  });
});
