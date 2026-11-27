import { Module } from '@nestjs/common';
import { ContractorsBillingController } from './contractors-billing.controller';
import { ContractorsBillingService } from './contractors-billing.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ContractorsBillingController],
  providers: [ContractorsBillingService],
  exports: [ContractorsBillingService],
})
export class ContractorsBillingModule {}
