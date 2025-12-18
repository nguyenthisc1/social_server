import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../user/schema/user.schema';
import { FriendRequest } from './schema/friend-request.schema';

@Injectable()
export class FriendshipService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(FriendRequest.name) private requestModel: Model<FriendRequest>,
  ) {}

  async sendRequest(requesterId: string, receiverId: string) {
    // Validate that requesterId and receiverId are valid MongoDB ObjectIds
    if (!Types.ObjectId.isValid(requesterId)) {
      throw new BadRequestException('Invalid sender user ID');
    }
    if (!Types.ObjectId.isValid(receiverId)) {
      throw new BadRequestException('Invalid receiver user ID');
    }

    // Can't send request to yourself
    if (requesterId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if both users exist
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

    // Check if already friends
    const isFriend = requesterUser.friends.some(
      (friendId) => friendId.toString() === receiverId,
    );
    if (isFriend) {
      throw new ConflictException('Users are already friends');
    }
    const userA = [requesterId, receiverId].sort()[0];
    const userB = [requesterId, receiverId].sort()[1];

    // Check if there's already a pending request
    const existingRequest = await this.requestModel.findOne({
      $or: [
        { requesterId: userA, receiverId: userB, status: 'pending' },
        { requesterId: userB, receiverId: userA, status: 'pending' },
      ],
    });

    if (existingRequest) {
      throw new ConflictException('Friend request already exists');
    }

    return this.requestModel.create({
      requesterId: requesterId,
      receiverId: receiverId,
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
    if (request.receiverId.toString() !== userId) {
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
      this.userModel.findByIdAndUpdate(request.requesterId, {
        $addToSet: { friends: request.receiverId },
      }),
      this.userModel.findByIdAndUpdate(request.receiverId, {
        $addToSet: { friends: request.requesterId },
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
    if (request.receiverId.toString() !== userId) {
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
      .find({ receiverId: userId, status: 'pending' })
      .populate('requesterId', 'username email avatarUrl')
      .sort({ createdAt: -1 });
  }

  async getSentRequests(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.requestModel
      .find({ requesterId: userId, status: 'pending' })
      .populate('receiverId', 'username email avatarUrl')
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
