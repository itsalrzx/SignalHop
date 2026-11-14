import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSource } from './database/data-source';
import { PlatformModule } from './common/platform.module';
import { QRModule } from './qr/qr.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LinksModule } from './links/links.module';
import { RedirectsModule } from './redirects/redirects.module';
import { HealthController } from './health.controller';
@Module({
  imports: [
    TypeOrmModule.forRoot(dataSource.options),
    PlatformModule,
    AuthModule,
    UsersModule,
    LinksModule,
    RedirectsModule,
    QRModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
