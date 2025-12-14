import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class FriendRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  from: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  to: Types.ObjectId;

  @Prop({ enum: ['pending', 'accepted', 'rejected'], default: 'pending' })
  status: string;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);

FriendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

FriendRequestSchema.index({ to: 1, status: 1 });
