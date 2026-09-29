import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  PROJECT_FILE_CATEGORIES,
  ProjectFileCategory,
} from './project-file';

@Schema({ _id: false })
export class AffiliateItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  imageUrl?: string;

  @Prop()
  note?: string;
}

export const AffiliateItemSchema = SchemaFactory.createForClass(AffiliateItem);

@Schema({ _id: true })
export class ProjectFile {
  @Prop({ required: true, enum: PROJECT_FILE_CATEGORIES })
  category: ProjectFileCategory;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  storedName: string;

  @Prop({ required: true })
  size: number;

  @Prop({ default: 'application/octet-stream' })
  mimeType: string;

  @Prop()
  checksum?: string;
}

export const ProjectFileSchema = SchemaFactory.createForClass(ProjectFile);

@Schema({ timestamps: true })
export class Video {
  @Prop({ required: true, unique: true })
  youtubeId: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true })
  thumbnail: string;

  @Prop({ required: true })
  publishedAt: Date;

  @Prop({ default: '' })
  duration: string;

  @Prop({ default: '' })
  channelTitle: string;

  @Prop({ type: [AffiliateItemSchema], default: [] })
  tools: AffiliateItem[];

  @Prop({ type: [AffiliateItemSchema], default: [] })
  materials: AffiliateItem[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Tag' }], default: [] })
  tags: Types.ObjectId[];

  @Prop({ type: [ProjectFileSchema], default: [] })
  files: ProjectFile[];

  @Prop({ default: false })
  published: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type VideoDocument = HydratedDocument<Video>;

export const VideoSchema = SchemaFactory.createForClass(Video);
VideoSchema.index({ published: 1, publishedAt: -1 });
VideoSchema.index({ published: 1, tags: 1, publishedAt: -1 });
