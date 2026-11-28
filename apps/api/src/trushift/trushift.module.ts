import { Module } from '@nestjs/common';
import { TrushiftController } from './trushift.controller';
import { TrushiftService } from './trushift.service';

@Module({
  controllers: [TrushiftController],
  providers: [TrushiftService],
  exports: [TrushiftService],
})
export class TrushiftModule {}
