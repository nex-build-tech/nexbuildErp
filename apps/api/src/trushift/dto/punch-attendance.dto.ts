import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PunchAttendanceDto {
  @ApiProperty({ example: 1, description: 'Assigned site ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  siteId!: number;

  @ApiProperty({ example: 19.0625, description: 'Employee current GPS latitude' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: 72.8842, description: 'Employee current GPS longitude' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ enum: ['check_in', 'check_out'], default: 'check_in' })
  @IsOptional()
  @IsIn(['check_in', 'check_out'])
  punchType?: 'check_in' | 'check_out';

  @ApiProperty({ description: 'Watermarked image as base64 data URL (JPEG/PNG/WEBP)' })
  @IsString()
  @IsNotEmpty()
  photoDataUrl!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
