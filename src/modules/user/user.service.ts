import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { User } from './schema/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.userModel.findOne({ email: dto.email });
    if (exists) {
      throw new ConflictException('Email already exists');
    }
    const user = new this.userModel(dto);
    return user.save();
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      return {
        status: false,
        message: 'User not found',
        data: null,
      };
    }

    return {
      status: true,
      message: 'User fetched successfully',
      data: user,
    };
  }

  async findFriends(id: string) {
    const user = await this.userModel.findById(id).populate({
      path: 'friends',
      select: '-password',
    });
    if (!user) throw new NotFoundException('User not found');
    // If no friends array is present, return empty list to match usual semantics

    // Adding status for compatibility with @friendship.service.ts (160-162)
    // Follows structure: { status: true, message: '...', data: ... }
    return {
      status: true,
      message: 'Friends fetched successfully',
      data: user.friends || [],
    };
  }
}
