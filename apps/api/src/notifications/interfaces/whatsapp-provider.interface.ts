export interface SendWhatsAppMessageOptions {
  to: string; // e.g. "+919820011111"
  templateName: string; // e.g. "po_approval_required", "po_sent", "grn_inspected", "low_stock_warning"
  parameters: Record<string, string | number>;
  languageCode?: string; // default "en_US" or "en"
}

export interface SendWhatsAppDocumentOptions {
  to: string;
  documentUrl: string;
  filename: string;
  caption?: string;
}

export interface SendWhatsAppInteractiveOptions {
  to: string;
  bodyText: string;
  buttons: Array<{ id: string; title: string }>;
  headerText?: string;
  footerText?: string;
}

export interface WhatsAppMessageResult {
  success: boolean;
  messageId: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  timestamp: Date;
  provider: string;
  recipient: string;
  details?: Record<string, any>;
}

export interface WhatsAppProvider {
  sendTemplateMessage(options: SendWhatsAppMessageOptions): Promise<WhatsAppMessageResult>;
  sendTextMessage(to: string, text: string): Promise<WhatsAppMessageResult>;
  sendDocumentMessage(options: SendWhatsAppDocumentOptions): Promise<WhatsAppMessageResult>;
  sendInteractiveButtons(options: SendWhatsAppInteractiveOptions): Promise<WhatsAppMessageResult>;
}

export const WHATSAPP_PROVIDER = 'WHATSAPP_PROVIDER';
