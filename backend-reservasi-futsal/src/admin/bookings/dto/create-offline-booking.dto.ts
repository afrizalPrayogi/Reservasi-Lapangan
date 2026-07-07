import { IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString, IsEmail } from 'class-validator';

export class CreateOfflineBookingDto {
  @IsUUID()
  @IsNotEmpty()
  fieldId: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  proofUrl?: string;
}
