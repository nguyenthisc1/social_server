import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', require: true })
  authorId: Types.ObjectId;

  @Prop({ type: String, trim: true, maxLength: 2000 })
  content: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({
    enum: ['public', 'friends', 'private'],
    default: 'friends',
  })
  visibility: string;

  @Prop({ type: Number, default: 0 })
  likeCount: number;

  @Prop({ type: Number, default: 0 })
  commentCount: number;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ authorId: 1, createdAt: -1 });
