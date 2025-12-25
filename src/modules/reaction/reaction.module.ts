import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentModule } from '../comment/comment.module';
import { Comment, CommentSchema } from '../comment/schema/comment.schema';
import { PostModule } from '../post/post.module';
import { Post, PostSchema } from '../post/schema/post.schema';
import { ReactionController } from './reaction.controller';
import { ReactionService } from './reaction.service';
import { Reaction, ReactionSchema } from './schema/reaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reaction.name, schema: ReactionSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
    PostModule,
    CommentModule,
  ],
  providers: [ReactionService],
  controllers: [ReactionController],
  exports: [ReactionService],
})
export class ReactionModule {}
