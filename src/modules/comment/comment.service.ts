import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Post } from '../post/schema/post.schema';
import { Reaction } from '../reaction/schema/reaction.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './schema/comment.schema';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Reaction.name) private reactionModel: Model<Reaction>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
  ) {}

  // core
  async create(userId: string, dto: CreateCommentDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    if (!Types.ObjectId.isValid(dto.postId)) {
      throw new BadRequestException('Invalid post id');
    }

    const authorId = Types.ObjectId.createFromHexString(userId);
    const postId = Types.ObjectId.createFromHexString(dto.postId);

    const comment = await this.commentModel.create({
      postId,
      ...(dto.parentCommentId && {
        parentCommentId: Types.ObjectId.createFromHexString(
          dto.parentCommentId,
        ),
      }),
      content: dto.content,
      authorId,
    });

    await this.postModel.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
    });

    return {
      success: true,
      message: 'Comment created successfully.',
      data: comment,
    };
  }

  async update(userId: string, commentId: string, content: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Invalid comment id');
    }

    // Find the comment by its ID
    const comment = await this.commentModel.findById(commentId);

    if (!comment || comment.isDeleted) {
      throw new NotFoundException('Comment not found');
    }

    // Check if the user is the author of the comment
    if (comment.authorId.toString() !== userId) {
      throw new BadRequestException('You are not the author of this comment');
    }

    // Only update if new content is different, and not empty after trim
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new BadRequestException('Comment content cannot be empty');
    }
    if (comment.content === trimmedContent) {
      throw new BadRequestException(
        'The new content is the same as the current content',
      );
    }

    comment.content = trimmedContent;
    comment.isEdited = true;

    const savedComment = await comment.save();

    return {
      success: true,
      message: 'Comment updated successfully.',
      data: savedComment,
    };
  }

  async delete(commentId: string, userId: string) {
    // Find the comment by its ID
    const comment = await this.commentModel.findById(commentId);

    if (!comment || comment.isDeleted) {
      throw new NotFoundException('Comment not found');
    }

    // Check if the user is the author of the comment
    if (comment.authorId.toString() !== userId) {
      throw new BadRequestException('You are not the author of this comment');
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();

    await comment.save();

    await this.postModel.findByIdAndUpdate(comment.postId, {
      $inc: { commentCount: -1 },
    });

    return {
      success: true,
      message: 'Comment deleted successfully.',
    };
  }

  async getByPost(postId: string, query: PaginationDto) {
    const DEFAULT_LIMIT = 10;
    const MAX_LIMIT = 10;
    const requestedLimit = Number(query.limit) || DEFAULT_LIMIT;
    const limit = Math.min(requestedLimit, MAX_LIMIT);

    const filter: any = {
      postId: Types.ObjectId.createFromHexString(postId),
      parentCommentId: null,
      isDeleted: false,
    };

    if (query.cursor) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      filter._id = { $lt: Types.ObjectId.createFromHexString(query.cursor) };
    }

    const comments = await this.commentModel
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .find(filter)
      .sort({ _id: -1 }) // newest first
      .limit(limit + 1)
      .populate('authorId', 'username avatar')
      .lean();

    const hasMore = comments.length > limit;
    if (hasMore) comments.pop();

    return {
      success: true,
      message: 'Comments fetched successfully.',
      data: comments,
      nextCursor:
        hasMore && comments.length
          ? comments[comments.length - 1]._id?.toString() || null
          : null,
    };
  }

  async getReplies(commentId: string, dto: PaginationDto) {
    const DEFAULT_LIMIT = 5;
    const MAX_LIMIT = 10;
    const requestedLimit = Number(dto.limit) || DEFAULT_LIMIT;
    const limit = Math.min(requestedLimit, MAX_LIMIT);

    const filter: any = {
      parentCommentId: Types.ObjectId.createFromHexString(commentId),
      isDeleted: false,
    };

    if (dto.cursor) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      filter._id = { $gt: Types.ObjectId.createFromHexString(dto.cursor) };
    }

    const replies = await this.commentModel
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit + 1)
      .populate('authorId', 'username avatar')
      .lean();

    const hasMore = replies.length > limit;
    if (hasMore) replies.pop();

    return {
      success: true,
      message: 'Replies fetched successfully.',
      data: replies,
      nextCursor:
        hasMore && replies.length
          ? replies[replies.length - 1]._id?.toString() || null
          : null,
    };
  }
}
