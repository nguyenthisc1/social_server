import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { notification } from './schema/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(notification.name)
    private notificationModel: Model<notification>,
  ) {}

  async create(data: {
    recipientId: string;
    actorId?: string;
    type: string;
    targetType: string;
    targetId?: string;
    title?: string;
    body?: string;
    metadata?: Record<string, any>;
  }) {
    if (data.recipientId === data.actorId) return null;

    return this.notificationModel.create({
      recipientId: new Types.ObjectId(data.recipientId),
      actorId: data.actorId ? new Types.ObjectId(data.actorId) : undefined,
      type: data.type,
      targetType: data.targetType,
      targetId: data.targetId ? new Types.ObjectId(data.targetId) : undefined,
      title: data.title,
      body: data.body,
      metadata: data.metadata,
    });
  }

  async getUserNotifications(userId: string, limit = 20) {
    return this.notificationModel
      .find({ recipientId: userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('actorId', 'username avatar')
      .lean();
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.notificationModel.updateOne(
      { _id: notificationId, recipientId: userId },
      { $set: { isRead: true } },
    );
  }
}
