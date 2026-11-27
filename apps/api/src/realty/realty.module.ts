import { Module } from '@nestjs/common';
import { SetupModule } from './setup/setup.module';
import { CrmModule } from './crm/crm.module';
import { RealtyInventoryModule } from './inventory/realty-inventory.module';
import { ChannelPartnersModule } from './channel-partners/channel-partners.module';
import { PostSalesModule } from './post-sales/post-sales.module';
import { RealtyReportsModule } from './reports/realty-reports.module';
import { RealtyDashboardModule } from './dashboard/realty-dashboard.module';
import { RequireModuleGuard } from './common/guards/require-module.guard';

@Module({
  imports: [
    SetupModule,
    CrmModule,
    RealtyInventoryModule,
    ChannelPartnersModule,
    PostSalesModule,
    RealtyReportsModule,
    RealtyDashboardModule,
  ],
  providers: [RequireModuleGuard],
  exports: [
    SetupModule,
    CrmModule,
    RealtyInventoryModule,
    ChannelPartnersModule,
    PostSalesModule,
    RealtyReportsModule,
    RealtyDashboardModule,
    RequireModuleGuard,
  ],
})
export class RealtyModule {}
