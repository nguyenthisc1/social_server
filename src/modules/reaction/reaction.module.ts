import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
    ]),
    PostModule,
  ],
  providers: [ReactionService],
  controllers: [ReactionController],
  exports: [ReactionService],
})
export class ReactionModule {}
