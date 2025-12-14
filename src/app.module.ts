import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostsModule } from './modules/posts/posts.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendshipModule } from './modules/friendship/friendship.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    PostsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    FriendshipModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
