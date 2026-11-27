import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  WhatsAppProvider,
  SendWhatsAppMessageOptions,
  SendWhatsAppDocumentOptions,
  SendWhatsAppInteractiveOptions,
  WhatsAppMessageResult,
} from '../interfaces/whatsapp-provider.interface';

@Injectable()
export class StubWhatsAppProvider implements WhatsAppProvider {
  private readonly logger = new Logger('WhatsAppProvider');

  async sendTemplateMessage(options: SendWhatsAppMessageOptions): Promise<WhatsAppMessageResult> {
    const messageId = `wa-${randomUUID().slice(0, 12)}`;
    const formattedParams = Object.entries(options.parameters)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');

    this.logger.log(
      `📲 [WhatsApp Stub] Outbound template to ${options.to} [Template: ${options.templateName}] Parameters: { ${formattedParams} }`
    );

    return {
      success: true,
      messageId,
      status: 'delivered',
      timestamp: new Date(),
      provider: 'stub-meta-whatsapp',
      recipient: options.to,
      details: {
        template: options.templateName,
        params: options.parameters,
      },
    };
  }

  async sendTextMessage(to: string, text: string): Promise<WhatsAppMessageResult> {
    const messageId = `wa-${randomUUID().slice(0, 12)}`;
    this.logger.log(`📲 [WhatsApp Stub] Outbound direct message to ${to}: "${text}"`);

    return {
      success: true,
      messageId,
      status: 'delivered',
      timestamp: new Date(),
      provider: 'stub-meta-whatsapp',
      recipient: to,
      details: { text },
    };
  }

  async sendDocumentMessage(options: SendWhatsAppDocumentOptions): Promise<WhatsAppMessageResult> {
    const messageId = `wa-doc-${randomUUID().slice(0, 12)}`;
    this.logger.log(
      `📲 [WhatsApp Stub] Outbound document to ${options.to}: [File: ${options.filename}] Url: ${options.documentUrl} Caption: "${options.caption || ''}"`
    );

    return {
      success: true,
      messageId,
      status: 'delivered',
      timestamp: new Date(),
      provider: 'stub-meta-whatsapp',
      recipient: options.to,
      details: {
        filename: options.filename,
        documentUrl: options.documentUrl,
        caption: options.caption,
      },
    };
  }

  async sendInteractiveButtons(options: SendWhatsAppInteractiveOptions): Promise<WhatsAppMessageResult> {
    const messageId = `wa-btn-${randomUUID().slice(0, 12)}`;
    const btnList = options.buttons.map((b) => `[${b.title}]`).join(' ');
    this.logger.log(
      `📲 [WhatsApp Stub] Outbound interactive buttons to ${options.to}: "${options.bodyText}" Actions: ${btnList}`
    );

    return {
      success: true,
      messageId,
      status: 'delivered',
      timestamp: new Date(),
      provider: 'stub-meta-whatsapp',
      recipient: options.to,
      details: {
        body: options.bodyText,
        buttons: options.buttons,
      },
    };
  }
}
