import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { UserEnvelope, ProblemResponse } from '../common/responses.dto';
import { AuthGuard, UserRequest } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { cookieOptions } from '../auth/cookies';
import { UsersService } from './users.service';
import { PasswordDto, ProfileDto } from './users.dto';
@ApiBadRequestResponse({ type: ProblemResponse })
@ApiUnauthorizedResponse({ type: ProblemResponse })
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}
  @ApiOkResponse({ type: UserEnvelope })
  @Get('me')
  me(@Req() req: UserRequest) {
    return this.auth.me(req.user.id);
  }
  @ApiOkResponse({ type: UserEnvelope })
  @Patch('me')
  @ApiOperation({ summary: 'Update display name; email remains read-only' })
  update(@Req() req: UserRequest, @Body() body: ProfileDto) {
    return this.users.update(req.user.id, body.name);
  }
  @Post('me/password')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Change password and revoke all refresh tokens; access JWTs expire naturally',
  })
  async password(
    @Req() req: UserRequest,
    @Body() body: PasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.users.password(req.user.id, body);
    res.clearCookie('signalhop_refresh', cookieOptions());
  }
}
