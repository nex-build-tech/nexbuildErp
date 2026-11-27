import { Module } from '@nestjs/common';
import { RealtyReportsController } from './realty-reports.controller';
import { RealtyReportsService } from './realty-reports.service';

@Module({
  controllers: [RealtyReportsController],
  providers: [RealtyReportsService],
  exports: [RealtyReportsService],
})
export class RealtyReportsModule {}
