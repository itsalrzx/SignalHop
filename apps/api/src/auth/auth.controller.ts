import { Body, Controller, ForbiddenException, HttpCode, Post, Req, Res } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiHeader,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { UserEnvelope, SessionResponse, ProblemResponse } from '../common/responses.dto';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { settings } from '../config/config';
import { cookieOptions } from './cookies';
@ApiBadRequestResponse({ type: ProblemResponse })
@ApiUnauthorizedResponse({ type: ProblemResponse })
@ApiTooManyRequestsResponse({ type: ProblemResponse })
@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @ApiCreatedResponse({ type: UserEnvelope })
  @Post('register')
  @ApiOperation({ summary: 'Create an individual account' })
  @ApiResponse({ status: 201, description: 'Public user profile; never password hashes' })
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }
  @ApiOkResponse({ type: SessionResponse })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in; access token in body, refresh token in HttpOnly cookie' })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.respond(await this.auth.login(body), res);
  }
  @ApiOkResponse({ type: SessionResponse })
  @ApiHeader({ name: 'X-SignalHop-Client', required: true, example: 'web' })
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Rotate refresh cookie; requires trusted Origin and X-SignalHop-Client: web',
  })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.checkOrigin(req);
    return this.respond(await this.auth.refresh(req.cookies?.signalhop_refresh), res);
  }
  @ApiHeader({ name: 'X-SignalHop-Client', required: true, example: 'web' })
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Revoke refresh token; existing access tokens expire within ten minutes',
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.checkOrigin(req);
    await this.auth.logout(req.cookies?.signalhop_refresh);
    res.clearCookie('signalhop_refresh', cookieOptions());
  }
  private checkOrigin(req: Request) {
    if (req.headers.origin !== settings().origin || req.headers['x-signalhop-client'] !== 'web')
      throw new ForbiddenException('Untrusted request origin');
  }
  private respond(
    value: { accessToken: string; user: unknown; refreshToken: string },
    res: Response,
  ) {
    res.cookie('signalhop_refresh', value.refreshToken, {
      ...cookieOptions(),
      maxAge: 7 * 86400000,
    });
    return { accessToken: value.accessToken, user: value.user };
  }
}
