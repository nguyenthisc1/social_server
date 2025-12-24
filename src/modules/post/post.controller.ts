/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostService } from './post.service';
import { FeedQueryDto } from '../../common/dto/feed-query.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createPost(@Req() req, @Body() dto: CreatePostDto) {
    const userId: string = (req.user as { userId: string }).userId;
    return this.postService.create(dto, userId);
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard)
  updatePost(
    @Req() req,
    @Param('id') postId: string,
    @Body() dto: UpdatePostDto,
  ) {
    const userId: string = (req.user as { userId: string }).userId;
    return this.postService.update(postId, dto, userId);
  }

  @Post('/delete/:id')
  @UseGuards(JwtAuthGuard)
  deletePost(@Req() req, @Param('id') postId: string) {
    const userId: string = (req.user as { userId: string }).userId;
    return this.postService.delete(postId, userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getPostById(@Req() req, @Param('id') postId: string) {
    const userId: string = (req.user as { userId: string }).userId;
    return this.postService.getById(postId, userId);
  }

  @Get('user/:userId')
  getByUser(
    @Param('userId') userId: string,
    @Query() query: FeedQueryDto,
    @Req() req,
  ) {
    return this.postService.getByUser(userId, req.user.userId as string, query);
  }

  @Get('feed/home')
  @UseGuards(JwtAuthGuard)
  getHomeFeed(@Req() req, @Query() query: FeedQueryDto) {
    const userId: string = (req.user as { userId: string }).userId;
    return this.postService.getHomeFeed(userId, query);
  }
}
