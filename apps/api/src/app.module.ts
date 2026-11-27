import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import type { Params } from 'nestjs-pino';
import { configuration } from './config/configuration';
import { envSchema } from './config/env.schema';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { MastersModule } from './masters/masters.module';
import { ProcurementModule } from './procurement/procurement.module';
import { InventoryModule } from './inventory/inventory.module';
import { ContractorsBillingModule } from './contractors-billing/contractors-billing.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DprModule } from './dpr/dpr.module';
import { LabourModule } from './labour/labour.module';
import { BoqModule } from './boq/boq.module';
import { TallyModule } from './integrations/tally/tally.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { RealtyModule } from './realty/realty.module';
import { RolesModule } from './roles/roles.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

const pinoParams: Params = {
  pinoHttp: {
    level: process.env['LOG_LEVEL'] ?? 'info',
    ...(process.env['NODE_ENV'] !== 'production'
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
          },
        }
      : {}),
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    customProps: () => ({ context: 'HTTP' }),
  },
};

@Module({
  imports: [
    // ── Config ───────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: (config: Record<string, unknown>) => {
        const result = envSchema.safeParse(config);
        if (!result.success) {
          const formatted = result.error.format();
          throw new Error(
            `❌  Environment validation failed:\n${JSON.stringify(formatted, null, 2)}`,
          );
        }
        return result.data;
      },
    }),

    // ── Structured logging via Pino ───────────────────────────────────────
    LoggerModule.forRoot(pinoParams),

    // ── Rate limiting ─────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 60_000, limit: 500 },
      { name: 'long', ttl: 3_600_000, limit: 10_000 },
    ]),

    // ── Feature modules ───────────────────────────────────────────────────
    DatabaseModule,
    HealthModule,
    AuthModule,
    MastersModule,
    ProcurementModule,
    InventoryModule,
    ContractorsBillingModule,
    DashboardModule,
    NotificationsModule,
    DprModule,
    LabourModule,
    BoqModule,
    TallyModule,
    SuperAdminModule,
    RealtyModule,
    RolesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
