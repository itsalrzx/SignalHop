import {
  Controller,
  Get,
  GoneException,
  Head,
  NotFoundException,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ClickCapture } from '../analytics/click-capture.service';
import { RedirectsService } from './redirects.service';
@ApiTags('Redirects')
@Controller('r')
export class RedirectsController {
  constructor(
    private readonly redirects: RedirectsService,
    private readonly capture: ClickCapture,
  ) {}
  @Get(':code')
  @ApiOperation({ summary: '302 redirect; unknown/disabled 404; deleted/expired 410' })
  async get(@Param('code') code: string, @Req() req: Request, @Res() res: Response) {
    return this.send(code, req, res);
  }
  @Head(':code')
  async head(@Param('code') code: string, @Req() req: Request, @Res() res: Response) {
    return this.send(code, req, res);
  }
  private async send(code: string, req: Request, res: Response) {
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(code)) throw new NotFoundException('Link not found');
    const link = await this.redirects.resolve(code);
    if (!link) throw new NotFoundException('Link not found');
    if (link.deletedAt || (link.expiresAt && Date.parse(link.expiresAt) <= Date.now()))
      throw new GoneException('This link is no longer available');
    if (!link.enabled) throw new NotFoundException('Link not found');
    if (req.method === 'GET') await this.capture.capture(link, req);
    res.setHeader('Cache-Control', 'no-store');
    res.redirect(302, link.destination);
  }
}
