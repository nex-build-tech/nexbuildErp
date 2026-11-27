import { Module } from '@nestjs/common';
import { ChannelPartnersController } from './channel-partners.controller';
import { PublicChannelPartnersController } from './public-channel-partners.controller';
import { ChannelPartnersService } from './channel-partners.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ChannelPartnersController, PublicChannelPartnersController],
  providers: [ChannelPartnersService],
  exports: [ChannelPartnersService],
})
export class ChannelPartnersModule {}
