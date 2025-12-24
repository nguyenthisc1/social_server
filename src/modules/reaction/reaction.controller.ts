import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReactDto } from './dto/react.dto';
import { ReactionService } from './reaction.service';

@Controller('reaction')
export class ReactionController {
  constructor(private reactionService: ReactionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  react(@Req() req: { user?: { userId?: string } }, @Body() dto: ReactDto) {
    const userId = req?.user?.userId;
    return this.reactionService.react(
      userId!,
      dto.targetType,
      dto.targetId,
      dto.type,
    );
  }

  @Post('summary')
  @UseGuards(JwtAuthGuard)
  async getSummary(@Body() body: { targetType: string; targetId: string }) {
    const { targetType, targetId } = body;
    return this.reactionService.getReactionSummary(targetType, targetId);
  }
}
