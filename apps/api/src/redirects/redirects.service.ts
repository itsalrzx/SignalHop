import { Injectable } from '@nestjs/common';
import { LinksService } from '../links/links.service';
@Injectable()
export class RedirectsService {
  constructor(private readonly links: LinksService) {}
  resolve(code: string) {
    return this.links.findCode(code);
  }
}
