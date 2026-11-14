import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';
@Injectable()
export class RateLimiter {
  private readonly windows = new Map<string, { count: number; until: number }>();
  check(key: string, max: number, windowMs: number) {
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
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    let category = '';
    let max = 0;
    let window = 60000;
    if (req.path.endsWith('/auth/register')) {
      category = 'register';
      max = 10;
      window = 3600000;
    } else if (req.path.endsWith('/auth/login')) {
      category = 'login';
      max = 10;
    } else if (req.path.endsWith('/auth/refresh')) {
      category = 'refresh';
      max = 60;
    }
    if (!category) return true;
    const key =
      'signalhop:rl:' +
      category +
      ':' +
      createHash('sha256')
        .update(req.ip || 'unknown')
        .digest('hex');
    const retry = this.limiter.check(key, max, window);
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
