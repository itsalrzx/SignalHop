import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { RedisService } from './common/redis.service';
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly db: DataSource,
    private readonly redis: RedisService,
  ) {}
  @Get('live') live() {
    return { status: 'ok' };
  }
  @Get() async ready() {
    const checks = await Promise.allSettled([this.db.query('SELECT 1'), this.redis.client.ping()]);
    const dependencies = {
      postgres: checks[0].status === 'fulfilled' ? 'up' : 'down',
      redis: checks[1].status === 'fulfilled' ? 'up' : 'down',
    };
    if (checks.some((c) => c.status === 'rejected'))
      throw new ServiceUnavailableException({ message: 'Dependencies unavailable', dependencies });
    return { status: 'ok', dependencies };
  }
}
