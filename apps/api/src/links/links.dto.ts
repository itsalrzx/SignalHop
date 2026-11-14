import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
export class CreateLinkDto {
  @ApiProperty({ example: 'https://example.com/article', maxLength: 2048 })
  @IsString()
  @Length(1, 2048)
  destination!: string;
  @ApiPropertyOptional({ maxLength: 120, nullable: true })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(0, 120)
  title?: string | null;
}
export class ListLinksDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}
