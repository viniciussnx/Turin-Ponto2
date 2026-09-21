import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DevicePlatform } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'admin@turin.com.br' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @Length(8, 128)
  password: string;
}

export class DeviceInfoDto {
  @ApiProperty({ description: 'UUID estável gerado no primeiro boot do app.' })
  @IsString()
  @MaxLength(64)
  installationId: string;

  @ApiProperty({ enum: DevicePlatform })
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @ApiPropertyOptional({ example: 'iPhone 13' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;

  @ApiPropertyOptional({ example: '17.2' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  osVersion?: string;

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  appVersion?: string;

  @ApiPropertyOptional({ description: 'Token de push (Expo/FCM/APNs).' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pushToken?: string;
}

/// Login do app — tela 02 do protótipo: matrícula + senha.
export class LoginEmployeeDto {
  @ApiProperty({ description: 'Matrícula do funcionário.', example: '04182' })
  @IsString()
  @MaxLength(40)
  registration: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @Length(6, 128)
  password: string;

  // ValidateNested + Type sao obrigatorios aqui: o ValidationPipe roda com
  // whitelist e forbidNonWhitelisted, entao um campo sem decorator do
  // class-validator nao e apenas ignorado — e recusado com 400.
  @ApiProperty({ type: DeviceInfoDto })
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  device: DeviceInfoDto;

  @ApiPropertyOptional({
    description: 'Checkbox "Manter conectado". Estende a validade da sessão.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  keepSignedIn?: boolean;
}

/// Troca de senha pelo próprio funcionário. Obrigatória no primeiro login,
/// quando `mustChangePassword` vem `true`.
export class ChangePasswordDto {
  @ApiProperty({ description: 'Senha atual (a inicial, no primeiro acesso).' })
  @IsString()
  @Length(6, 128)
  currentPassword: string;

  @ApiProperty({ minLength: 8, description: 'Nova senha escolhida pelo funcionário.' })
  @IsString()
  @Length(8, 128)
  newPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
