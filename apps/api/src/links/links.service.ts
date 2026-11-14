import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { randomInt } from 'node:crypto';
import { Link } from './link.entity';
import { CreateLinkDto, ListLinksDto, UpdateLinkDto } from './links.dto';
import { destinationUrl } from './url';
import { settings } from '../config/config';
@Injectable()
export class LinksService {
  constructor(@InjectRepository(Link) readonly repo: Repository<Link>) {}
  serialize(link: Link) {
    return {
      id: link.id,
      code: link.code,
      destination: link.destination,
      title: link.title,
      enabled: link.enabled,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      shortUrl: settings().publicBaseUrl + '/r/' + link.code,
    };
  }
  private expiration(value: string | null | undefined) {
    if (value == null) return null;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now())
      throw new BadRequestException('Expiration must be in the future');
    return date;
  }
  async create(userId: string, dto: CreateLinkDto) {
    const destination = destinationUrl(dto.destination);
    const expiresAt = this.expiration(dto.expiresAt);
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let attempt = 0; attempt < 5; attempt++) {
      const code =
        dto.customCode ||
        Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join('');
      try {
        const link = await this.repo.save(
          this.repo.create({ userId, destination, title: dto.title || null, code, expiresAt }),
        );
        return this.serialize(link);
      } catch (error) {
        if ((error as { code?: string }).code !== '23505') throw error;
        if (dto.customCode) throw new ConflictException('This short code is already taken');
      }
    }
    throw new ServiceUnavailableException('Could not allocate a code. Please try again.');
  }
  async list(userId: string, query: ListLinksDto) {
    const qb = this.repo.createQueryBuilder('link').where('link.user_id = :userId', { userId });
    if (query.search) {
      const escaped = query.search.replace(/[\\%_]/g, (match) => String.fromCharCode(92) + match);
      qb.andWhere(
        '(link.title ILIKE :search OR link.destination ILIKE :search OR link.code ILIKE :search)',
        { search: '%' + escaped + '%' },
      );
    }
    if (query.status === 'expired') qb.andWhere('link.expires_at <= NOW()');
    if (query.status === 'active')
      qb.andWhere('link.enabled = true AND (link.expires_at IS NULL OR link.expires_at > NOW())');
    if (query.status === 'disabled')
      qb.andWhere('link.enabled = false AND (link.expires_at IS NULL OR link.expires_at > NOW())');
    const [items, total] = await qb
      .orderBy('link.created_at', 'DESC')
      .addOrderBy('link.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return {
      items: items.map((link) => this.serialize(link)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }
  async owned(userId: string, id: string) {
    const link = await this.repo.findOneBy({ id, userId });
    if (!link) throw new NotFoundException('Link not found');
    return link;
  }
  async update(userId: string, id: string, dto: UpdateLinkDto) {
    await this.owned(userId, id);
    const patch: Partial<Link> = {};
    if (dto.destination !== undefined) patch.destination = destinationUrl(dto.destination);
    if (dto.title !== undefined) patch.title = dto.title || null;
    if (dto.enabled !== undefined) patch.enabled = dto.enabled;
    if (dto.expiresAt !== undefined) patch.expiresAt = this.expiration(dto.expiresAt);
    if (Object.keys(patch).length) {
      const result = await this.repo.update({ id, userId, deletedAt: IsNull() }, patch);
      if (result.affected !== 1) throw new NotFoundException('Link not found');
    }
    return this.serialize(await this.owned(userId, id));
  }
  async remove(userId: string, id: string) {
    await this.owned(userId, id);
    const result = await this.repo.softDelete({ id, userId, deletedAt: IsNull() });
    if (result.affected !== 1) throw new NotFoundException('Link not found');
  }
  findCode(code: string) {
    return this.repo.findOne({ where: { code }, withDeleted: true });
  }
}
