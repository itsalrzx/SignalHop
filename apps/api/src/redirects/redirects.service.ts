import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../common/redis.service';
import { LinksService } from '../links/links.service';
export interface RedirectRecord {
  id: string;
  userId: string;
  code: string;
  destination: string;
  enabled: boolean;
  expiresAt: string | null;
  deletedAt: string | null;
}
@Injectable()
export class RedirectsService {
  private readonly logger = new Logger('Redirect');
  constructor(
    private readonly redis: RedisService,
    private readonly links: LinksService,
  ) {}
  async resolve(code: string): Promise<RedirectRecord | null> {
    const key = 'redirect:' + code;
    const started = Date.now();
    try {
      const cached = await this.redis.client.get(key);
      if (cached) {
        const value: RedirectRecord = JSON.parse(cached);
        if (
          typeof value.id === 'string' &&
          typeof value.userId === 'string' &&
          typeof value.destination === 'string' &&
          typeof value.enabled === 'boolean' &&
          value.code === code &&
          (value.expiresAt === null || Number.isFinite(Date.parse(value.expiresAt))) &&
          (value.deletedAt === null || Number.isFinite(Date.parse(value.deletedAt)))
        ) {
          this.logger.debug({ event: 'redirect_lookup', cache: 'hit' });
          return value;
        }
      }
    } catch {
      this.logger.warn({ event: 'cache_read_failed' });
    }
    this.logger.debug({ event: 'redirect_lookup', cache: 'miss' });
    const link = await this.links.findCode(code);
    if (!link) return null;
    const value: RedirectRecord = {
      id: link.id,
      userId: link.userId,
      code: link.code,
      destination: link.destination,
      enabled: link.enabled,
      expiresAt: link.expiresAt?.toISOString() || null,
      deletedAt: link.deletedAt?.toISOString() || null,
    };
    const ttl =
      Math.min(started + 30000, value.expiresAt ? Date.parse(value.expiresAt) : Infinity) -
      Date.now();
    if (ttl > 0) {
      try {
        await this.redis.client.set(key, JSON.stringify(value), 'PX', ttl);
      } catch {
        this.logger.warn({ event: 'cache_write_failed' });
      }
    }
    return value;
  }
}
