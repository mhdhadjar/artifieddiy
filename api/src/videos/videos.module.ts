import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TagsModule } from '../tags/tags.module';
import { YoutubeModule } from '../youtube/youtube.module';
import { Video, VideoSchema } from './video.schema';
import { VideosAdminController } from './videos-admin.controller';
import { VideosController } from './videos.controller';
import { ProjectFileStorage } from './project-file.storage';
import { VideosService } from './videos.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Video.name, schema: VideoSchema }]),
    AuthModule,
    TagsModule,
    YoutubeModule,
  ],
  controllers: [VideosController, VideosAdminController],
  providers: [VideosService, ProjectFileStorage],
})
export class VideosModule {}
