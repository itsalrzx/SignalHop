import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { createHmac, randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { settings } from '../config/config';
import { RedisService } from '../common/redis.service';
import type { RedirectRecord } from '../redirects/redirects.service';
import { CLICKS_QUEUE, ClickPayload, redisConnection } from './queue';
@Injectable()
export class ClickCapture implements OnModuleDestroy {
  private readonly logger = new Logger('ClickCapture');
  readonly queue = new Queue<ClickPayload>(CLICKS_QUEUE, {
    connection: redisConnection(),
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 500 },
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 86400, count: 1000 },
    },
  });
  private pending = 0;
  constructor(private readonly redis: RedisService) {
    this.queue.on('error', () => this.logger.warn({ event: 'analytics_queue_unavailable' }));
  }
  async capture(link: RedirectRecord, req: Request) {
    if (this.redis.client.status !== 'ready' || this.pending >= 100) {
      this.logger.warn({ event: 'analytics_capture_skipped' });
      return;
    }
    const userAgent = (req.get('user-agent') || '').slice(0, 512);
    let referrer = 'Direct / unknown';
    try {
      const raw = req.get('referer');
      if (raw) referrer = new URL(raw).hostname.slice(0, 253) || referrer;
    } catch {
      /* Invalid optional referrer is unknown. */
    }
    const event: ClickPayload = {
      id: randomUUID(),
      linkId: link.id,
      occurredAt: new Date().toISOString(),
      visitorHash: createHmac('sha256', settings().fingerprintSecret)
        .update(link.userId + '\0' + (req.ip || 'unknown') + '\0' + userAgent)
        .digest('hex'),
      referrer,
      userAgent,
    };
    this.pending++;
    let timer: NodeJS.Timeout | undefined;
    const pending = this.queue.add('click', event, { jobId: event.id }).finally(() => {
      this.pending--;
    });
    try {
      await Promise.race([
        pending,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Capture deadline')), 40);
        }),
      ]);
    } catch {
      this.logger.warn({ event: 'analytics_capture_failed' });
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  async onModuleDestroy() {
    await this.queue.close();
  }
}
