import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'aB3xK9pQ' }) code!: string;
  @ApiProperty({ example: 'https://example.com/article' }) destination!: string;
  @ApiProperty({ nullable: true, type: String }) title!: string | null;
  @ApiProperty() enabled!: boolean;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) expiresAt!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
  @ApiProperty({ example: 'http://localhost:3000/r/aB3xK9pQ' }) shortUrl!: string;
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
