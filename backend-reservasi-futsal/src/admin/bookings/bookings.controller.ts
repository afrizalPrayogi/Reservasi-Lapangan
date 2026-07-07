import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { AdminJwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentAdmin } from '../auth/decorators';
import { VerifyPaymentDto, CreateOfflineBookingDto } from './dto';

@Controller('admin/bookings')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @Roles('Super Admin', 'Administrator', 'Admin')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('fieldId') fieldId?: string,
    @Query('venueId') venueId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('today', new DefaultValuePipe(false)) today?: boolean,
  ) {
    return this.bookingsService.findAll({
      page,
      limit,
      search,
      status,
      fieldId,
      venueId,
      startDate,
      endDate,
      today,
    });
  }

  @Get('stats')
  @Roles('Super Admin', 'Administrator', 'Admin')
  getStats(
    @Query('venueId') venueId?: string,
  ) {
    return this.bookingsService.getStats(venueId);
  }

  @Get('pending-verification')
  @Roles('Super Admin', 'Administrator', 'Admin')
  getPendingVerification(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('venueId') venueId?: string,
  ) {
    return this.bookingsService.getPendingVerification({
      page,
      limit,
      venueId,
    });
  }

  @Get(':id')
  @Roles('Super Admin', 'Administrator', 'Admin')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch('verify-payment/:id')
  @Roles('Super Admin', 'Administrator', 'Admin')
  verifyPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyPaymentDto,
    @CurrentAdmin() admin: any,
  ) {
    return this.bookingsService.verifyPayment(id, dto, admin.sub);
  }

  @Post()
  @Roles('Super Admin', 'Administrator', 'Admin')
  createOffline(
    @Body() dto: CreateOfflineBookingDto,
  ) {
    return this.bookingsService.createOfflineBooking(dto);
  }

  @Patch(':id/settle')
  @Roles('Super Admin', 'Administrator', 'Admin')
  settle(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingsService.settleBooking(id);
  }
}
