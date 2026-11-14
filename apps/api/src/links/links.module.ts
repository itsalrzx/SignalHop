import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Link } from './link.entity';
import { LinksService } from './links.service';
import { LinksController } from './links.controller';
@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Link])],
  providers: [LinksService],
  controllers: [LinksController],
  exports: [LinksService],
})
export class LinksModule {}
