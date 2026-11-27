import { Module } from '@nestjs/common';
import { PostSalesController } from './post-sales.controller';
import { PostSalesService } from './post-sales.service';
import { RealtyPricingService } from '../common/pricing.service';
import { RealtyLedgerService } from '../common/ledger.service';
import { RealtyInterestService } from '../common/interest.service';

@Module({
  controllers: [PostSalesController],
  providers: [
    PostSalesService,
    RealtyPricingService,
    RealtyLedgerService,
    RealtyInterestService,
  ],
  exports: [
    PostSalesService,
    RealtyPricingService,
    RealtyLedgerService,
    RealtyInterestService,
  ],
})
export class PostSalesModule {}
