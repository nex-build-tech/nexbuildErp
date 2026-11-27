import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService, CreateNotificationDto } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant, CurrentUser } from '../auth/decorators/auth.decorators';
import { TenantContext } from '../common/middleware/tenant.middleware';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List in-app notifications for current user/tenant' })
  listNotifications(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Query('isRead') isRead?: string,
    @Query('limit') limit?: string
  ) {
    const opts: { isRead?: string; limit?: number } = {};
    if (isRead !== undefined) opts.isRead = isRead;
    if (limit) opts.limit = parseInt(limit, 10);
    return this.notificationsService.listNotifications(tenant, user, opts);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count badge' })
  getUnreadCount(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any
  ) {
    return this.notificationsService.getUnreadCount(tenant, user);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark single notification as read' })
  markAsRead(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.notificationsService.markAsRead(tenant, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  markAllAsRead(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any
  ) {
    return this.notificationsService.markAllAsRead(tenant, user);
  }

  @Post('test')
  @ApiOperation({ summary: 'Send test demo notification across channels' })
  createTestNotification(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: Partial<CreateNotificationDto>
  ) {
    return this.notificationsService.createNotification(tenant.id, {
      type: dto.type || 'SYSTEM',
      title: dto.title || 'Kings Builders Construction Alert',
      message: dto.message || 'Steel reinforcement reorder point reached for Kings Sapphire Heights.',
      data: dto.data || { docType: 'DEMO', link: '/inventory/stock' },
      channel: dto.channel || 'ALL',
      recipientEmail: dto.recipientEmail || 'vikram.singh@kingsbuilders.in',
      recipientPhone: dto.recipientPhone || '+91 98200 11111',
    });
  }
}
