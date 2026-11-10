import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSource } from './database/data-source';
import { PlatformModule } from './common/platform.module';
import { HealthController } from './health.controller';
@Module({
  imports: [TypeOrmModule.forRoot(dataSource.options), PlatformModule],
  controllers: [HealthController],
})
export class AppModule {}
