/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req, @Body() dto: CreateCommentDto) {
    const userId = (req.user as { userId: string }).userId;
    if (!userId) throw new BadRequestException('Missing user id');
    return this.commentService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':commentId')
  async update(
    @Req() req,
    @Param('commentId') commentId: string,
    @Body('content') content: string,
  ) {
    const userId = (req.user as { userId: string }).userId;
    if (!userId) throw new BadRequestException('Missing user id');
    return this.commentService.update(userId, commentId, content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  async delete(@Req() req, @Param('commentId') commentId: string) {
    const userId = (req.user as { userId: string }).userId;
    if (!userId) throw new BadRequestException('Missing user id');
    await this.commentService.delete(commentId, userId);
    return { message: 'Comment deleted' };
  }

  @Get('post/:postId')
  async getByPost(
    @Param('postId') postId: string,
    @Query() query: PaginationDto,
  ) {
    return this.commentService.getByPost(postId, query);
  }

  @Get(':commentId/replies')
  async getReplies(
    @Param('commentId') commentId: string,
    @Query() query: PaginationDto,
  ) {
    return this.commentService.getReplies(commentId, query);
  }
}
