import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LinksModule } from '../links/links.module';
import { ClickCapture } from './click-capture.service';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
@Module({
  imports: [AuthModule, LinksModule],
  providers: [ClickCapture, AnalyticsService],
  controllers: [AnalyticsController],
  exports: [ClickCapture],
})
export class AnalyticsModule {}
