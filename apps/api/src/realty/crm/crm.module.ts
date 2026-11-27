import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { PublicLeadsController } from './public-leads.controller';
import { CrmService } from './crm.service';

@Module({
  controllers: [CrmController, PublicLeadsController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
