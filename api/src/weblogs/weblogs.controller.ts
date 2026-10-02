import { createReadStream } from 'fs';
import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { WeblogsService } from './weblogs.service';

@Controller('weblogs')
export class WeblogsController {
  constructor(private readonly weblogs: WeblogsService) {}

  @Get()
  list() {
    return this.weblogs.listPublic();
  }

  @Get('media/:name')
  async media(
    @Param('name') name: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const image = await this.weblogs.openImage(name);
    res.set({
      'Content-Type': image.contentType,
      'Content-Length': String(image.size),
      'Content-Disposition': `inline; filename="${image.filename}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    return new StreamableFile(createReadStream(image.path));
  }

  @Get(':address')
  get(@Param('address') address: string) {
    return this.weblogs.getPublicByAddress(address);
  }
}
