import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWeblogDto, UpdateWeblogDto } from './dto/weblog.dto';
import {
  CleanupWeblogUploadInterceptor,
  WeblogImageExceptionFilter,
  weblogImageUploadOptions,
} from './weblog-image';
import { WeblogsService } from './weblogs.service';

@Controller('admin/weblogs')
@UseGuards(JwtAuthGuard, AdminGuard)
export class WeblogsAdminController {
  constructor(private readonly weblogs: WeblogsService) {}

  @Get()
  list() {
    return this.weblogs.listAdmin();
  }

  @Post('images')
  @UseFilters(WeblogImageExceptionFilter)
  @UseInterceptors(
    CleanupWeblogUploadInterceptor,
    FileInterceptor('image', weblogImageUploadOptions()),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    return this.weblogs.saveImage(file);
  }

  @Post()
  create(@Body() dto: CreateWeblogDto) {
    return this.weblogs.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.weblogs.getAdmin(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWeblogDto) {
    return this.weblogs.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.weblogs.remove(id);
  }
}
