import { MigrationInterface, QueryRunner } from 'typeorm';
export class Core1794290000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email varchar(254) NOT NULL UNIQUE, name varchar(80) NOT NULL, password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE TABLE refresh_tokens (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, token_hash text NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query('CREATE INDEX refresh_tokens_user_idx ON refresh_tokens(user_id)');
    await q.query(
      `CREATE TABLE links (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, code varchar(32) COLLATE "C" NOT NULL UNIQUE, destination varchar(2048) NOT NULL, title varchar(120), enabled boolean NOT NULL DEFAULT true, expires_at timestamptz, deleted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query('CREATE INDEX links_user_created_idx ON links(user_id,created_at DESC,id DESC)');
  }
  async down(q: QueryRunner) {
    await q.query('DROP TABLE links');
    await q.query('DROP TABLE refresh_tokens');
    await q.query('DROP TABLE users');
  }
}
