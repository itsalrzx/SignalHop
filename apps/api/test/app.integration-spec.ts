import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from '../src/common/redis.service';
import { createApp } from '../src/bootstrap';
describe('Phase 0 with real PostgreSQL and Redis', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createApp();
  });
  afterAll(async () => {
    if (app) await app.close();
  });
  it('checks actual dependencies and returns a request ID', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', dependencies: { postgres: 'up', redis: 'up' } });
    expect(response.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
    expect((await request(app.getHttpServer()).get('/health/live').expect(200)).body).toEqual({
      status: 'ok',
    });
  });
  it('reports dependency failure while liveness remains available', async () => {
    const redis = app.get(RedisService).client;
    redis.disconnect();
    try {
      const response = await request(app.getHttpServer()).get('/health').expect(503);
      expect(response.body.dependencies).toEqual({ postgres: 'up', redis: 'down' });
      expect(response.body).toMatchObject({ statusCode: 503, code: 'HTTP_503' });
      await request(app.getHttpServer()).get('/health/live').expect(200);
    } finally {
      await redis.connect();
    }
  });
  it('documents only the foundation endpoints and has no product tables', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json').expect(200);
    expect(Object.keys(response.body.paths).sort()).toEqual(['/health', '/health/live']);
    const rows: { table_name: string }[] = await app
      .get(DataSource)
      .query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    expect(rows.filter((row) => row.table_name !== 'migrations')).toEqual([]);
    expect(app.get(DataSource).options.synchronize).toBe(false);
  });
  it('returns the documented error envelope for absent product routes', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/links').expect(404);
    expect(response.body).toMatchObject({ statusCode: 404, code: 'HTTP_404' });
    expect(response.body.requestId).toBe(response.headers['x-request-id']);
  });
});
