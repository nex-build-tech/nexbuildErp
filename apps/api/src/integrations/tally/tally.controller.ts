import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { TallyService } from './tally.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../auth/decorators/auth.decorators';
import { TenantContext } from '../../common/middleware/tenant.middleware';

@Controller('integrations/tally')
@UseGuards(JwtAuthGuard)
export class TallyController {
  constructor(private readonly tallyService: TallyService) {}

  @Get('purchase-vouchers-xml')
  async downloadPurchaseVouchersXml(
    @CurrentTenant() tenant: TenantContext,
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('siteId') siteId?: string,
    @Query('vendorId') vendorId?: string
  ) {
    const sId = siteId ? parseInt(siteId, 10) : undefined;
    const vId = vendorId ? parseInt(vendorId, 10) : undefined;
    const filter = {
      ...(sId !== undefined && { siteId: sId }),
      ...(vId !== undefined && { vendorId: vId }),
      ...(from && { from }),
      ...(to && { to }),
    };

    const xml = await this.tallyService.generatePurchaseVouchersXml(tenant, filter);

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `Tally_Purchases_${tenant.slug || 'kings'}_${timestamp}.xml`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(xml);
  }
}
