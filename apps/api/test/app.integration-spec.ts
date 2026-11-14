import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from '../src/common/redis.service';
import { LinksService } from '../src/links/links.service';
import { RedirectsService } from '../src/redirects/redirects.service';
import { RateLimiter } from '../src/common/rate-limit';
import { createApp } from '../src/bootstrap';
describe('SignalHop Phase 3 with real PostgreSQL and Redis', () => {
  let app: INestApplication;
  let tokenA: string;
  let tokenB: string;
  let cookie: string;
  let linkId: string;
  let code: string;
  const email = 'api-' + Date.now() + '@example.com';
  const password = 'Portfolio-secret-2026';
  const browser = (req: request.Test) =>
    req.set('Origin', 'http://localhost:3000').set('X-SignalHop-Client', 'web');
  beforeAll(async () => {
    app = await createApp();
    await app.get(DataSource).runMigrations();
    await app.get(RedisService).client.flushdb();
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'Alex', email, password })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'Other', email: 'other-' + email, password })
      .expect(201);
    const a = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    tokenA = a.body.accessToken;
    cookie = a.headers['set-cookie'][0].split(';')[0];
    tokenB = (
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'other-' + email, password })
        .expect(200)
    ).body.accessToken;
  });
  afterAll(async () => {
    if (app) await app.close();
  });
  it('checks actual dependency health and request ids', async () => {
    const r = await request(app.getHttpServer()).get('/health').expect(200);
    expect(r.body.dependencies).toEqual({ postgres: 'up', redis: 'up' });
    expect(r.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
    expect((await request(app.getHttpServer()).get('/health/live').expect(200)).body).toEqual({
      status: 'ok',
    });
  });
  it('returns a profile without credential fields and rejects malformed tokens', async () => {
    const r = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    expect(r.body.user.email).toBe(email);
    expect(r.body.user).not.toHaveProperty('passwordHash');
    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
  });
  it('rejects duplicate accounts and unexpected fields', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'Alex', email, password })
      .expect(409);
    await request(app.getHttpServer())
      .post('/api/v1/links')
      .auth(tokenA, { type: 'bearer' })
      .send({ destination: 'https://example.com', userId: 'attacker' })
      .expect(400);
  });
  it('creates and lists an owned link', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/v1/links')
      .auth(tokenA, { type: 'bearer' })
      .send({ destination: 'https://example.com/portfolio', title: 'Portfolio' })
      .expect(201);
    linkId = r.body.id;
    code = r.body.code;
    expect(code).toMatch(/^[A-Za-z0-9]{8}$/);
    expect(r.body.shortUrl).toContain('/r/' + code);
    const list = await request(app.getHttpServer())
      .get('/api/v1/links')
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    expect(list.body.items.some((l: { id: string }) => l.id === linkId)).toBe(true);
  });
  it('does not expose another user’s link', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/links/' + linkId)
      .auth(tokenB, { type: 'bearer' })
      .expect(404);
  });
  it('redirects and supports HEAD without caching in browsers', async () => {
    const r = await request(app.getHttpServer())
      .get('/r/' + code)
      .expect(302);
    expect(r.headers.location).toBe('https://example.com/portfolio');
    expect(r.headers['cache-control']).toBe('no-store');
    await request(app.getHttpServer())
      .head('/r/' + code)
      .expect(302);
    await request(app.getHttpServer()).get('/r/not-found-code').expect(404);
  });
  it('rejects cookie CSRF before consuming the refresh token', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set('Origin', 'https://attacker.example')
      .expect(403);
  });
  it('rotates refresh tokens atomically and logout revokes refresh', async () => {
    const r = await browser(
      request(app.getHttpServer()).post('/api/v1/auth/refresh').set('Cookie', cookie),
    ).expect(200);
    const latest = r.headers['set-cookie'][0].split(';')[0];
    expect(latest).not.toBe(cookie);
    await browser(
      request(app.getHttpServer()).post('/api/v1/auth/refresh').set('Cookie', cookie),
    ).expect(401);
    await browser(
      request(app.getHttpServer()).post('/api/v1/auth/logout').set('Cookie', latest),
    ).expect(204);
    await browser(
      request(app.getHttpServer()).post('/api/v1/auth/refresh').set('Cookie', latest),
    ).expect(401);
  });
  it('enforces the complete owned link lifecycle', async () => {
    const custom = 'managed-' + Date.now();
    const created = await request(app.getHttpServer())
      .post('/api/v1/links')
      .auth(tokenA, { type: 'bearer' })
      .send({
        destination: 'https://example.com/original',
        title: 'Lifecycle',
        customCode: custom,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      })
      .expect(201);
    const id = created.body.id;
    await request(app.getHttpServer())
      .post('/api/v1/links')
      .auth(tokenB, { type: 'bearer' })
      .send({ destination: 'https://example.com', customCode: custom })
      .expect(409);
    await request(app.getHttpServer())
      .patch('/api/v1/links/' + id)
      .auth(tokenB, { type: 'bearer' })
      .send({ enabled: false })
      .expect(404);
    await request(app.getHttpServer())
      .delete('/api/v1/links/' + id)
      .auth(tokenB, { type: 'bearer' })
      .expect(404);
    await request(app.getHttpServer())
      .patch('/api/v1/links/' + id)
      .auth(tokenA, { type: 'bearer' })
      .send({ destination: 'https://example.com/updated', enabled: false, expiresAt: null })
      .expect(200);
    await request(app.getHttpServer())
      .get('/r/' + custom)
      .expect(404);
    const disabled = await request(app.getHttpServer())
      .get('/api/v1/links?status=disabled&search=Lifecycle')
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    expect(disabled.body.total).toBe(1);
    await request(app.getHttpServer())
      .patch('/api/v1/links/' + id)
      .auth(tokenA, { type: 'bearer' })
      .send({ enabled: true })
      .expect(200);
    const redirect = await request(app.getHttpServer())
      .get('/r/' + custom)
      .expect(302);
    expect(redirect.headers.location).toBe('https://example.com/updated');
    await request(app.getHttpServer())
      .patch('/api/v1/links/' + id)
      .auth(tokenA, { type: 'bearer' })
      .send({ expiresAt: new Date(Date.now() - 1000).toISOString() })
      .expect(400);
    await app
      .get(DataSource)
      .query("UPDATE links SET expires_at = NOW() - interval '1 second' WHERE id=$1", [id]);
    await app.get(RedisService).client.del('redirect:' + custom);
    await request(app.getHttpServer())
      .get('/r/' + custom)
      .expect(410);
    const expired = await request(app.getHttpServer())
      .get('/api/v1/links?status=expired&search=Lifecycle')
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    expect(expired.body.total).toBe(1);
    await request(app.getHttpServer())
      .delete('/api/v1/links/' + id)
      .auth(tokenA, { type: 'bearer' })
      .expect(204);
    await request(app.getHttpServer())
      .get('/api/v1/links/' + id)
      .auth(tokenA, { type: 'bearer' })
      .expect(404);
    await request(app.getHttpServer())
      .get('/r/' + custom)
      .expect(410);
    await request(app.getHttpServer())
      .post('/api/v1/links')
      .auth(tokenA, { type: 'bearer' })
      .send({ destination: 'https://example.com', customCode: custom })
      .expect(409);
  });
  it('paginates stably and escapes search wildcards', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/links')
      .auth(tokenA, { type: 'bearer' })
      .send({
        destination: 'https://example.com/one',
        title: '100%real',
        customCode: 'caseA-' + Date.now(),
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/links')
      .auth(tokenA, { type: 'bearer' })
      .send({ destination: 'https://example.com/two', customCode: 'casea-' + Date.now() })
      .expect(201);
    const one = await request(app.getHttpServer())
      .get('/api/v1/links?limit=1&page=1')
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    const two = await request(app.getHttpServer())
      .get('/api/v1/links?limit=1&page=2')
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    expect(one.body.items[0].id).not.toBe(two.body.items[0].id);
    const literal = await request(app.getHttpServer())
      .get('/api/v1/links')
      .query({ search: '%' })
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    expect(literal.body.total).toBe(1);
    await request(app.getHttpServer())
      .get('/api/v1/links?limit=101')
      .auth(tokenA, { type: 'bearer' })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/v1/links/' + linkId)
      .auth(tokenA, { type: 'bearer' })
      .send({ code: 'changed' })
      .expect(400);
  });
  it('serves a warm redirect without a database lookup and invalidates edits', async () => {
    await request(app.getHttpServer())
      .get('/r/' + code)
      .expect(302);
    const lookup = jest.spyOn(app.get(LinksService), 'findCode');
    await request(app.getHttpServer())
      .get('/r/' + code)
      .expect(302);
    expect(lookup).not.toHaveBeenCalled();
    lookup.mockRestore();
    await request(app.getHttpServer())
      .patch('/api/v1/links/' + linkId)
      .auth(tokenA, { type: 'bearer' })
      .send({ destination: 'https://example.com/cache-updated' })
      .expect(200);
    expect(await app.get(RedisService).client.get('redirect:' + code)).toBeNull();
    const r = await request(app.getHttpServer())
      .get('/r/' + code)
      .expect(302);
    expect(r.headers.location).toBe('https://example.com/cache-updated');
  });
  it('bounds cache lifetime by link expiration', async () => {
    const c = await request(app.getHttpServer())
      .post('/api/v1/links')
      .auth(tokenA, { type: 'bearer' })
      .send({
        destination: 'https://example.com/expiring',
        expiresAt: new Date(Date.now() + 1200).toISOString(),
      })
      .expect(201);
    await request(app.getHttpServer())
      .get('/r/' + c.body.code)
      .expect(302);
    const ttl = await app.get(RedisService).client.pttl('redirect:' + c.body.code);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(1200);
    await new Promise((resolve) => setTimeout(resolve, 1250));
    await request(app.getHttpServer())
      .get('/r/' + c.body.code)
      .expect(410);
  });
  it('falls back to actual PostgreSQL and local limits when Redis is disconnected', async () => {
    const redis = app.get(RedisService).client;
    const limiter = app.get(RateLimiter);
    redis.disconnect();
    try {
      const r = await request(app.getHttpServer())
        .get('/r/' + code)
        .expect(302);
      expect(r.headers.location).toBe('https://example.com/cache-updated');
      await request(app.getHttpServer()).get('/health').expect(503);
      const fallbackKey = 'signalhop:rl:fallback:' + Date.now();
      expect(await limiter.check(fallbackKey, 2, 120)).toBe(0);
      expect(await limiter.check(fallbackKey, 2, 120)).toBe(0);
      expect(await limiter.check(fallbackKey, 2, 120)).toBeGreaterThan(0);
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(await limiter.check(fallbackKey, 2, 120)).toBe(0);
    } finally {
      await redis.connect();
    }
  });
  it('keeps an in-flight stale fill within its original deadline', async () => {
    const links = app.get(LinksService);
    const redis = app.get(RedisService).client;
    const original = await links.findCode(code);
    await redis.del('redirect:' + code);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const lookup = jest.spyOn(links, 'findCode').mockImplementationOnce(async () => {
      await gate;
      return original;
    });
    const pending = app.get(RedirectsService).resolve(code);
    await new Promise((resolve) => setTimeout(resolve, 30));
    await request(app.getHttpServer())
      .patch('/api/v1/links/' + linkId)
      .auth(tokenA, { type: 'bearer' })
      .send({ destination: 'https://example.com/final' })
      .expect(200);
    release();
    await pending;
    const ttl = await redis.pttl('redirect:' + code);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThan(30000);
    lookup.mockRestore();
    await redis.del('redirect:' + code);
  });
  it('enforces real Redis limits, ignores forged proxy headers, and sends Retry-After', async () => {
    const limiter = app.get(RateLimiter);
    const key = 'signalhop:rl:test:' + Date.now();
    expect(await limiter.check(key, 2, 150)).toBe(0);
    expect(await limiter.check(key, 2, 150)).toBe(0);
    expect(await limiter.check(key, 2, 150)).toBeGreaterThan(0);
    await new Promise((resolve) => setTimeout(resolve, 180));
    expect(await limiter.check(key, 2, 150)).toBe(0);
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const r = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', '203.0.113.' + i)
        .send({ email, password: 'wrong-password-value' });
      statuses.push(r.status);
      if (r.status === 429) {
        expect(Number(r.headers['retry-after'])).toBeGreaterThan(0);
        expect(r.body.code).toBe('RATE_LIMITED');
      }
    }
    expect(statuses).toContain(429);
  });
});
