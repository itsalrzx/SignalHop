import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { RedisService } from './redis.service';
import type { Request, Response } from 'express';
@Injectable()
export class RateLimiter {
  private readonly windows = new Map<string, { count: number; until: number }>();
  constructor(private readonly redis: RedisService) {}
  async check(key: string, max: number, windowMs: number) {
    try {
      const result = (await this.redis.client.eval(
        "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]); end; return {n,redis.call('PTTL',KEYS[1])}",
        1,
        key,
        windowMs,
      )) as [number, number];
      return result[0] > max ? Math.max(1, Math.ceil(result[1] / 1000)) : 0;
    } catch {
      return this.localCheck(key, max, windowMs);
    }
  }
  private localCheck(key: string, max: number, windowMs: number) {
    const now = Date.now();
    let state = this.windows.get(key);
    if (!state || state.until <= now) {
      if (this.windows.size >= 10000) {
        for (const [k, v] of this.windows) if (v.until <= now) this.windows.delete(k);
        if (this.windows.size >= 10000) return Math.ceil(windowMs / 1000);
      }
      state = { count: 0, until: now + windowMs };
      this.windows.set(key, state);
    }
    state.count++;
    return state.count > max ? Math.max(1, Math.ceil((state.until - now) / 1000)) : 0;
  }
}
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly limiter: RateLimiter) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    let category = 'api',
      max = 300,
      window = 60000;
    if (req.path.startsWith('/health') || req.path.startsWith('/docs')) return true;
    if (req.path.endsWith('/auth/register')) {
      category = 'register';
      max = 10;
      window = 3600000;
    } else if (req.path.endsWith('/auth/login')) {
      category = 'login';
      max = 10;
    } else if (req.path.endsWith('/users/me/password')) {
      category = 'password';
      max = 5;
    } else if (req.path.endsWith('/auth/refresh')) {
      category = 'refresh';
      max = 60;
    } else if (req.path === '/api/v1/links' && req.method === 'POST') {
      category = 'create';
      max = 30;
    } else if (req.path.startsWith('/r/')) {
      category = 'redirect';
      max = 600;
    }
    const key =
      'signalhop:rl:' +
      category +
      ':' +
      createHash('sha256')
        .update(req.ip || 'unknown')
        .digest('hex');
    const retry = await this.limiter.check(key, max, window);
    if (retry) {
      res.setHeader('Retry-After', retry);
      throw new HttpException(
        { code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' },
        429,
      );
    }
    return true;
  }
}
