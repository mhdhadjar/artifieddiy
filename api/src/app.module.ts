import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { VideosModule } from './videos/videos.module';
import { WeblogsModule } from './weblogs/weblogs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGODB_URI') ??
          'mongodb://mongo:27017/artifieddiy',
      }),
    }),
    AuthModule,
    VideosModule,
    WeblogsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
