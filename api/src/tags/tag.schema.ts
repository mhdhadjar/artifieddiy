import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Tag {
  @Prop({ required: true, trim: true, maxlength: 40 })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  createdAt: Date;
  updatedAt: Date;
}

export type TagDocument = HydratedDocument<Tag>;

export const TagSchema = SchemaFactory.createForClass(Tag);
