import { Module } from '@nestjs/common';
import { TallyService } from './tally.service';
import { TallyController } from './tally.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TallyController],
  providers: [TallyService],
  exports: [TallyService],
})
export class TallyModule {}
