import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { notifications } from '../database/schema';
import { TenantContext } from '../common/middleware/tenant.middleware';
import { QueueService, NotificationJobData } from './queue.service';
import {
  WhatsAppProvider,
  WHATSAPP_PROVIDER,
} from './interfaces/whatsapp-provider.interface';

export interface CreateNotificationDto {
  userId?: number;
  roleCode?: string;
  type: 'PO_APPROVAL' | 'PO_SENT' | 'GRN_DONE' | 'LOW_STOCK' | 'RA_BILL_CERTIFIED' | 'SYSTEM';
  title: string;
  message: string;
  data?: Record<string, any>;
  channel?: 'IN_APP' | 'EMAIL' | 'WHATSAPP' | 'ALL';
  recipientEmail?: string;
  recipientPhone?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly queueService: QueueService,
    @Inject(WHATSAPP_PROVIDER)
    private readonly whatsAppProvider: WhatsAppProvider
  ) {}

  /**
   * Create notification, store in database, and enqueue email / WhatsApp
   */
  async createNotification(tenantId: number, dto: CreateNotificationDto) {
    const db = this.databaseService.db;
    const notifUuid = uuidv4();
    const dataString = dto.data ? JSON.stringify(dto.data) : null;

    // 1. Insert In-App Notification in DB
    const [inserted] = await db.insert(notifications).values({
      uuid: notifUuid,
      tenantId,
      userId: dto.userId || null,
      roleCode: dto.roleCode || null,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      data: dataString,
      channel: dto.channel || 'IN_APP',
      isRead: false,
    });

    // 2. Dispatch to async Queue for Email & WhatsApp
    const jobType: 'email' | 'whatsapp' | 'in_app' =
      dto.channel === 'EMAIL' ? 'email' : dto.channel === 'WHATSAPP' ? 'whatsapp' : 'in_app';

    const jobData: NotificationJobData = {
      jobId: notifUuid,
      type: jobType,
      recipient: dto.recipientEmail || dto.recipientPhone || 'system',
      subject: dto.title,
      body: dto.message,
      timestamp: new Date().toISOString(),
      ...(dto.data ? { metadata: dto.data } : {}),
    };

    await this.queueService.enqueue(jobData);

    // If channel is WHATSAPP or ALL and phone is present, trigger WhatsApp provider
    if ((dto.channel === 'WHATSAPP' || dto.channel === 'ALL') && dto.recipientPhone) {
      await this.whatsAppProvider.sendTextMessage(dto.recipientPhone, `*${dto.title}*\n${dto.message}`);
    }

    return {
      id: inserted.insertId,
      uuid: notifUuid,
      ...dto,
      isRead: false,
      createdAt: new Date(),
    };
  }

  /**
   * Direct PO Sharing via WhatsApp (with document link or formatted text)
   */
  async sharePoViaWhatsApp(options: {
    poNumber: string;
    vendorName: string;
    to: string;
    totalAmount: string;
    documentUrl?: string;
  }) {
    if (options.documentUrl) {
      return this.whatsAppProvider.sendDocumentMessage({
        to: options.to,
        documentUrl: options.documentUrl,
        filename: `PO_${options.poNumber.replace(/[/\\]/g, '_')}.pdf`,
        caption: `Purchase Order ${options.poNumber} from Kings Builders & Developers. Total: ₹${options.totalAmount}`,
      });
    }

    const message = `*Purchase Order Issued: ${options.poNumber}*\nDear ${options.vendorName},\nKings Builders & Developers has issued PO *${options.poNumber}* for a total of *₹${Number(options.totalAmount).toLocaleString('en-IN')}*.\nPlease acknowledge receipt and process delivery as per agreed timelines.`;
    return this.whatsAppProvider.sendTextMessage(options.to, message);
  }

  /**
   * Interactive WhatsApp Approval Request with Reply Buttons
   */
  async sendInteractivePoApproval(options: {
    poNumber: string;
    to: string;
    amount: string;
    vendorName: string;
    siteName: string;
  }) {
    return this.whatsAppProvider.sendInteractiveButtons({
      to: options.to,
      headerText: 'BuildERP PO Approval Alert',
      bodyText: `Purchase Order *${options.poNumber}* for *₹${Number(options.amount).toLocaleString('en-IN')}* to *${options.vendorName}* at *${options.siteName}* requires your authorization.`,
      footerText: 'Kings Builders & Developers',
      buttons: [
        { id: `approve_${options.poNumber}`, title: 'Approve PO' },
        { id: `reject_${options.poNumber}`, title: 'Reject PO' },
      ],
    });
  }

  /**
   * Get user notifications with filtering and pagination
   */
  async getNotifications(
    tenant: TenantContext,
    user: any,
    options: { page?: number; limit?: number; unreadOnly?: boolean; category?: string }
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(notifications.tenantId, tenant.id),
      sql`(${notifications.userId} = ${user.id} OR ${notifications.userId} IS NULL OR ${notifications.roleCode} = ${user.role || 'user'})`,
    ];

    if (options.unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    if (options.category && options.category !== 'all') {
      if (options.category === 'procurement') {
        conditions.push(sql`${notifications.type} IN ('PO_APPROVAL', 'PO_SENT')`);
      } else if (options.category === 'inventory') {
        conditions.push(sql`${notifications.type} IN ('GRN_DONE', 'LOW_STOCK')`);
      }
    }

    const rows = await this.databaseService.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalCount] = await this.databaseService.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(...conditions));

    return {
      data: rows.map((r) => ({
        ...r,
        data: r.data ? JSON.parse(r.data) : null,
      })),
      total: Number(totalCount?.count || 0),
      page,
      limit,
    };
  }

  async listNotifications(
    tenant: TenantContext,
    user: any,
    options: { page?: number; limit?: number; unreadOnly?: boolean; category?: string }
  ) {
    return this.getNotifications(tenant, user, options);
  }

  /**
   * Get unread notifications count for header badge
   */
  async getUnreadCount(tenant: TenantContext, user: any): Promise<number> {
    const conditions = [
      eq(notifications.tenantId, tenant.id),
      eq(notifications.isRead, false),
      sql`(${notifications.userId} = ${user.id} OR ${notifications.userId} IS NULL OR ${notifications.roleCode} = ${user.role || 'user'})`,
    ];

    const [result] = await this.databaseService.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(...conditions));

    return Number(result?.count || 0);
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(tenant: TenantContext, id: number) {
    await this.databaseService.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.tenantId, tenant.id), eq(notifications.id, id)));

    return { success: true, id };
  }

  /**
   * Mark all unread notifications as read for current user
   */
  async markAllAsRead(tenant: TenantContext, user: any) {
    await this.databaseService.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.tenantId, tenant.id),
          eq(notifications.isRead, false),
          sql`(${notifications.userId} = ${user.id} OR ${notifications.userId} IS NULL OR ${notifications.roleCode} = ${user.role || 'user'})`
        )
      );

    return { success: true };
  }

  // ── TRIGGER NOTIFICATION HELPERS ──────────────────────────────────────────

  async notifyPoApprovalRequired(tenantId: number, po: { id: number; poNumber: string; totalAmount: string; vendorName: string }) {
    return this.createNotification(tenantId, {
      roleCode: 'boss',
      type: 'PO_APPROVAL',
      title: `Approval Required: PO ${po.poNumber}`,
      message: `Purchase Order ${po.poNumber} for ₹${Number(po.totalAmount).toLocaleString('en-IN')} to ${po.vendorName} requires director authorization.`,
      data: { docType: 'PO', id: po.id, docNumber: po.poNumber, link: '/procurement/pos' },
      channel: 'ALL',
      recipientEmail: 'vikram.singh@kingsbuilders.in',
      recipientPhone: '+91 98200 11111',
    });
  }

  async notifyPoSent(tenantId: number, po: { id: number; poNumber: string; vendorName: string }) {
    return this.createNotification(tenantId, {
      roleCode: 'store',
      type: 'PO_SENT',
      title: `PO Dispatched: ${po.poNumber}`,
      message: `Purchase Order ${po.poNumber} approved & dispatched to ${po.vendorName}. Store inward gate pass ready.`,
      data: { docType: 'PO', id: po.id, docNumber: po.poNumber, link: '/inventory/grn' },
      channel: 'ALL',
      recipientEmail: 'store@kingsbuilders.in',
      recipientPhone: '+91 98200 33333',
    });
  }

  async notifyGrnDone(tenantId: number, grn: { id: number; grnNumber: string; poNumber: string; vendorName: string }) {
    return this.createNotification(tenantId, {
      roleCode: 'purchase',
      type: 'GRN_DONE',
      title: `Goods Received: GRN ${grn.grnNumber}`,
      message: `Material receipt completed against PO ${grn.poNumber} from ${grn.vendorName}. QC 100% accepted.`,
      data: { docType: 'GRN', id: grn.id, docNumber: grn.grnNumber, link: '/inventory/grn' },
      channel: 'ALL',
      recipientEmail: 'priya.verma@kingsbuilders.in',
      recipientPhone: '+91 98200 44444',
    });
  }

  async notifyLowStock(tenantId: number, item: { id: number; code: string; name: string; currentQty: string | number; reorderLevel: number; unitCode: string }) {
    return this.createNotification(tenantId, {
      roleCode: 'purchase',
      type: 'LOW_STOCK',
      title: `Low Stock Alert: ${item.name}`,
      message: `Stock level for ${item.code} (${item.name}) has fallen to ${item.currentQty} ${item.unitCode} (Reorder threshold: ${item.reorderLevel}).`,
      data: { docType: 'STOCK', id: item.id, itemCode: item.code, link: '/procurement/indents' },
      channel: 'ALL',
      recipientEmail: 'priya.verma@kingsbuilders.in',
      recipientPhone: '+91 98200 44444',
    });
  }
}
