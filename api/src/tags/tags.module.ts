import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Video, VideoSchema } from '../videos/video.schema';
import { Tag, TagSchema } from './tag.schema';
import { TagsAdminController } from './tags-admin.controller';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tag.name, schema: TagSchema },
      { name: Video.name, schema: VideoSchema },
    ]),
    AuthModule,
  ],
  controllers: [TagsController, TagsAdminController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
