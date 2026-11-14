import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(__dirname, '../../../../.env'), quiet: true });
export function settings(env: NodeJS.ProcessEnv = process.env) {
  const required = (key: string) => {
    const value = env[key];
    if (!value) throw new Error(key + ' is required');
    return value;
  };
  const secret = (key: string) => {
    const value = required(key);
    if (value.length < 32 || (env.NODE_ENV === 'production' && value.startsWith('replace-')))
      throw new Error(key + ' must be a random secret of at least 32 characters');
    return value;
  };
  const databaseUrl = new URL(required('DATABASE_URL'));
  if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol))
    throw new Error('DATABASE_URL must be PostgreSQL');
  if (!databaseUrl.username || !databaseUrl.password)
    throw new Error('DATABASE_URL requires database credentials');
  const redisUrl = new URL(required('REDIS_URL'));
  if (!['redis:', 'rediss:'].includes(redisUrl.protocol))
    throw new Error('REDIS_URL must be Redis');
  const origin = new URL(required('APP_ORIGIN')).origin;
  const port = Number(env.API_PORT || 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid API_PORT');
  if (env.NODE_ENV === 'production' && !origin.startsWith('https://'))
    throw new Error('Production APP_ORIGIN requires HTTPS');
  return {
    databaseUrl: databaseUrl.toString(),
    redisUrl: redisUrl.toString(),
    origin,
    publicBaseUrl: new URL(env.PUBLIC_BASE_URL || origin).origin,
    jwtSecret: secret('JWT_SECRET'),
    port,
    production: env.NODE_ENV === 'production',
    trustProxy: env.TRUST_PROXY === 'true',
  };
}
