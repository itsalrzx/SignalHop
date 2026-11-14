import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LinksService } from '../links/links.service';
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly db: DataSource,
    private readonly links: LinksService,
  ) {}
  async report(userId: string, days: number, linkId?: string) {
    const link = linkId ? await this.links.owned(userId, linkId) : undefined;
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    end.setUTCDate(end.getUTCDate() + 1);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - days);
    const args = [userId, start, end, ...(linkId ? [linkId] : [])];
    const where =
      ' FROM click_events e JOIN links l ON l.id=e.link_id WHERE l.user_id=$1 AND l.deleted_at IS NULL AND e.occurred_at >= $2 AND e.occurred_at < $3' +
      (linkId ? ' AND l.id=$4' : '');
    const countArgs = linkId ? [userId, linkId] : [userId];
    const breakdown = (column: 'referrer' | 'device' | 'browser') =>
      this.db.query(
        'SELECT e.' +
          column +
          ' AS name, COUNT(*)::int AS value' +
          where +
          ' GROUP BY e.' +
          column +
          ' ORDER BY value DESC,name LIMIT 10',
        args,
      );
    const [totals, counts, rows, topLinks, referrers, devices, browsers] = await Promise.all([
      this.db.query(
        'SELECT COUNT(*)::int AS clicks,COUNT(DISTINCT e.visitor_hash)::int AS visitors' + where,
        args,
      ),
      this.db.query(
        'SELECT COUNT(*)::int AS total,COUNT(*) FILTER (WHERE enabled AND (expires_at IS NULL OR expires_at>NOW()))::int AS active FROM links WHERE user_id=$1 AND deleted_at IS NULL' +
          (linkId ? ' AND id=$2' : ''),
        countArgs,
      ),
      this.db.query(
        "SELECT to_char(e.occurred_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS date,COUNT(*)::int AS clicks" +
          where +
          ' GROUP BY 1 ORDER BY 1',
        args,
      ),
      this.db.query(
        'SELECT l.id,l.title,l.code,l.destination,COUNT(*)::int AS clicks' +
          where +
          ' GROUP BY l.id ORDER BY clicks DESC,l.created_at DESC LIMIT 5',
        args,
      ),
      breakdown('referrer'),
      breakdown('device'),
      breakdown('browser'),
    ]);
    const daily = Array.from({ length: days }, (_, i) => {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + i);
      const key = date.toISOString().slice(0, 10);
      const row = rows.find((r: { date: string; clicks: number }) => r.date === key);
      return { date: key, clicks: Number(row?.clicks || 0) };
    });
    return {
      summary: {
        totalLinks: Number(counts[0].total),
        activeLinks: Number(counts[0].active),
        totalClicks: Number(totals[0].clicks),
        uniqueVisitors: Number(totals[0].visitors),
      },
      daily,
      topLinks,
      referrers,
      devices,
      browsers,
      generatedAt: new Date().toISOString(),
      timezone: 'UTC',
      ...(link ? { link: this.links.serialize(link) } : {}),
    };
  }
}
