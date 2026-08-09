import { DayType } from '@prisma/client';
import { IsEnum, IsInt, Max, Min } from 'class-validator';

export class CreateFieldOperationalHourDto {
  @IsEnum(DayType)
  dayType: DayType;

  @IsInt()
  @Min(0)
  @Max(23)
  startHour: number;

  @IsInt()
  @Min(1)
  @Max(24)
  endHour: number;
}
