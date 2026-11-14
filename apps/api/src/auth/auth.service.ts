import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import * as argon2 from 'argon2';
import { User, profile } from '../users/user.entity';
import { RefreshToken } from './refresh-token.entity';
import { LoginDto, RegisterDto } from './auth.dto';
export const hashPassword = (password: string) =>
  argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken) private readonly tokens: Repository<RefreshToken>,
    private readonly jwt: JwtService,
  ) {}
  async register(dto: RegisterDto) {
    try {
      const user = await this.users.save(
        this.users.create({
          email: dto.email,
          name: dto.name,
          passwordHash: await hashPassword(dto.password),
        }),
      );
      return { user: profile(user) };
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException('An account with this email already exists');
      throw error;
    }
  }
  async login(dto: LoginDto) {
    const user = await this.users.findOne({
      where: { email: dto.email },
      select: { id: true, email: true, name: true, passwordHash: true, createdAt: true },
    });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password)))
      throw new UnauthorizedException('Email or password is incorrect');
    const secret = randomBytes(32).toString('hex');
    const token = await this.tokens.manager.transaction(async (manager) => {
      const current = await manager.getRepository(User).findOne({
        where: { id: user.id, passwordHash: user.passwordHash },
        lock: { mode: 'pessimistic_read' },
      });
      if (!current) throw new UnauthorizedException('Email or password is incorrect');
      return manager.getRepository(RefreshToken).save(
        manager.getRepository(RefreshToken).create({
          userId: user.id,
          tokenHash: digest(secret),
          expiresAt: new Date(Date.now() + 7 * 86400000),
        }),
      );
    });
    return {
      accessToken: await this.access(user.id),
      user: profile(user),
      refreshToken: token.id + '.' + secret,
    };
  }
  private access(id: string) {
    return this.jwt.signAsync({ sub: id });
  }
  private async read(raw: unknown) {
    if (typeof raw !== 'string' || !/^[0-9a-f-]{36}\.[0-9a-f]{64}$/.test(raw))
      throw new UnauthorizedException('Please sign in again');
    const [id, secret] = raw.split('.');
    if (!isUUID(id)) throw new UnauthorizedException('Please sign in again');
    const token = await this.tokens.findOne({
      where: { id },
      select: { id: true, userId: true, tokenHash: true, expiresAt: true },
    });
    if (
      !token ||
      token.expiresAt.getTime() <= Date.now() ||
      !timingSafeEqual(Buffer.from(token.tokenHash, 'hex'), Buffer.from(digest(secret), 'hex'))
    )
      throw new UnauthorizedException('Please sign in again');
    return token;
  }
  async refresh(raw: unknown) {
    const token = await this.read(raw);
    const secret = randomBytes(32).toString('hex');
    const changed = await this.tokens.update(
      { id: token.id, tokenHash: token.tokenHash },
      { tokenHash: digest(secret), expiresAt: new Date(Date.now() + 7 * 86400000) },
    );
    if (changed.affected !== 1) throw new UnauthorizedException('Please sign in again');
    const user = await this.users.findOneByOrFail({ id: token.userId });
    return {
      accessToken: await this.access(user.id),
      user: profile(user),
      refreshToken: token.id + '.' + secret,
    };
  }
  async logout(raw: unknown) {
    if (typeof raw !== 'string' || !/^[0-9a-f-]{36}\.[0-9a-f]{64}$/.test(raw)) return;
    const [id, secret] = raw.split('.');
    if (!isUUID(id)) return;
    await this.tokens.delete({ id, tokenHash: digest(secret) });
  }
  async me(id: string) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new UnauthorizedException('Please sign in again');
    return { user: profile(user) };
  }
}
