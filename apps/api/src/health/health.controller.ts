import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { DatabaseService } from '../database/database.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint — returns DB connectivity status' })
  check() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.databaseService.ping();
          return { database: { status: 'up' } };
        } catch (error: unknown) {
          return {
            database: {
              status: 'down',
              message: (error as Error)?.message ?? 'Connection failed',
            },
          };
        }
      },
    ]);
  }
}
