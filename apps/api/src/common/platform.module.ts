import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RateLimiter, RateLimitGuard } from './rate-limit';
import { RedisService } from './redis.service';
@Global()
@Module({
  providers: [RedisService, RateLimiter, { provide: APP_GUARD, useClass: RateLimitGuard }],
  exports: [RedisService],
})
export class PlatformModule {}
