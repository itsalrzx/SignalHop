import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'node:crypto';
import { Link } from './link.entity';
import { CreateLinkDto, ListLinksDto } from './links.dto';
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
  async create(userId: string, dto: CreateLinkDto) {
    const destination = destinationUrl(dto.destination);
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join('');
      try {
        const link = await this.repo.save(
          this.repo.create({ userId, destination, title: dto.title || null, code }),
        );
        return this.serialize(link);
      } catch (error) {
        if ((error as { code?: string }).code !== '23505') throw error;
      }
    }
    throw new ServiceUnavailableException('Could not allocate a code. Please try again.');
  }
  async list(userId: string, query: ListLinksDto) {
    const [items, total] = await this.repo
      .createQueryBuilder('link')
      .where('link.user_id = :userId', { userId })
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
  findCode(code: string) {
    return this.repo.findOne({ where: { code }, withDeleted: true });
  }
}
