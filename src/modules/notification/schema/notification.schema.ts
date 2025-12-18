import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  actorId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: [
      'friend_request',
      'friend_accept',
      'post_like',
      'post_comment',
      'comment_like',
      'message',
      'mention',
      'system',
    ],
    required: true,
  })
  type: string;

  @Prop({ type: String })
  title?: string;

  @Prop({ type: String })
  body?: string;

  @Prop({
    type: String,
    enum: ['post', 'comment', 'message', 'user', 'system'],
    required: true,
  })
  targetType: string;

  @Prop({ type: Types.ObjectId })
  targetId?: Types.ObjectId;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
