import { ApiProperty } from '@nestjs/swagger';
export class ProblemResponse {
  @ApiProperty() statusCode!: number;
  @ApiProperty({ example: 'HTTP_404' }) code!: string;
  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] })
  message!: string | string[];
  @ApiProperty({ format: 'uuid' }) requestId!: string;
}
