import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  WhatsAppProvider,
  SendWhatsAppMessageOptions,
  SendWhatsAppDocumentOptions,
  SendWhatsAppInteractiveOptions,
  WhatsAppMessageResult,
} from '../interfaces/whatsapp-provider.interface';
import { StubWhatsAppProvider } from './stub-whatsapp.provider';

@Injectable()
export class MetaWhatsAppProvider implements WhatsAppProvider {
  private readonly logger = new Logger('MetaWhatsAppProvider');
  private readonly phoneNumberId: string | undefined;
  private readonly accessToken: string | undefined;
  private readonly apiVersion = 'v21.0';
  private readonly stubFallback: StubWhatsAppProvider;

  constructor(private readonly configService: ConfigService) {
    this.phoneNumberId = this.configService.get<string>('META_WA_PHONE_NUMBER_ID') || process.env['META_WA_PHONE_NUMBER_ID'];
    this.accessToken = this.configService.get<string>('META_WA_ACCESS_TOKEN') || process.env['META_WA_ACCESS_TOKEN'];
    this.stubFallback = new StubWhatsAppProvider();

    if (this.isConfigured()) {
      this.logger.log(`🚀 Meta Cloud API WhatsApp Provider initialized (Phone Number ID: ${this.phoneNumberId})`);
    } else {
      this.logger.warn(`⚠️ Meta WhatsApp credentials not detected. Active fallback: StubWhatsAppProvider.`);
    }
  }

  private isConfigured(): boolean {
    return Boolean(this.phoneNumberId && this.accessToken);
  }

  private cleanPhoneNumber(phone: string): string {
    // Strip spaces, dashes, parentheses and leading '+' for WhatsApp Meta Cloud API
    return phone.replace(/[^0-9]/g, '');
  }

  private async makeApiRequest(payload: any): Promise<any> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json: any = await response.json();
    if (!response.ok) {
      throw new Error(`Meta Cloud API Error: ${json.error?.message || response.statusText}`);
    }
    return json;
  }

  async sendTextMessage(to: string, text: string): Promise<WhatsAppMessageResult> {
    if (!this.isConfigured()) {
      return this.stubFallback.sendTextMessage(to, text);
    }

    const cleanTo = this.cleanPhoneNumber(to);
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'text',
        text: { preview_url: true, body: text },
      };

      const result = await this.makeApiRequest(payload);
      const messageId = result.messages?.[0]?.id || `wa-${randomUUID().slice(0, 12)}`;

      this.logger.log(`✅ [Meta WhatsApp API] Direct message delivered to ${cleanTo} (ID: ${messageId})`);

      return {
        success: true,
        messageId,
        status: 'sent',
        timestamp: new Date(),
        provider: 'meta-cloud-api',
        recipient: to,
        details: result,
      };
    } catch (err: any) {
      this.logger.error(`❌ [Meta WhatsApp API] Failed to send message to ${cleanTo}: ${err.message}`);
      return this.stubFallback.sendTextMessage(to, text);
    }
  }

  async sendTemplateMessage(options: SendWhatsAppMessageOptions): Promise<WhatsAppMessageResult> {
    if (!this.isConfigured()) {
      return this.stubFallback.sendTemplateMessage(options);
    }

    const cleanTo = this.cleanPhoneNumber(options.to);
    try {
      const parameters = Object.values(options.parameters).map((val) => ({
        type: 'text',
        text: String(val),
      }));

      const payload = {
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: 'template',
        template: {
          name: options.templateName,
          language: { code: options.languageCode || 'en' },
          components: [
            {
              type: 'body',
              parameters,
            },
          ],
        },
      };

      const result = await this.makeApiRequest(payload);
      const messageId = result.messages?.[0]?.id || `wa-${randomUUID().slice(0, 12)}`;

      this.logger.log(`✅ [Meta WhatsApp API] Template "${options.templateName}" delivered to ${cleanTo} (ID: ${messageId})`);

      return {
        success: true,
        messageId,
        status: 'sent',
        timestamp: new Date(),
        provider: 'meta-cloud-api',
        recipient: options.to,
        details: result,
      };
    } catch (err: any) {
      this.logger.error(`❌ [Meta WhatsApp API] Failed template to ${cleanTo}: ${err.message}`);
      return this.stubFallback.sendTemplateMessage(options);
    }
  }

  async sendDocumentMessage(options: SendWhatsAppDocumentOptions): Promise<WhatsAppMessageResult> {
    if (!this.isConfigured()) {
      return this.stubFallback.sendDocumentMessage(options);
    }

    const cleanTo = this.cleanPhoneNumber(options.to);
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'document',
        document: {
          link: options.documentUrl,
          filename: options.filename,
          caption: options.caption || undefined,
        },
      };

      const result = await this.makeApiRequest(payload);
      const messageId = result.messages?.[0]?.id || `wa-doc-${randomUUID().slice(0, 12)}`;

      this.logger.log(`✅ [Meta WhatsApp API] Document "${options.filename}" delivered to ${cleanTo} (ID: ${messageId})`);

      return {
        success: true,
        messageId,
        status: 'sent',
        timestamp: new Date(),
        provider: 'meta-cloud-api',
        recipient: options.to,
        details: result,
      };
    } catch (err: any) {
      this.logger.error(`❌ [Meta WhatsApp API] Failed document to ${cleanTo}: ${err.message}`);
      return this.stubFallback.sendDocumentMessage(options);
    }
  }

  async sendInteractiveButtons(options: SendWhatsAppInteractiveOptions): Promise<WhatsAppMessageResult> {
    if (!this.isConfigured()) {
      return this.stubFallback.sendInteractiveButtons(options);
    }

    const cleanTo = this.cleanPhoneNumber(options.to);
    try {
      const buttons = options.buttons.slice(0, 3).map((b) => ({
        type: 'reply',
        reply: {
          id: b.id,
          title: b.title.slice(0, 20), // Meta button title limit is 20 chars
        },
      }));

      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: options.bodyText },
          action: { buttons },
        },
      };

      if (options.headerText) {
        payload.interactive.header = { type: 'text', text: options.headerText };
      }
      if (options.footerText) {
        payload.interactive.footer = { text: options.footerText };
      }

      const result = await this.makeApiRequest(payload);
      const messageId = result.messages?.[0]?.id || `wa-btn-${randomUUID().slice(0, 12)}`;

      this.logger.log(`✅ [Meta WhatsApp API] Interactive buttons sent to ${cleanTo} (ID: ${messageId})`);

      return {
        success: true,
        messageId,
        status: 'sent',
        timestamp: new Date(),
        provider: 'meta-cloud-api',
        recipient: options.to,
        details: result,
      };
    } catch (err: any) {
      this.logger.error(`❌ [Meta WhatsApp API] Failed interactive buttons to ${cleanTo}: ${err.message}`);
      return this.stubFallback.sendInteractiveButtons(options);
    }
  }
}
