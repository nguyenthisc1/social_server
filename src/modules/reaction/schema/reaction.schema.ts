import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Reaction extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: {
      type: String,
      id: { type: Types.ObjectId },
    },
    required: true,
  })
  target: {
    type: string;
    id: Types.ObjectId;
  };

  @Prop({
    type: String,
    enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
    required: true,
  })
  type: string;
}

export const ReactionSchema = SchemaFactory.createForClass(Reaction);

ReactionSchema.index(
  { userId: 1, 'target.type': 1, 'target.id': 1 },
  { unique: true },
);

ReactionSchema.index({ 'target.type': 1, 'target.id': 1 });
