/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getMyNotifications(@Req() req) {
    const userId: string = (req.user as { userId: string }).userId;
    return this.notificationService.getUserNotifications(userId);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string, @Req() req) {
    const userId: string = (req.user as { userId: string }).userId;
    return this.notificationService.markAsRead(id, userId);
  }
}
