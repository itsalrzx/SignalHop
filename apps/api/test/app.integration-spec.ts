import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createApp } from '../src/bootstrap';
describe('SignalHop Phase 1 with real PostgreSQL and Redis', () => {
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
  it('creates owned links and isolates listings per user', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/v1/links')
      .auth(tokenA, { type: 'bearer' })
      .send({ destination: 'https://example.com/portfolio', title: 'Portfolio' })
      .expect(201);
    linkId = r.body.id;
    code = r.body.code;
    expect(code).toMatch(/^[A-Za-z0-9]{8}$/);
    expect(r.body.shortUrl).toContain('/r/' + code);
    const listA = await request(app.getHttpServer())
      .get('/api/v1/links')
      .auth(tokenA, { type: 'bearer' })
      .expect(200);
    expect(listA.body.items.some((l: { id: string }) => l.id === linkId)).toBe(true);
    const listB = await request(app.getHttpServer())
      .get('/api/v1/links')
      .auth(tokenB, { type: 'bearer' })
      .expect(200);
    expect(listB.body.items.some((l: { id: string }) => l.id === linkId)).toBe(false);
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
});
