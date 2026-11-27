import { Module } from '@nestjs/common';
import { RealtyDashboardController } from './realty-dashboard.controller';
import { FeatureInterestController } from './feature-interest.controller';
import { RealtyDashboardService } from './realty-dashboard.service';

@Module({
  controllers: [RealtyDashboardController, FeatureInterestController],
  providers: [RealtyDashboardService],
  exports: [RealtyDashboardService],
})
export class RealtyDashboardModule {}
