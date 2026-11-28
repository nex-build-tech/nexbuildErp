import { IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, IsNumber, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'boss', description: 'Username or email' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'boss123', description: 'User password' })
  @IsString()
  @MinLength(4)
  password!: string;

  @ApiPropertyOptional({ example: 'kings', description: 'Tenant slug (defaults to kings)' })
  @IsString()
  @IsOptional()
  tenantSlug?: string;

  @ApiPropertyOptional({ example: '123456', description: '6-digit TOTP code if 2FA is active' })
  @IsString()
  @IsOptional()
  totpCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token string' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class EnableTotpDto {
  @ApiProperty({ example: 'JBSWY3DPEHPK3PXP', description: 'Base32 TOTP secret' })
  @IsString()
  @IsNotEmpty()
  secret!: string;

  @ApiProperty({ example: '123456', description: '6-digit verification code' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class VerifyTotpDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @ApiProperty({ example: '123456', description: '6-digit TOTP code or backup code' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class DisableTotpDto {
  @ApiProperty({ example: 'boss123', description: 'User password for confirmation' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ example: '123456', description: '6-digit TOTP code or backup code' })
  @IsString()
  @IsOptional()
  code?: string;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'Affan Khan', description: 'Employee full name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  fullName!: string;

  @ApiProperty({ example: '+91 98201 12345', description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  phone!: string;

  @ApiProperty({ example: 'affan@kingsbuilders.com', description: 'Work email address' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({ description: 'Optional profile avatar URL' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  avatarUrl?: string;
}
