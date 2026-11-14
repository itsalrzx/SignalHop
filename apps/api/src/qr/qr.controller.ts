import { Controller, Get, Param, ParseUUIDPipe, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiPropertyOptional,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import type { Response } from 'express';
import QRCode from 'qrcode';
import { AuthGuard, UserRequest } from '../auth/auth.guard';
import { LinksService } from '../links/links.service';
export class QRQuery {
  @ApiPropertyOptional({ default: 384, minimum: 128, maximum: 1024 })
  @Type(() => Number)
  @IsInt()
  @Min(128)
  @Max(1024)
  size = 384;
}
@ApiTags('QR codes')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/v1/links')
export class QRController {
  constructor(private readonly links: LinksService) {}
  @Get(':id/qr')
  @ApiOperation({ summary: 'Download a PNG encoding your short URL' })
  @ApiProduces('image/png')
  @ApiResponse({
    status: 200,
    description: 'PNG attachment',
    schema: { type: 'string', format: 'binary' },
  })
  async download(
    @Req() req: UserRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() q: QRQuery,
    @Res() res: Response,
  ) {
    const link = await this.links.owned(req.user.id, id);
    const png = await QRCode.toBuffer(this.links.serialize(link).shortUrl, {
      type: 'png',
      width: q.size,
      margin: 3,
      errorCorrectionLevel: 'M',
      color: { dark: '#183d2c', light: '#ffffff' },
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="signalhop-' + link.code + '.png"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(png);
  }
}
