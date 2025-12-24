import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from '../post/schema/post.schema';
import { Reaction } from './schema/reaction.schema';

@Injectable()
export class ReactionService {
  constructor(
    @InjectModel(Reaction.name)
    private reactionModel: Model<Reaction>,

    @InjectModel(Post.name)
    private postModel: Model<Post>,
  ) {}

  async react(
    userId: string,
    targetType: 'post' | 'comment',
    targetId: string,
    type: string,
  ) {
    const userObjectId = Types.ObjectId.createFromHexString(userId);
    const targetObjectId = Types.ObjectId.createFromHexString(targetId);

    const existing = await this.reactionModel.findOne({
      userId: userObjectId,
      'target.type': targetType,
      'target.id': targetObjectId,
    });

    if (!existing) {
      await this.reactionModel.create({
        userId: userObjectId,
        target: { type: targetType, id: targetObjectId },
        type,
      });

      await this.postModel.findByIdAndUpdate(targetId, {
        $inc: { likeCount: 1 },
      });

      return { action: 'created' };
    }

    if (existing.type === type) {
      await existing.deleteOne();

      await this.postModel.findByIdAndUpdate(targetId, {
        $inc: { likeCount: -1 },
      });

      return { action: 'removed' };
    }

    existing.type = type;
    await existing.save();

    return { action: 'updated' };
  }

  async getReactionSummary(targetType: string, targetId: string) {
    return this.reactionModel.aggregate([
      {
        $match: {
          'target.type': targetType,
          'target.id': new Types.ObjectId(targetId),
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);
  }
}
