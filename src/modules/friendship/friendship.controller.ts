import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendFriendRequestDto } from 'src/modules/friendship/send-friend-request.dto';

@Controller('friendship')
@UseGuards(JwtAuthGuard)
export class FriendshipController {
  constructor(private friendshipService: FriendshipService) {}

  @Post('request')
  sendRequest(
    @Req() req: { user?: { userId?: string } },
    @Body() dto: SendFriendRequestDto,
  ) {
    const fromId = req?.user?.userId;
    if (!fromId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.friendshipService.sendRequest(fromId, dto.toUserId);
  }

  @Post('accept/:requestId')
  acceptRequest(
    @Req() req: { user?: { userId?: string } },
    @Param('requestId') requestId: string,
  ) {
    const userId = req?.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.friendshipService.acceptRequest(requestId, userId);
  }

  @Post('reject/:requestId')
  rejectRequest(
    @Req() req: { user?: { userId?: string } },
    @Param('requestId') requestId: string,
  ) {
    const userId = req?.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.friendshipService.rejectRequest(requestId, userId);
  }

  @Get('requests/pending')
  getPendingRequests(@Req() req: { user?: { userId?: string } }) {
    const userId = req?.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.friendshipService.getPendingRequests(userId);
  }

  @Get('requests/sent')
  getSentRequests(@Req() req: { user?: { userId?: string } }) {
    const userId = req?.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.friendshipService.getSentRequests(userId);
  }

  @Get('friends')
  getFriends(@Req() req: { user?: { userId?: string } }) {
    const userId: string = (req.user as { userId: string }).userId;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.friendshipService.getFriends(userId);
  }

  @Get('friends/:userId')
  getUserFriends(@Param('userId') userId: string) {
    return this.friendshipService.getFriends(userId);
  }
}
