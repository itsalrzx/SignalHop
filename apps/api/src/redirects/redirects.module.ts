import { Module } from '@nestjs/common';
import { LinksModule } from '../links/links.module';
import { RedirectsService } from './redirects.service';
import { RedirectsController } from './redirects.controller';
@Module({
  imports: [LinksModule],
  controllers: [RedirectsController],
  providers: [RedirectsService],
  exports: [RedirectsService],
})
export class RedirectsModule {}
