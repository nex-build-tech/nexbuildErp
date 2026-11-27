import {
  Controller,
  Post,
  Body,
  Headers,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CrmService, CreateLeadDto } from './crm.service';

@ApiTags('realty-public')
@Controller('realty/public')
export class PublicLeadsController {
  constructor(private readonly crmService: CrmService) {}

  @Post('leads')
  @ApiOperation({ summary: 'Public webhook for Meta Ads, 99acres, Housing.com, and website forms' })
  @ApiQuery({ name: 'tenantId', required: false, type: Number })
  async ingestPublicLead(
    @Body() dto: CreateLeadDto,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = Number(headerTenantId || queryTenantId || 1);
    return this.crmService.createLead(tenantId, null, dto);
  }
}
