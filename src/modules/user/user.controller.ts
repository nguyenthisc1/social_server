import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userervice: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.userervice.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/friends')
  async getFriends(@Param('id') id: string) {
    return this.userervice.findFriends(id);
  }
}
