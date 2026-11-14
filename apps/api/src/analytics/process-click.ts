import type { DataSource } from 'typeorm';
import { UnrecoverableError } from 'bullmq';
import { isUUID } from 'class-validator';
import Bowser from 'bowser';
import type { ClickPayload } from './queue';
export async function processClick(db: DataSource, event: ClickPayload) {
  if (
    !event ||
    !isUUID(event.id) ||
    !isUUID(event.linkId) ||
    !Number.isFinite(Date.parse(event.occurredAt)) ||
    !/^[a-f0-9]{64}$/.test(event.visitorHash) ||
    typeof event.referrer !== 'string' ||
    event.referrer.length > 253 ||
    typeof event.userAgent !== 'string' ||
    event.userAgent.length > 512
  )
    throw new UnrecoverableError('Invalid click event');
  const parsed = event.userAgent ? Bowser.getParser(event.userAgent) : null;
  const device = parsed?.getPlatformType() || 'unknown';
  const browser = parsed?.getBrowserName() || 'Unknown';
  const rows: unknown[] = await db.query(
    'INSERT INTO click_events (id,link_id,occurred_at,visitor_hash,referrer,device,browser) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING RETURNING id',
    [
      event.id,
      event.linkId,
      event.occurredAt,
      event.visitorHash,
      event.referrer,
      device.slice(0, 30),
      browser.slice(0, 80),
    ],
  );
  return { inserted: rows.length === 1 };
}
