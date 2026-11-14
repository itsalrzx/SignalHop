import {
  Controller,
  Get,
  GoneException,
  Head,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { RedirectsService } from './redirects.service';
@ApiTags('Redirects')
@Controller('r')
export class RedirectsController {
  constructor(private readonly redirects: RedirectsService) {}
  @Get(':code')
  @ApiOperation({ summary: '302 redirect; unknown/disabled 404; deleted/expired 410' })
  get(@Param('code') code: string, @Res() res: Response) {
    return this.send(code, res);
  }
  @Head(':code')
  head(@Param('code') code: string, @Res() res: Response) {
    return this.send(code, res);
  }
  private async send(code: string, res: Response) {
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(code)) throw new NotFoundException('Link not found');
    const link = await this.redirects.resolve(code);
    if (!link) throw new NotFoundException('Link not found');
    if (link.deletedAt || (link.expiresAt && link.expiresAt.getTime() <= Date.now()))
      throw new GoneException('This link is no longer available');
    if (!link.enabled) throw new NotFoundException('Link not found');
    res.setHeader('Cache-Control', 'no-store');
    res.redirect(302, link.destination);
  }
}
