import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
export interface UserRequest extends Request {
  user: { id: string };
}
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<UserRequest>();
    const match = req.headers.authorization?.match(/^Bearer ([^ ]+)$/);
    if (!match) throw new UnauthorizedException('Please sign in to continue');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(match[1], {
        issuer: 'signalhop',
        audience: 'signalhop-web',
      });
      if (typeof payload.sub !== 'string' || !isUUID(payload.sub))
        throw new Error('Invalid subject');
      req.user = { id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException('Your sign-in has expired');
    }
  }
}
