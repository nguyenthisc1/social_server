import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CommentModule } from './modules/comment/comment.module';
import { FriendshipModule } from './modules/friendship/friendship.module';
import { MediaModule } from './modules/media/media.module';
import { PostModule } from './modules/post/post.module';
import { ReactionModule } from './modules/reaction/reaction.module';
import { UserModule } from './modules/user/user.module';
import { MediaService } from './nest/modules/media/media.service';
import { NotificationService } from './nest/modules/notification/notification.service';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    UserModule,
    AuthModule,
    FriendshipModule,
    PostModule,
    CommentModule,
    ReactionModule,
    MediaModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService, MediaService, NotificationService],
})
export class AppModule {}
