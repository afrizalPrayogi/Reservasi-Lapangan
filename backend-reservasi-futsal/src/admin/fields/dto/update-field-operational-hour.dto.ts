import { PartialType } from '@nestjs/mapped-types';
import { CreateFieldOperationalHourDto } from './create-field-operational-hour.dto';

export class UpdateFieldOperationalHourDto extends PartialType(CreateFieldOperationalHourDto) {}
