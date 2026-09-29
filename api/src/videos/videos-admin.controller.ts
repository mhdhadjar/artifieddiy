import { createReadStream } from 'fs';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { YoutubeService } from '../youtube/youtube.service';
import {
  CreateVideoDto,
  PreviewVideoDto,
  UpdateProjectFileDto,
  UpdateVideoDto,
  UploadProjectFileDto,
} from './dto/video.dto';
import { MulterExceptionFilter } from './multer.filter';
import {
  MAX_PROJECT_FILES,
  UploadRequest,
  attachmentDisposition,
  projectFileUploadOptions,
} from './project-file';
import { CleanupUploadInterceptor } from './upload.interceptor';
import { VideosService } from './videos.service';

@Controller('admin/videos')
@UseGuards(JwtAuthGuard, AdminGuard)
export class VideosAdminController {
  constructor(
    private readonly videos: VideosService,
    private readonly youtube: YoutubeService,
  ) {}

  @Get()
  list() {
    return this.videos.listAdmin();
  }

  @Post('preview')
  preview(@Body() dto: PreviewVideoDto) {
    return this.youtube.preview(dto.url);
  }

  @Post()
  create(@Body() dto: CreateVideoDto) {
    return this.videos.create(dto);
  }

  @Post(':id/files')
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(
    CleanupUploadInterceptor,
    FilesInterceptor('file', MAX_PROJECT_FILES, projectFileUploadOptions()),
  )
  addFiles(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadProjectFileDto,
    @Req() req: UploadRequest,
  ) {
    return this.videos.addFiles(id, files ?? [], dto, req.rejectedFiles ?? []);
  }

  @Get(':id/files/:fileId')
  async download(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.videos.openAdminFile(id, fileId);
    this.sendFile(res, file, 'private, no-store');
    return new StreamableFile(createReadStream(file.path));
  }

  @Patch(':id/files/:fileId')
  updateFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @Body() dto: UpdateProjectFileDto,
  ) {
    return this.videos.updateFile(id, fileId, dto);
  }

  @Delete(':id/files/:fileId')
  removeFile(@Param('id') id: string, @Param('fileId') fileId: string) {
    return this.videos.removeFile(id, fileId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.videos.getAdmin(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.videos.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.videos.remove(id);
  }

  private sendFile(
    res: Response,
    file: { size: number; filename: string },
    cacheControl: string,
  ) {
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(file.size),
      'Content-Disposition': attachmentDisposition(file.filename),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': cacheControl,
    });
  }
}
