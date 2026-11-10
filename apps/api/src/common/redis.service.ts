import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { settings } from '../config/config';
@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client = new Redis(settings().redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false,
    connectTimeout: 500,
    commandTimeout: 100,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });
  constructor() {
    this.client.on('error', () => undefined);
    void this.client.connect().catch(() => undefined);
  }
  async onModuleDestroy() {
    this.client.disconnect();
  }
}
