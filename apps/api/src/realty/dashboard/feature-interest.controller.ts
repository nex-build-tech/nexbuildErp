import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequireModuleGuard } from '../common/guards/require-module.guard';
import { RequireModule } from '../common/decorators/require-module.decorator';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { desc, eq } from 'drizzle-orm';

interface AuthenticatedRequest {
  user: {
    tenantId: number;
    userId: number;
    email: string;
  };
}

export interface RequestFeatureInterestDto {
  moduleCode: string;
  note?: string;
}

@ApiTags('realty-feature-interest')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RequireModuleGuard)
@RequireModule('REALTY_SALES')
@Controller('realty/feature-interest')
export class FeatureInterestController {
  constructor(private readonly db: DatabaseService) {}

  @Post()
  @ApiOperation({ summary: 'Register user early access interest in upcoming Realty module' })
  async requestEarlyAccess(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RequestFeatureInterestDto,
  ) {
    const [result] = await this.db.db.insert(schema.reFeatureInterest).values({
      tenantId: req.user.tenantId,
      moduleCode: dto.moduleCode,
      userId: req.user.userId,
      note: dto.note ?? 'Requested early access via portal',
    });

    return {
      statusCode: 201,
      message: `Thank you! Your early access request for ${dto.moduleCode} has been recorded. Our product engineering team will invite you to the private preview.`,
      interestId: (result as any).insertId,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List early access interest registrations' })
  async getEarlyAccessRequests(@Req() req: AuthenticatedRequest) {
    return this.db.db
      .select()
      .from(schema.reFeatureInterest)
      .where(eq(schema.reFeatureInterest.tenantId, req.user.tenantId))
      .orderBy(desc(schema.reFeatureInterest.id));
  }
}
