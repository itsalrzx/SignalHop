import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
export class ProfileDto {
  @ApiProperty({ maxLength: 80, example: 'Alex Morgan' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 80)
  name!: string;
}
export class PasswordDto {
  @ApiProperty({ format: 'password', minLength: 10, maxLength: 128 })
  @IsString()
  @Length(10, 128)
  currentPassword!: string;
  @ApiProperty({ format: 'password', minLength: 10, maxLength: 128 })
  @IsString()
  @Length(10, 128)
  newPassword!: string;
}
