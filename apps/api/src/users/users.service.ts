import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User, profile } from './user.entity';
import { RefreshToken } from '../auth/refresh-token.entity';
import { hashPassword } from '../auth/auth.service';
import { PasswordDto } from './users.dto';
@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}
  async update(id: string, name: string) {
    await this.users.update(id, { name });
    const user = await this.users.findOneBy({ id });
    if (!user) throw new UnauthorizedException('Please sign in again');
    return { user: profile(user) };
  }
  async password(id: string, dto: PasswordDto) {
    const user = await this.users.findOne({
      where: { id },
      select: { id: true, passwordHash: true },
    });
    if (!user || !(await argon2.verify(user.passwordHash, dto.currentPassword)))
      throw new BadRequestException('Current password is incorrect');
    const passwordHash = await hashPassword(dto.newPassword);
    await this.users.manager.transaction(async (manager) => {
      const changed = await manager
        .getRepository(User)
        .update({ id, passwordHash: user.passwordHash }, { passwordHash });
      if (changed.affected !== 1)
        throw new ConflictException('Your password changed. Please sign in again.');
      await manager.getRepository(RefreshToken).delete({ userId: id });
    });
  }
}
