import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@tkmce.ac.in' })
  @IsEmail({}, { message: 'A valid institutional email is required' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'UHV_Tkmce@2026' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must contain at least 6 characters' })
  password: string;
}
