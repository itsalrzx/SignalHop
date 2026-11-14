import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserEnvelope, ProblemResponse } from '../common/responses.dto';
import { AuthGuard, UserRequest } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
@ApiUnauthorizedResponse({ type: ProblemResponse })
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly auth: AuthService) {}
  @ApiOkResponse({ type: UserEnvelope })
  @Get('me')
  me(@Req() req: UserRequest) {
    return this.auth.me(req.user.id);
  }
}
