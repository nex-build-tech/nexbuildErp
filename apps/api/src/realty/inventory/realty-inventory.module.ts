import { Module } from '@nestjs/common';
import { RealtyInventoryController } from './realty-inventory.controller';
import { RealtyInventoryService } from './realty-inventory.service';
import { RealtyPricingService } from '../common/pricing.service';

@Module({
  controllers: [RealtyInventoryController],
  providers: [RealtyInventoryService, RealtyPricingService],
  exports: [RealtyInventoryService, RealtyPricingService],
})
export class RealtyInventoryModule {}
