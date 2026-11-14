import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
export class CreateLinkDto {
  @ApiProperty({ example: 'https://example.com/article', maxLength: 2048 })
  @IsString()
  @Length(1, 2048)
  destination!: string;
  @ApiPropertyOptional({ maxLength: 120 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(0, 120)
  title?: string | null;
  @ApiPropertyOptional({ example: 'my-portfolio', minLength: 3, maxLength: 32 })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{3,32}$/, {
    message: 'customCode must be 3–32 letters, numbers, underscores or hyphens',
  })
  customCode?: string;
  @ApiPropertyOptional({ nullable: true, format: 'date-time' })
  @IsOptional()
  @IsISO8601({ strict: true })
  expiresAt?: string | null;
}
export class UpdateLinkDto {
  @ApiPropertyOptional({ maxLength: 2048 })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Length(1, 2048)
  destination?: string;
  @ApiPropertyOptional({ maxLength: 120, nullable: true })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(0, 120)
  title?: string | null;
  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  enabled?: boolean;
  @ApiPropertyOptional({ nullable: true, format: 'date-time' })
  @IsOptional()
  @IsISO8601({ strict: true })
  expiresAt?: string | null;
}
export class ListLinksDto {
  @ApiPropertyOptional({ default: 1 }) @Type(() => Number) @IsInt() @Min(1) page = 1;
  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
  @ApiPropertyOptional({ maxLength: 100 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(0, 100)
  search?: string;
  @ApiPropertyOptional({ enum: ['all', 'active', 'disabled', 'expired'], default: 'all' })
  @IsIn(['all', 'active', 'disabled', 'expired'])
  status = 'all';
}
