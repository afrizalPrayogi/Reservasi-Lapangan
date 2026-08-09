import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../../common/file-upload.service';
import { getRequestBaseUrl } from '../../common/network.util';
import { FieldsService } from './fields.service';
import {
  CreateFieldDto,
  CreateFieldPriceDto,
  UpdateFieldDto,
  UpdateFieldPriceDto,
} from './dto';
import { AdminJwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';

@Controller('admin/fields')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class FieldsController {
  constructor(
    private readonly fieldsService: FieldsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', FileUploadService.multerConfigFieldImage))
  @Roles('Super Admin', 'Administrator', 'Admin')
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    this.fileUploadService.validateImageFile(file);
    const imageUrl = this.fileUploadService.generateFileUrl(
      file.filename,
      'field-image',
      getRequestBaseUrl(req),
    );
    return {
      message: 'Gambar berhasil diupload',
      data: {
        imageUrl,
      },
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('Super Admin', 'Administrator')
  create(@Req() req: any, @Body() dto: CreateFieldDto) {
    return this.fieldsService.create(dto, getRequestBaseUrl(req));
  }

  @Get()
  @Roles('Super Admin', 'Administrator', 'Admin')
  findAll(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
  ) {
    return this.fieldsService.findAll({
      page,
      limit,
      search,
      type,
      isActive,
      assetBaseUrl: getRequestBaseUrl(req),
    });
  }

  @Get(':id')
  @Roles('Super Admin', 'Administrator', 'Admin')
  findOne(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.fieldsService.findOne(id, getRequestBaseUrl(req));
  }

  @Patch(':id')
  @Roles('Super Admin', 'Administrator')
  update(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFieldDto,
  ) {
    return this.fieldsService.update(id, dto, getRequestBaseUrl(req));
  }

  @Delete(':id')
  @Roles('Super Admin', 'Administrator')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.fieldsService.remove(id);
  }

  // Field Prices

  @Post(':fieldId/prices')
  @HttpCode(HttpStatus.CREATED)
  @Roles('Super Admin', 'Administrator')
  addPrice(
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Body() dto: CreateFieldPriceDto,
  ) {
    return this.fieldsService.addPrice(fieldId, dto);
  }

  @Get(':fieldId/prices')
  @Roles('Super Admin', 'Administrator', 'Admin')
  listPrices(@Param('fieldId', ParseUUIDPipe) fieldId: string) {
    return this.fieldsService.listPrices(fieldId);
  }

  @Patch(':fieldId/prices/:priceId')
  @Roles('Super Admin', 'Administrator')
  updatePrice(
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Param('priceId', ParseUUIDPipe) priceId: string,
    @Body() dto: UpdateFieldPriceDto,
  ) {
    return this.fieldsService.updatePrice(fieldId, priceId, dto);
  }

  @Delete(':fieldId/prices/:priceId')
  @Roles('Super Admin', 'Administrator')
  removePrice(
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Param('priceId', ParseUUIDPipe) priceId: string,
  ) {
    return this.fieldsService.removePrice(fieldId, priceId);
  }
}
