import { Module } from '@nestjs/common';
import { DprService } from './dpr.service';
import { DprController } from './dpr.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DprController],
  providers: [DprService],
  exports: [DprService],
})
export class DprModule {}
