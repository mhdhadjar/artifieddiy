import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const WEBLOG_BLOCK_TYPES = ['markdown', 'image'] as const;
export type WeblogBlockType = (typeof WEBLOG_BLOCK_TYPES)[number];

export const RESERVED_ADDRESSES = new Set([
  'about',
  'admin',
  'affiliate-disclosure',
  'api',
  'contact',
  'media',
  'privacy',
  'robots',
  'sitemap',
  'videos',
  'weblog',
  'weblogs',
]);

@Schema({ _id: false })
export class WeblogBlock {
  @Prop({ required: true, enum: WEBLOG_BLOCK_TYPES })
  type: WeblogBlockType;

  @Prop({ default: '' })
  markdown: string;

  @Prop({ default: '' })
  imageUrl: string;

  @Prop({ default: '' })
  alt: string;
}

export const WeblogBlockSchema = SchemaFactory.createForClass(WeblogBlock);

@Schema({ timestamps: true })
export class Weblog {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  address: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  youtubeUrl: string;

  @Prop({ default: '' })
  mainImage: string;

  @Prop({ type: [WeblogBlockSchema], default: [] })
  content: WeblogBlock[];

  @Prop({ default: false })
  published: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type WeblogDocument = HydratedDocument<Weblog>;

export const WeblogSchema = SchemaFactory.createForClass(Weblog);
WeblogSchema.index({ published: 1, updatedAt: -1 });
