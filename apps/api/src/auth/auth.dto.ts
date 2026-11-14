import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';
export class LoginDto {
  @ApiProperty({ example: 'you@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @Length(3, 254)
  email!: string;
  @ApiProperty({ minLength: 10, maxLength: 128, format: 'password' })
  @IsString()
  @Length(10, 128)
  password!: string;
}
export class RegisterDto extends LoginDto {
  @ApiProperty({ example: 'Alex', maxLength: 80 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 80)
  name!: string;
}
