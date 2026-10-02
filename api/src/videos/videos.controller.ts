import { createReadStream } from 'fs';
import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { archiveHeaders, createProjectArchive } from './project-file.archive';
import { attachmentDisposition } from './project-file';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Get()
  list(@Query('tag') tag?: string) {
    return this.videos.listPublic(tag);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':slug/files/archive/:category')
  async downloadArchive(
    @Param('slug') slug: string,
    @Param('category') category: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const archive = await this.videos.openPublicArchive(slug, category);
    res.set(archiveHeaders(archive.filename));
    return new StreamableFile(createProjectArchive(archive.entries));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':slug/files/:fileId')
  async download(
    @Param('slug') slug: string,
    @Param('fileId') fileId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.videos.openPublicFile(slug, fileId);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(file.size),
      'Content-Disposition': attachmentDisposition(file.filename),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(createReadStream(file.path));
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.videos.getPublicBySlug(slug);
  }
}
