import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class UserResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Alex Morgan' }) name!: string;
  @ApiProperty({ example: 'you@example.com' }) email!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}
export class UserEnvelope {
  @ApiProperty({ type: UserResponse }) user!: UserResponse;
}
export class SessionResponse extends UserEnvelope {
  @ApiProperty({ description: 'Ten-minute bearer JWT; keep in memory' }) accessToken!: string;
}
export class LinkResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'my-link' }) code!: string;
  @ApiProperty({ example: 'https://example.com/article' }) destination!: string;
  @ApiProperty({ nullable: true, type: String }) title!: string | null;
  @ApiProperty() enabled!: boolean;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) expiresAt!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
  @ApiProperty({ example: 'http://localhost:3000/r/my-link' }) shortUrl!: string;
  @ApiPropertyOptional({ description: 'Lifetime captured clicks; included in list results' })
  clicks?: number;
}
export class LinkPageResponse {
  @ApiProperty({ type: [LinkResponse] }) items!: LinkResponse[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
}
export class ProblemResponse {
  @ApiProperty() statusCode!: number;
  @ApiProperty({ example: 'HTTP_400' }) code!: string;
  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] })
  message!: string | string[];
  @ApiProperty({ format: 'uuid' }) requestId!: string;
}
export class AnalyticsSummary {
  @ApiProperty() totalLinks!: number;
  @ApiProperty() activeLinks!: number;
  @ApiProperty({ description: 'Captured GET redirects in the selected period; may include bots' })
  totalClicks!: number;
  @ApiProperty({ description: 'Distinct pseudonymous fingerprints, not verified people' })
  uniqueVisitors!: number;
}
export class DailyClicks {
  @ApiProperty({ example: '2026-11-10' }) date!: string;
  @ApiProperty() clicks!: number;
}
export class BreakdownItem {
  @ApiProperty() name!: string;
  @ApiProperty() value!: number;
}
export class PopularLink {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ nullable: true, type: String }) title!: string | null;
  @ApiProperty() code!: string;
  @ApiProperty() destination!: string;
  @ApiProperty() clicks!: number;
}
export class AnalyticsResponse {
  @ApiProperty({ type: AnalyticsSummary }) summary!: AnalyticsSummary;
  @ApiProperty({ type: [DailyClicks] }) daily!: DailyClicks[];
  @ApiProperty({ type: [PopularLink] }) topLinks!: PopularLink[];
  @ApiProperty({ type: [BreakdownItem] }) referrers!: BreakdownItem[];
  @ApiProperty({ type: [BreakdownItem] }) devices!: BreakdownItem[];
  @ApiProperty({ type: [BreakdownItem] }) browsers!: BreakdownItem[];
  @ApiProperty({ format: 'date-time' }) generatedAt!: string;
  @ApiProperty({ example: 'UTC' }) timezone!: string;
  @ApiPropertyOptional({ type: LinkResponse }) link?: LinkResponse;
}
