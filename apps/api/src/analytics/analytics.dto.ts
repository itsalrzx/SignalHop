import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn } from 'class-validator';
export class AnalyticsQuery {
  @ApiPropertyOptional({ enum: [7, 30, 90], default: 7, description: 'UTC dates including today' })
  @Type(() => Number)
  @IsIn([7, 30, 90])
  days = 7;
}
