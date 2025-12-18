import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Media {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['image', 'video', 'audio', 'file'],
    required: true,
  })
  mediaType: string;

  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: String })
  thumbnailUrl?: string;

  @Prop({
    type: String,
    enum: ['post', 'comment', 'message', 'avatar', 'cover', 'story'],
    required: true,
  })
  targetType: string;

  @Prop({ type: Types.ObjectId })
  targetId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['uploading', 'ready', 'failed'],
    default: 'uploading',
  })
  status: string;

  @Prop({
    width: Number,
    height: Number,
    duration: Number,
    size: Number,
  })
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    size?: number;
  };
}

export const MediaSchema = SchemaFactory.createForClass(Media);

MediaSchema.index({ targetType: 1, targetId: 1 });
MediaSchema.index({ ownerId: 1, createdAt: -1 });
