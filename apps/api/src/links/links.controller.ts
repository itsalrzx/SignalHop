import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LinkPageResponse, LinkResponse, ProblemResponse } from '../common/responses.dto';
import { AuthGuard, UserRequest } from '../auth/auth.guard';
import { LinksService } from './links.service';
import { CreateLinkDto, ListLinksDto } from './links.dto';
@ApiBadRequestResponse({ type: ProblemResponse })
@ApiUnauthorizedResponse({ type: ProblemResponse })
@ApiTooManyRequestsResponse({ type: ProblemResponse })
@ApiTags('Links')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/v1/links')
export class LinksController {
  constructor(private readonly links: LinksService) {}
  @ApiCreatedResponse({ type: LinkResponse })
  @Post()
  @ApiOperation({ summary: 'Create a short link' })
  create(@Req() req: UserRequest, @Body() body: CreateLinkDto) {
    return this.links.create(req.user.id, body);
  }
  @ApiOkResponse({ type: LinkPageResponse })
  @Get()
  @ApiOperation({ summary: 'Paginate only your links' })
  list(@Req() req: UserRequest, @Query() query: ListLinksDto) {
    return this.links.list(req.user.id, query);
  }
}
