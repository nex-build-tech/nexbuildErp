import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { DprService } from './dpr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant, CurrentUser } from '../auth/decorators/auth.decorators';
import { TenantContext } from '../common/middleware/tenant.middleware';

@Controller('dpr')
@UseGuards(JwtAuthGuard)
export class DprController {
  constructor(private readonly dprService: DprService) {}

  @Get()
  async getDailyProgressReports(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string
  ) {
    const sId = siteId ? parseInt(siteId, 10) : undefined;
    const filter = {
      ...(sId !== undefined && { siteId: sId }),
      ...(status && { status }),
      ...(date && { date }),
    };
    return this.dprService.getDailyProgressReports(tenant, filter);
  }

  @Get(':id')
  async getDprById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.dprService.getDprById(tenant, id);
  }

  @Post()
  async createDpr(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Body() body: any
  ) {
    return this.dprService.createDpr(tenant, user, body);
  }

  @Patch(':id/status')
  async updateDprStatus(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'draft' | 'submitted' | 'approved'
  ) {
    return this.dprService.updateDprStatus(tenant, user, id, status);
  }

  @Post(':id/photos')
  async addDprPhotos(
    @CurrentTenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body('photos') photos: Array<{ photoUrl: string; caption?: string; activityTag?: string }>
  ) {
    return this.dprService.addPhotos(tenant, id, photos || []);
  }
}
