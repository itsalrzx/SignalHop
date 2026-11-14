import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { LinksModule } from '../links/links.module';
import { RedirectsService } from './redirects.service';
import { RedirectsController } from './redirects.controller';
@Module({
  imports: [LinksModule, AnalyticsModule],
  controllers: [RedirectsController],
  providers: [RedirectsService],
  exports: [RedirectsService],
})
export class RedirectsModule {}
