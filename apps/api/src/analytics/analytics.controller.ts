import { Controller, Get, Param, ParseUUIDPipe, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { AnalyticsResponse, ProblemResponse } from '../common/responses.dto';
import { AuthGuard, UserRequest } from '../auth/auth.guard';
import { AnalyticsQuery } from './analytics.dto';
import { AnalyticsService } from './analytics.service';
@ApiBadRequestResponse({ type: ProblemResponse })
@ApiUnauthorizedResponse({ type: ProblemResponse })
@ApiNotFoundResponse({ type: ProblemResponse })
@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/v1')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}
  @ApiOkResponse({ type: AnalyticsResponse })
  @Get('analytics/overview')
  @ApiOperation({
    summary:
      'Owned click reports; visitor estimates, UTC grouping, asynchronous best-effort capture',
  })
  overview(@Req() req: UserRequest, @Query() q: AnalyticsQuery) {
    return this.analytics.report(req.user.id, q.days);
  }
  @ApiOkResponse({ type: AnalyticsResponse })
  @Get('links/:id/analytics')
  link(
    @Req() req: UserRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() q: AnalyticsQuery,
  ) {
    return this.analytics.report(req.user.id, q.days, id);
  }
}
