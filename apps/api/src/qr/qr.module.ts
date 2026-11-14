import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LinksModule } from '../links/links.module';
import { QRController } from './qr.controller';
@Module({ imports: [AuthModule, LinksModule], controllers: [QRController] })
export class QRModule {}
