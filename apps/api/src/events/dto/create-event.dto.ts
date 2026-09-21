import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: '5-Day Faculty Development Programme on Universal Human Values' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'aicte-fdp-uhv-level-1' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Comprehensive 5-day AICTE recognized Faculty Development Programme...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ example: '2026-10-15T09:30:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  eventDate: string;

  @ApiPropertyOptional({ example: '09:30 AM' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '04:30 PM' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ example: 'APJ Abdul Kalam Seminar Complex, TKMCE' })
  @IsString()
  @IsNotEmpty()
  venue: string;

  @ApiPropertyOptional({ example: 'Faculty Development' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: 'Government of Kerala, AICTE' })
  @IsOptional()
  @IsString()
  collaborators?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  collaboratorLogo?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  ticketPrice?: number;

  @ApiPropertyOptional({ example: 'Dr. Sarah Jenkins' })
  @IsOptional()
  @IsString()
  coordinatorName?: string;

  @ApiPropertyOptional({ example: '+91 9876543210' })
  @IsOptional()
  @IsString()
  coordinatorPhone?: string;

  @ApiPropertyOptional({ example: 'https://fdp-si.aicte-india.org/' })
  @IsOptional()
  @IsString()
  registrationUrl?: string;

  @ApiPropertyOptional({ enum: EventStatus, default: EventStatus.UPCOMING })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  enableInternalReg?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationUploadLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registrationEndDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  registrationCapacity?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRegistrationClosed?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  registrationNotOpened?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  registrationFields?: any;
}

export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: 'Government of Kerala, AICTE' })
  @IsOptional()
  @IsString()
  collaborators?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  collaboratorLogo?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  ticketPrice?: number;

  @ApiPropertyOptional({ example: 'Dr. Sarah Jenkins' })
  @IsOptional()
  @IsString()
  coordinatorName?: string;

  @ApiPropertyOptional({ example: '+91 9876543210' })
  @IsOptional()
  @IsString()
  coordinatorPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationUrl?: string;

  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enableInternalReg?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationUploadLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registrationEndDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  registrationCapacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRegistrationClosed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  registrationNotOpened?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  registrationFields?: any;
}

export class CreateEventRegistrationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  institution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uploadReference?: string;

  @ApiPropertyOptional({ default: 'INDIVIDUAL', enum: ['INDIVIDUAL', 'GROUP'] })
  @IsOptional()
  @IsString()
  ticketType?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  groupSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  groupMembers?: any;

  @ApiPropertyOptional()
  @IsOptional()
  customData?: any;

  @ApiPropertyOptional({ default: 'FREE' })
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  totalAmount?: number;
}

export class UpdateEventRegistrationStatusDto {
  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED'])
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
