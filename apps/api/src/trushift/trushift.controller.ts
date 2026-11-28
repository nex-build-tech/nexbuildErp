import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant, CurrentUser } from '../auth/decorators/auth.decorators';
import { TenantContext } from '../common/middleware/tenant.middleware';
import { TrushiftService } from './trushift.service';
import { PunchAttendanceDto } from './dto/punch-attendance.dto';

@ApiTags('trushift')
@Controller('trushift')
export class TrushiftController {
  constructor(private readonly trushiftService: TrushiftService) {}

  @Get('assigned-sites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assigned sites and geofence configuration for the current employee' })
  getAssignedSites(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('id') userId: number,
  ) {
    return this.trushiftService.getAssignedSites(tenant, userId);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List geotagged & photo-verified staff attendance logs' })
  getLogs(
    @CurrentTenant() tenant: TenantContext,
    @Query('siteId') siteId?: string,
    @Query('userId') userId?: string,
    @Query('punchType') punchType?: string,
    @Query('search') search?: string,
  ) {
    const parsedSiteId = siteId ? parseInt(siteId, 10) : undefined;
    const parsedUserId = userId ? parseInt(userId, 10) : undefined;
    return this.trushiftService.getLogs(tenant, {
      ...(parsedSiteId && !Number.isNaN(parsedSiteId) ? { siteId: parsedSiteId } : {}),
      ...(parsedUserId && !Number.isNaN(parsedUserId) ? { userId: parsedUserId } : {}),
      ...(punchType ? { punchType } : {}),
      ...(search ? { search } : {}),
    });
  }

  @Post('attendance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit geofence-verified staff attendance with watermarked photo' })
  punchAttendance(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: { id: number },
    @Body() dto: PunchAttendanceDto,
  ) {
    return this.trushiftService.punchAttendance(tenant, user, dto);
  }

  @Get('photos/:filename')
  @ApiOperation({ summary: 'Serve stored watermarked attendance photo' })
  async getAttendancePhoto(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const { filePath, contentType } = await this.trushiftService.resolvePhotoPath(filename);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.type(contentType);
    return res.sendFile(filePath);
  }
}
