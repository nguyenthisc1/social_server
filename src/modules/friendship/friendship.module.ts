import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/user.schema';
import { FriendRequest, FriendRequestSchema } from './friend-request.schema';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: FriendRequest.name, schema: FriendRequestSchema },
    ]),
  ],
  providers: [FriendshipService],
  controllers: [FriendshipController],
  exports: [FriendshipService],
})
export class FriendshipModule {}
