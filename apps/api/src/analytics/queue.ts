import { settings } from '../config/config';
export const CLICKS_QUEUE = 'signalhop-clicks';
export function redisConnection(worker = false) {
  const url = new URL(settings().redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: Number(url.pathname.slice(1) || 0),
    ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
    maxRetriesPerRequest: worker ? null : 0,
    enableOfflineQueue: worker,
    connectTimeout: 500,
    ...(!worker ? { commandTimeout: 100 } : {}),
  };
}
export interface ClickPayload {
  id: string;
  linkId: string;
  occurredAt: string;
  visitorHash: string;
  referrer: string;
  userAgent: string;
}
