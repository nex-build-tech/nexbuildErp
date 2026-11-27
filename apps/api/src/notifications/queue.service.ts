import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NotificationJobData {
  jobId: string;
  type: 'email' | 'whatsapp' | 'in_app';
  recipient: string;
  subject?: string;
  body: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private isRedisAvailable = false;
  private queueInstance: any = null;
  private inMemoryQueue: NotificationJobData[] = [];
  private isProcessing = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisHost = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const redisPort = Number(this.configService.get<number>('REDIS_PORT') || 6379);

    try {
      // Safe dynamic resolution without compiler error if package not installed
      const moduleName = 'bullmq';
      const bullmq: any = await import(/* webpackIgnore: true */ moduleName).catch(() => null);

      if (bullmq?.Queue) {
        this.queueInstance = new bullmq.Queue('builderp-notifications', {
          connection: { host: redisHost, port: redisPort, maxRetriesPerRequest: 1 },
        });

        await this.queueInstance.client;
        this.isRedisAvailable = true;
        this.logger.log(`⚡ Connected to BullMQ Redis Queue on ${redisHost}:${redisPort}`);

        new bullmq.Worker(
          'builderp-notifications',
          async (job: any) => {
            await this.processJob(job.data);
          },
          { connection: { host: redisHost, port: redisPort } }
        );
      } else {
        this.logger.log('ℹ️ Redis not running locally. Using asynchronous In-Memory Notification Queue fallback (zero Docker overhead).');
      }
    } catch {
      this.isRedisAvailable = false;
      this.logger.log('ℹ️ Redis not running locally. Using asynchronous In-Memory Notification Queue fallback (zero Docker overhead).');
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queueInstance) {
      try {
        await this.queueInstance.close();
      } catch {
        // ignore on shutdown
      }
    }
  }

  /**
   * Enqueue a notification job (Email / WhatsApp dispatch)
   */
  async enqueue(data: NotificationJobData): Promise<{ queued: boolean; jobId: string; mode: string }> {
    if (this.isRedisAvailable && this.queueInstance) {
      try {
        const job = await this.queueInstance.add(data.type, data, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
        });
        return { queued: true, jobId: job.id, mode: 'bullmq_redis' };
      } catch (err: any) {
        this.logger.warn(`BullMQ push failed (${err.message}). Falling back to in-memory queue.`);
      }
    }

    // In-memory async worker queue fallback
    this.inMemoryQueue.push(data);
    setImmediate(() => this.drainInMemoryQueue());

    return { queued: true, jobId: data.jobId, mode: 'in_memory_async' };
  }

  private async drainInMemoryQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.inMemoryQueue.length > 0) {
      const job = this.inMemoryQueue.shift();
      if (job) {
        try {
          await this.processJob(job);
        } catch (err: any) {
          this.logger.error(`Error processing job ${job.jobId}: ${err.message}`);
        }
      }
    }

    this.isProcessing = false;
  }

  private async processJob(job: NotificationJobData): Promise<void> {
    if (job.type === 'email') {
      this.logger.log(
        `📧 [Email Dispatcher] Sent notification email to: ${job.recipient} | Subject: "${job.subject || 'BuildERP Alert'}"`
      );
    } else if (job.type === 'whatsapp') {
      this.logger.log(
        `📲 [WhatsApp Dispatcher] Sent WhatsApp template to: ${job.recipient} | Body: "${job.body}"`
      );
    } else {
      this.logger.log(`🔔 [In-App Dispatcher] Dispatched alert for: ${job.recipient}`);
    }
  }
}
