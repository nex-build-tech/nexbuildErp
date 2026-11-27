import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BoqService } from './boq.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../auth/decorators/auth.decorators';
import { TenantContext } from '../common/middleware/tenant.middleware';

@Controller('boq')
@UseGuards(JwtAuthGuard)
export class BoqController {
  constructor(private readonly boqService: BoqService) {}

  @Get()
  async getBoqItems(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
    @Query('workPackage') workPackage?: string
  ) {
    const sId = siteId ? parseInt(siteId, 10) : undefined;
    const filter = {
      ...(sId !== undefined && { siteId: sId }),
      ...(workPackage && { workPackage }),
    };
    return this.boqService.getBoqItems(tenant, filter);
  }

  @Post()
  async createBoqItem(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: any
  ) {
    return this.boqService.createBoqItem(tenant, body);
  }

  @Post('bulk')
  async bulkCreateBoqItems(
    @CurrentTenant() tenant: TenantContext,
    @Body('siteId') siteId: number,
    @Body('items') items: any[]
  ) {
    return this.boqService.bulkCreateBoqItems(tenant, Number(siteId), items || []);
  }

  @Get('consumption-comparison')
  async getConsumptionComparison(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string
  ) {
    const sId = siteId ? parseInt(siteId, 10) : undefined;
    return this.boqService.getConsumptionVsBoqComparison(tenant, sId);
  }
}
