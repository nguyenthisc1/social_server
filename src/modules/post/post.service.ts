import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeedQueryDto } from '../../common/dto/feed-query.dto';
import { FriendshipService } from '../friendship/friendship.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './schema/post.schema';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    private friendshipService: FriendshipService,
  ) {}

  // Core
  async create(dto: CreatePostDto, authorId: string) {
    const hasContent = dto.content && dto.content.trim().length > 0;
    const hasImages = dto.images && dto.images.length > 0;
    const isShare = !!dto.sharedPostId;

    if (!hasContent && !hasImages && !isShare) {
      throw new BadRequestException('Post cannot be empty');
    }

    let type: 'text' | 'image' | 'share' = 'text';

    if (isShare) type = 'share';
    else if (hasImages) type = 'image';

    if (isShare) {
      // Check if sharedPostId is a valid ObjectId
      if (!Types.ObjectId.isValid(dto.sharedPostId!)) {
        throw new BadRequestException('Invalid shared post id');
      }

      const sharedPost = await this.postModel.findOne({
        _id: dto.sharedPostId,
        isDeleted: false,
        status: 'active',
      });

      if (!sharedPost) {
        throw new NotFoundException('Shared post not found');
      }
    }

    const post = await this.postModel.create({
      authorId: Types.ObjectId.createFromHexString(authorId),
      content: dto.content || '',
      images: dto.images || [],
      visibility: dto.visibility || 'friends',
      type,
      sharedPostId: dto.sharedPostId || undefined,
    });

    return post;
  }

  async update(postId: string, dto: UpdatePostDto, authorId: string) {
    // Check if postId is a valid ObjectId
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post id');
    }

    const post = await this.postModel.findOne({
      _id: postId,
      isDeleted: false,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Only the author can update the post
    if (post.authorId.toString() !== authorId) {
      throw new BadRequestException('You are not the author of this post');
    }

    // Cannot update a 'share' type post (optional business logic)
    // if (post.type === 'share') {
    //   throw new BadRequestException('Cannot update a shared post');
    // }

    const hasContent = dto.content && dto.content.trim().length > 0;
    const hasImages = dto.images && dto.images.length > 0;

    if (!hasContent && !hasImages) {
      throw new BadRequestException('Post cannot be empty');
    }

    // Update fields
    if (typeof dto.content === 'string') {
      post.content = dto.content.trim();
    }

    if (Array.isArray(dto.images)) {
      post.images = dto.images;
    }

    if (dto.visibility) {
      post.visibility = dto.visibility;
    }

    // Only text/image can change type; share type is not updatable
    if (hasImages) {
      post.type = 'image';
    } else {
      post.type = 'text';
    }

    await post.save();

    return post;
  }

  async delete(postId: string, userId: string) {
    // Check if postId is a valid ObjectId
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post id');
    }

    const post = await this.postModel.findOne({
      _id: postId,
      isDeleted: false,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Only the author can delete the post
    if (post.authorId.toString() !== userId) {
      throw new BadRequestException('You are not the author of this post');
    }

    post.isDeleted = true;
    await post.save();

    return { success: true };
  }

  // Query
  async getById(postId: string, viewerId: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post id');
    }

    const post = await this.postModel
      .findOne({ _id: postId, isDeleted: false })
      .populate('authorId', 'username avatar');

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Visibility check
    if (post.visibility === 'private') {
      if (post.authorId._id.toString() !== viewerId) {
        throw new ForbiddenException('You cannot view this post');
      }
    }

    // if (post.visibility === 'friends') {
    //   const isFriend = await this.friendshipService.isFriend(
    //     post.authorId._id,
    //     viewerId,
    //   );

    //   if (!isFriend && post.authorId._id.toString() !== viewerId) {
    //     throw new ForbiddenException('Friends only');
    //   }
    // }

    return post;
  }

  async getByUser(userId: string, viewerId: string, query: FeedQueryDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const isOwner = userId === viewerId;

    let visibilityFilter: any[] = [{ visibility: 'public' }];

    if (isOwner) {
      visibilityFilter = [
        { visibility: 'public' },
        { visibility: 'friends' },
        { visibility: 'private' },
      ];
    } else {
      const isFriend = await this.friendshipService.isFriend(userId, viewerId);
      if (isFriend) {
        visibilityFilter.push({ visibility: 'friends' });
      }
    }

    const posts = await this.postModel
      .find({
        authorId: userId,
        isDeleted: false,
        $or: visibilityFilter,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'username avatar')
      .lean();

    return posts;
  }

  // Feed
  async getHomeFeed(viewerId: string, query: FeedQueryDto) {
    if (!Types.ObjectId.isValid(viewerId)) {
      throw new BadRequestException('Invalid user id');
    }

    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const friendIds = await this.friendshipService.getFriendIds(viewerId);

    const viewerObjectId = Types.ObjectId.createFromHexString(viewerId);

    // Prepare authorIds as ObjectIds, filter out invalid ids
    const authorIds = [
      viewerObjectId,
      ...friendIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => Types.ObjectId.createFromHexString(id)),
    ];

    const postQuery = {
      isDeleted: false,
      authorId: { $in: authorIds },
      $or: [{ visibility: { $in: ['public', 'friends'] } }],
    };

    const posts = await this.postModel
      .find(postQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'username avatar')
      .lean();

    return posts;
  }

  // Interaction
  //   like(postId: string, userId: string);
  //   unlike(postId: string, userId: string);

  // Save
  //   save(postId: string, userId: string);
  //   unsave(postId: string, userId: string);
}
