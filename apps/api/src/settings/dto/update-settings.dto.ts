import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({
    example: {
      site_title: 'Universal Human Values Cell | TKM College of Engineering',
      contact_email: 'uhv@tkmce.ac.in',
    },
  })
  @IsObject()
  @IsNotEmpty()
  settings: Record<string, string>;
}
