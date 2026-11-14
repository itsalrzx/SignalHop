import { MigrationInterface, QueryRunner } from 'typeorm';
export class Analytics1794290001000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(
      'CREATE TABLE click_events (id uuid PRIMARY KEY, link_id uuid NOT NULL REFERENCES links(id) ON DELETE CASCADE, occurred_at timestamptz NOT NULL, visitor_hash varchar(64) NOT NULL, referrer varchar(253) NOT NULL, device varchar(30) NOT NULL, browser varchar(80) NOT NULL)',
    );
    await q.query('CREATE INDEX click_events_link_time_idx ON click_events(link_id,occurred_at)');
  }
  async down(q: QueryRunner) {
    await q.query('DROP TABLE click_events');
  }
}
