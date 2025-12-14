import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../user/user.schema';
import { FriendRequest } from './friend-request.schema';

@Injectable()
export class FriendshipService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(FriendRequest.name) private requestModel: Model<FriendRequest>,
  ) {}

  async sendRequest(fromId: string, toId: string) {
    // Validate that fromId and toId are valid MongoDB ObjectIds
    if (!Types.ObjectId.isValid(fromId)) {
      throw new BadRequestException('Invalid sender user ID');
    }
    if (!Types.ObjectId.isValid(toId)) {
      throw new BadRequestException('Invalid receiver user ID');
    }

    // Can't send request to yourself
    if (fromId === toId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if both users exist
    const [fromUser, toUser] = await Promise.all([
      this.userModel.findById(fromId),
      this.userModel.findById(toId),
    ]);

    if (!fromUser) {
      throw new NotFoundException('Sender user not found');
    }
    if (!toUser) {
      throw new NotFoundException('Receiver user not found');
    }

    // Check if already friends
    const isFriend = fromUser.friends.some(
      (friendId) => friendId.toString() === toId,
    );
    if (isFriend) {
      throw new ConflictException('Users are already friends');
    }
    const userA = [fromId, toId].sort()[0];
    const userB = [fromId, toId].sort()[1];

    // Check if there's already a pending request
    const existingRequest = await this.requestModel.findOne({
      $or: [
        { from: userA, to: userB, status: 'pending' },
        { from: userB, to: userA, status: 'pending' },
      ],
    });

    if (existingRequest) {
      throw new ConflictException('Friend request already exists');
    }

    return this.requestModel.create({
      from: fromId,
      to: toId,
    });
  }

  async acceptRequest(requestId: string, userId: string) {
    // Validate requestId
    if (!Types.ObjectId.isValid(requestId)) {
      throw new BadRequestException('Invalid request ID');
    }

    const request = await this.requestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    // Verify that the current user is the receiver of the request
    if (request.to.toString() !== userId) {
      throw new BadRequestException('You can only accept requests sent to you');
    }

    // Check if already accepted
    if (request.status === 'accepted') {
      throw new ConflictException('Friend request already accepted');
    }

    // Check if rejected
    if (request.status === 'rejected') {
      throw new BadRequestException('Friend request was rejected');
    }

    await Promise.all([
      this.userModel.findByIdAndUpdate(request.from, {
        $addToSet: { friends: request.to },
      }),
      this.userModel.findByIdAndUpdate(request.to, {
        $addToSet: { friends: request.from },
      }),
      this.requestModel.updateOne({ _id: requestId }, { status: 'accepted' }),
    ]);

    return { message: 'Friend request accepted successfully' };
  }

  async rejectRequest(requestId: string, userId: string) {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new BadRequestException('Invalid request ID');
    }

    const request = await this.requestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    // Verify that the current user is the receiver of the request
    if (request.to.toString() !== userId) {
      throw new BadRequestException('You can only reject requests sent to you');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('Can only reject pending requests');
    }

    await this.requestModel.updateOne(
      { _id: requestId },
      { status: 'rejected' },
    );

    return { message: 'Friend request rejected successfully' };
  }

  async getPendingRequests(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.requestModel
      .find({ to: userId, status: 'pending' })
      .populate('from', 'username email avatarUrl')
      .sort({ createdAt: -1 });
  }

  async getSentRequests(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.requestModel
      .find({ from: userId, status: 'pending' })
      .populate('to', 'username email avatarUrl')
      .sort({ createdAt: -1 });
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

    return user.friends;
  }
}
