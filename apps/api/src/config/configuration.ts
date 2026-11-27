import type { Env } from './env.schema';

/**
 * Returns a typed, nested configuration object derived from validated env vars.
 * Used by ConfigModule.forRoot({ load: [configuration] }).
 */
export const configuration = () => {
  const env = process.env as unknown as Env;

  return {
    app: {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      corsOrigin: env.CORS_ORIGIN,
      swaggerEnabled: env.SWAGGER_ENABLED,
    },
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      url: env.REDIS_URL,
    },
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    minio: {
      endpoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
      bucket: env.MINIO_BUCKET,
    },
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    logging: {
      level: env.LOG_LEVEL,
    },
  };
};

export type AppConfig = ReturnType<typeof configuration>;
