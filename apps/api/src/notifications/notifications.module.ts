import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { QueueService } from './queue.service';
import { StubWhatsAppProvider } from './providers/stub-whatsapp.provider';
import { MetaWhatsAppProvider } from './providers/meta-whatsapp.provider';
import { WHATSAPP_PROVIDER } from './interfaces/whatsapp-provider.interface';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    QueueService,
    StubWhatsAppProvider,
    MetaWhatsAppProvider,
    {
      provide: WHATSAPP_PROVIDER,
      useClass: MetaWhatsAppProvider,
    },
  ],
  exports: [NotificationsService, QueueService, MetaWhatsAppProvider, StubWhatsAppProvider],
})
export class NotificationsModule {}
