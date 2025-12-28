import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../user/schema/user.schema';
import { Friendship } from './schema/friend-request.schema';

@Injectable()
export class FriendshipService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Friendship.name) private friendshipModel: Model<Friendship>,
  ) {}

  async sendRequest(requesterId: string, receiverId: string) {
    if (!Types.ObjectId.isValid(requesterId)) {
      throw new BadRequestException('Invalid sender user ID');
    }
    if (!Types.ObjectId.isValid(receiverId)) {
      throw new BadRequestException('Invalid receiver user ID');
    }

    if (requesterId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const [requesterUser, receiverUser] = await Promise.all([
      this.userModel.findById(requesterId),
      this.userModel.findById(receiverId),
    ]);

    if (!requesterUser) {
      throw new NotFoundException('Sender user not found');
    }
    if (!receiverUser) {
      throw new NotFoundException('Receiver user not found');
    }

    const isFriend = requesterUser.friends.some(
      (friendId) => friendId.toString() === receiverId,
    );
    if (isFriend) {
      throw new ConflictException('Users are already friends');
    }
    const userA = [requesterId, receiverId].sort()[0];
    const userB = [requesterId, receiverId].sort()[1];

    const existingRequest = await this.friendshipModel.findOne({
      $or: [
        { requesterId: userA, receiverId: userB, status: 'pending' },
        { requesterId: userB, receiverId: userA, status: 'pending' },
      ],
    });

    if (existingRequest) {
      throw new ConflictException('Friend request already exists');
    }

    const newRequest = await this.friendshipModel.create({
      requesterId: requesterId,
      receiverId: receiverId,
    });

    return {
      success: true,
      message: 'Friend request sent successfully',
      data: newRequest,
    };
  }

  async acceptRequest(requestId: string, userId: string) {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new BadRequestException('Invalid request ID');
    }

    const request = await this.friendshipModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.receiverId.toString() !== userId) {
      throw new BadRequestException('You can only accept requests sent to you');
    }

    if (request.status === 'accepted') {
      throw new ConflictException('Friend request already accepted');
    }

    if (request.status === 'rejected') {
      throw new BadRequestException('Friend request was rejected');
    }

    await Promise.all([
      this.userModel.findByIdAndUpdate(request.requesterId, {
        $addToSet: { friends: request.receiverId },
      }),
      this.userModel.findByIdAndUpdate(request.receiverId, {
        $addToSet: { friends: request.requesterId },
      }),
      this.friendshipModel.updateOne(
        { _id: requestId },
        { status: 'accepted' },
      ),
    ]);

    return {
      success: true,
      message: 'Friend request accepted successfully',
      status: true,
    };
  }

  async rejectRequest(requestId: string, userId: string) {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new BadRequestException('Invalid request ID');
    }

    const request = await this.friendshipModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.receiverId.toString() !== userId) {
      throw new BadRequestException('You can only reject requests sent to you');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('Can only reject pending requests');
    }

    await this.friendshipModel.updateOne(
      { _id: requestId },
      { status: 'rejected' },
    );

    return {
      success: true,
      message: 'Friend request rejected successfully',
      status: true,
    };
  }

  async getPendingRequests(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const requests = await this.friendshipModel
      .find({ receiverId: userId, status: 'pending' })
      .populate('requesterId', 'username email avatarUrl')
      .sort({ createdAt: -1 });

    return {
      success: true,
      message: 'Pending friend requests fetched successfully',
      data: requests,
      status: true,
    };
  }

  async getSentRequests(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const requests = await this.friendshipModel
      .find({ requesterId: userId, status: 'pending' })
      .populate('receiverId', 'username email avatarUrl')
      .sort({ createdAt: -1 });

    return {
      success: true,
      message: 'Sent friend requests fetched successfully',
      data: requests,
      status: true,
    };
  }

  async getFriends(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel
      .findById(userId)
      .populate('friends', 'username email avatarUrl bio')
      .select('friends');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'Friends list fetched successfully',
      data: user.friends,
      status: true,
    };
  }

  async isFriend(userAId: string, userBId: string) {
    if (!Types.ObjectId.isValid(userAId) || !Types.ObjectId.isValid(userBId)) {
      return {
        success: false,
        message: 'Invalid user ID(s)',
        status: false,
        isFriend: false,
      };
    }
    if (userAId === userBId)
      return {
        success: false,
        message: 'Cannot be friends with yourself',
        status: false,
        isFriend: false,
      };
    const userA = await this.userModel.findById(userAId).select('friends');
    if (!userA)
      return {
        success: false,
        message: 'User not found',
        status: false,
        isFriend: false,
      };
    const isFriend = userA.friends.some(
      (friendId) => friendId.toString() === userBId,
    );
    return {
      success: true,
      message: 'Friendship status fetched',
      isFriend,
      status: true,
    };
  }

  async getFriendIds(userId: string) {
    const friendships = await this.friendshipModel.find({
      status: 'accepted',
      $or: [{ requesterId: userId }, { receiverId: userId }],
    });

    const friends = friendships.map((f) =>
      f.requesterId.toString() === userId
        ? f.receiverId.toString()
        : f.requesterId.toString(),
    );

    return {
      success: true,
      message: 'Friend IDs fetched successfully',
      data: friends,
      status: true,
    };
  }
}
