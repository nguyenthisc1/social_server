import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RefreshToken extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  tokenHash: string;

  @Prop({ index: true })
  deviceId: string;

  @Prop()
  ip: string;

  @Prop()
  userAgent: string;

  @Prop({ required: true, index: { expires: 0 } })
  expiresAt: Date;

  @Prop({ type: Date, default: null, index: true })
  revokedAt: Date | null;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Compound indexes for common queries
RefreshTokenSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });
RefreshTokenSchema.index({ userId: 1, deviceId: 1, revokedAt: 1 });

// TTL index to automatically delete expired and revoked tokens after 30 days
RefreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
);
