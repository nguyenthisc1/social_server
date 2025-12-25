import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment } from '../comment/schema/comment.schema';
import { Post } from '../post/schema/post.schema';
import { Reaction } from './schema/reaction.schema';

@Injectable()
export class ReactionService {
  constructor(
    @InjectModel(Reaction.name)
    private reactionModel: Model<Reaction>,

    @InjectModel(Post.name)
    private postModel: Model<Post>,

    @InjectModel(Comment.name)
    private commentModel: Model<Comment>,
  ) {}

  async react(
    userId: string,
    targetType: 'post' | 'comment',
    targetId: string,
    type: string,
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }
    if (!Types.ObjectId.isValid(targetId)) {
      throw new BadRequestException(`Invalid ${targetType} id`);
    }

    const userObjectId = Types.ObjectId.createFromHexString(userId);
    const targetObjectId = Types.ObjectId.createFromHexString(targetId);

    // Check target existence
    let target: Post | Comment | null = null;
    if (targetType === 'post') {
      target = await this.postModel.findOne({
        _id: targetObjectId,
        isDeleted: false,
      });
      if (!target) throw new NotFoundException('Post not found');
    } else if (targetType === 'comment') {
      target = await this.commentModel.findById(targetObjectId);
      if (!target) throw new NotFoundException('Comment not found');
    } else {
      throw new BadRequestException('Invalid target type');
    }

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

      if (targetType === 'post') {
        await this.postModel.findByIdAndUpdate(targetObjectId, {
          $inc: { likeCount: 1 },
        });
      }

      if (targetType === 'comment') {
        await this.commentModel.findByIdAndUpdate(targetObjectId, {
          $inc: { likeCount: 1 },
        });
      }

      return { action: 'created' };
    }

    if (existing.type === type) {
      await existing.deleteOne();

      if (targetType === 'post') {
        await this.postModel.findByIdAndUpdate(targetObjectId, {
          $inc: { likeCount: -1 },
        });
      }
      if (targetType === 'comment') {
        await this.commentModel.findByIdAndUpdate(targetObjectId, {
          $inc: { likeCount: -1 },
        });
      }

      return { action: 'removed' };
    }

    // Update reaction type
    existing.type = type;
    await existing.save();

    return { action: 'updated' };
  }

  async getReactionSummary(targetType: string, targetId: string) {
    if (!['post', 'comment'].includes(targetType)) {
      throw new BadRequestException('Invalid target type');
    }
    if (!Types.ObjectId.isValid(targetId)) {
      throw new BadRequestException('Invalid target id');
    }
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
