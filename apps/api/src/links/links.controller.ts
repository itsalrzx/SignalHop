import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { LinkResponse, LinkPageResponse, ProblemResponse } from '../common/responses.dto';
import { AuthGuard, UserRequest } from '../auth/auth.guard';
import { LinksService } from './links.service';
import { CreateLinkDto, ListLinksDto, UpdateLinkDto } from './links.dto';
@ApiBadRequestResponse({ type: ProblemResponse })
@ApiUnauthorizedResponse({ type: ProblemResponse })
@ApiNotFoundResponse({ type: ProblemResponse })
@ApiTooManyRequestsResponse({ type: ProblemResponse })
@ApiTags('Links')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/v1/links')
export class LinksController {
  constructor(private readonly links: LinksService) {}
  @ApiCreatedResponse({ type: LinkResponse })
  @Post()
  @ApiOperation({ summary: 'Create a short link; custom-code conflicts return 409' })
  create(@Req() req: UserRequest, @Body() body: CreateLinkDto) {
    return this.links.create(req.user.id, body);
  }
  @ApiOkResponse({ type: LinkPageResponse })
  @Get()
  @ApiOperation({ summary: 'Search/filter/paginate only your links' })
  list(@Req() req: UserRequest, @Query() query: ListLinksDto) {
    return this.links.list(req.user.id, query);
  }
  @ApiOkResponse({ type: LinkResponse }) @Get(':id') async get(
    @Req() req: UserRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.links.serialize(await this.links.owned(req.user.id, id));
  }
  @ApiOkResponse({ type: LinkResponse }) @Patch(':id') update(
    @Req() req: UserRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLinkDto,
  ) {
    return this.links.update(req.user.id, id, body);
  }
  @Delete(':id') @HttpCode(204) remove(
    @Req() req: UserRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.links.remove(req.user.id, id);
  }
}
