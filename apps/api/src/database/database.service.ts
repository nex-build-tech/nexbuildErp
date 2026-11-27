import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: mysql.Pool;
  public db!: MySql2Database<typeof schema>;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const dbUrl = this.configService.get<string>('database.url') || 'mysql://root:@localhost:3307/builderp';
    this.logger.log(`Initializing MySQL connection pool to ${dbUrl.replace(/:[^:@]+@/, ':****@')}...`);

    try {
      this.pool = mysql.createPool({
        uri: dbUrl,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      this.db = drizzle(this.pool, { schema, mode: 'default' });
      await this.ping();
      this.logger.log('✅ Database connected successfully (MySQL)');
    } catch (err: unknown) {
      this.logger.warn(`⚠️ Database connection deferred / error: ${(err as Error)?.message ?? err}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      this.logger.log('Closing MySQL connection pool...');
      await this.pool.end();
    }
  }

  /**
   * Health check query
   */
  async ping(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database connection pool is not initialized');
    }
    const connection = await this.pool.getConnection();
    try {
      await connection.query('SELECT 1');
    } finally {
      connection.release();
    }
  }
}
