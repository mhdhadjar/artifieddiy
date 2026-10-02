import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Weblog, WeblogSchema } from './weblog.schema';
import { WeblogImageStorage } from './weblog-image';
import { WeblogsAdminController } from './weblogs-admin.controller';
import { WeblogsController } from './weblogs.controller';
import { WeblogsService } from './weblogs.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Weblog.name, schema: WeblogSchema }]),
    AuthModule,
  ],
  controllers: [WeblogsController, WeblogsAdminController],
  providers: [WeblogsService, WeblogImageStorage],
})
export class WeblogsModule {}
