import {
  Controller,
  Post,
  Body,
  Headers,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChannelPartnersService, RegisterCpDto } from './channel-partners.service';
import type { Request } from 'express';

@ApiTags('realty-public')
@Controller('realty/public/channel-partners')
export class PublicChannelPartnersController {
  constructor(private readonly cpService: ChannelPartnersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Public portal registration for external Channel Partners' })
  @ApiQuery({ name: 'tenantId', required: false, type: Number })
  async registerChannelPartner(
    @Body() dto: RegisterCpDto,
    @Req() req: Request,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = Number(headerTenantId || queryTenantId || 1);
    const ip = req.ip || req.socket.remoteAddress;
    return this.cpService.registerPublicCp(tenantId, dto, ip);
  }
}
