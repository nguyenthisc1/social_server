import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ trim: true, maxlength: 2000 })
  content: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({
    enum: ['text', 'image', 'share'],
    default: 'text',
    type: String,
  })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Post', default: null })
  sharedPostId?: Types.ObjectId;

  @Prop({
    enum: ['public', 'friends', 'private'],
    default: 'friends',
    type: String,
  })
  visibility: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  allowedUserIds: Types.ObjectId[];

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({
    enum: ['active', 'hidden', 'reported'],
    default: 'active',
    type: String,
  })
  status: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ visibility: 1, createdAt: -1 });
// Removed duplicate index
PostSchema.index({ authorId: 1, visibility: 1, createdAt: -1 });
