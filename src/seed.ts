import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './modules/user/schema/user.schema';
import { Post } from './modules/post/schema/post.schema';
import { Friendship } from './modules/friendship/schema/friend-request.schema';
import { Comment } from './modules/comment/schema/comment.schema';
import { Reaction } from './modules/reaction/schema/reaction.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel: Model<User> = app.get(getModelToken(User.name));
  const postModel: Model<Post> = app.get(getModelToken(Post.name));
  const friendshipModel: Model<Friendship> = app.get(
    getModelToken(Friendship.name),
  );
  const commentModel: Model<Comment> = app.get(getModelToken(Comment.name));
  const reactionModel: Model<Reaction> = app.get(getModelToken(Reaction.name));

  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('📦 Clearing existing data...');
  await userModel.deleteMany({});
  await postModel.deleteMany({});
  await friendshipModel.deleteMany({});
  await commentModel.deleteMany({});
  await reactionModel.deleteMany({});

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('passuser1', 10);

  // Create users
  console.log('👤 Creating users...');
  const users = await userModel.insertMany([
    {
      username: 'user1',
      email: 'user1@gmail.com',
      password: hashedPassword,
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      bio: 'Hey there! I am user1, passionate about technology and innovation. Love connecting with people! 🚀',
      isActive: true,
      friends: [],
      following: [],
      followers: [],
    },
    {
      username: 'user2',
      email: 'user2@gmail.com',
      password: hashedPassword,
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      bio: 'Travel enthusiast 🌍 | Photographer 📸 | Coffee lover ☕',
      isActive: true,
      friends: [],
      following: [],
      followers: [],
    },
    {
      username: 'user3',
      email: 'user3@gmail.com',
      password: hashedPassword,
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      bio: 'Software developer by day, gamer by night 🎮 | Always learning new things 💻',
      isActive: true,
      friends: [],
      following: [],
      followers: [],
    },
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create friendships (all users are friends with each other)
  console.log('🤝 Creating friendships...');
  const friendships = await friendshipModel.insertMany([
    {
      requesterId: users[0]._id,
      receiverId: users[1]._id,
      status: 'accepted',
    },
    {
      requesterId: users[0]._id,
      receiverId: users[2]._id,
      status: 'accepted',
    },
    {
      requesterId: users[1]._id,
      receiverId: users[2]._id,
      status: 'accepted',
    },
  ]);

  // Update user friends arrays
  await userModel.findByIdAndUpdate(users[0]._id, {
    friends: [users[1]._id, users[2]._id],
    following: [users[1]._id, users[2]._id],
    followers: [users[1]._id, users[2]._id],
  });

  await userModel.findByIdAndUpdate(users[1]._id, {
    friends: [users[0]._id, users[2]._id],
    following: [users[0]._id, users[2]._id],
    followers: [users[0]._id, users[2]._id],
  });

  await userModel.findByIdAndUpdate(users[2]._id, {
    friends: [users[0]._id, users[1]._id],
    following: [users[0]._id, users[1]._id],
    followers: [users[0]._id, users[1]._id],
  });

  console.log(`✅ Created ${friendships.length} friendships`);

  // Create posts
  console.log('📝 Creating posts...');
  const posts = await postModel.insertMany([
    // User 1 posts
    {
      authorId: users[0]._id,
      content:
        'Just launched my new project! Check it out 🚀 Excited to share this with you all. What do you think?',
      type: 'text',
      visibility: 'public',
      status: 'active',
      isDeleted: false,
      likeCount: 5,
      commentCount: 2,
    },
    {
      authorId: users[0]._id,
      content: 'Beautiful sunset today! Nature is amazing 🌅',
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
      ],
      type: 'image',
      visibility: 'public',
      status: 'active',
      isDeleted: false,
      likeCount: 12,
      commentCount: 4,
    },
    {
      authorId: users[0]._id,
      content: 'Working on something exciting! Stay tuned 👀',
      type: 'text',
      visibility: 'friends',
      status: 'active',
      isDeleted: false,
      likeCount: 3,
      commentCount: 1,
    },
    // User 2 posts
    {
      authorId: users[1]._id,
      content:
        'Exploring the mountains today! The view is breathtaking 🏔️ #Adventure #Nature',
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
        'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=500',
      ],
      type: 'image',
      visibility: 'public',
      status: 'active',
      isDeleted: false,
      likeCount: 15,
      commentCount: 6,
    },
    {
      authorId: users[1]._id,
      content:
        'Best coffee I have ever had! ☕ This little cafe in downtown is a hidden gem. Highly recommend!',
      type: 'text',
      visibility: 'public',
      status: 'active',
      isDeleted: false,
      likeCount: 8,
      commentCount: 3,
    },
    {
      authorId: users[1]._id,
      content: 'Weekend vibes 🌴 Time to relax and recharge!',
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500',
      ],
      type: 'image',
      visibility: 'friends',
      status: 'active',
      isDeleted: false,
      likeCount: 10,
      commentCount: 2,
    },
    // User 3 posts
    {
      authorId: users[2]._id,
      content:
        'Finally finished that challenging coding project! 💻 The feeling of accomplishment is unmatched. #CodeLife',
      type: 'text',
      visibility: 'public',
      status: 'active',
      isDeleted: false,
      likeCount: 20,
      commentCount: 8,
    },
    {
      authorId: users[2]._id,
      content:
        "Just reached level 50 in my favorite game! 🎮 Who's up for some co-op play tonight?",
      type: 'text',
      visibility: 'friends',
      status: 'active',
      isDeleted: false,
      likeCount: 6,
      commentCount: 5,
    },
    {
      authorId: users[2]._id,
      content:
        'New gaming setup complete! RGB lights and all 😎 Ready for marathon sessions',
      images: [
        'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500',
      ],
      type: 'image',
      visibility: 'public',
      status: 'active',
      isDeleted: false,
      likeCount: 18,
      commentCount: 7,
    },
    {
      authorId: users[2]._id,
      content:
        'Learning a new programming language this month. Any recommendations? 🤔',
      type: 'text',
      visibility: 'public',
      status: 'active',
      isDeleted: false,
      likeCount: 4,
      commentCount: 10,
    },
  ]);

  console.log(`✅ Created ${posts.length} posts`);

  // Create comments
  console.log('💬 Creating comments...');
  const comments = await commentModel.insertMany([
    // Comments on first post (user1's project)
    {
      postId: posts[0]._id,
      authorId: users[1]._id,
      content: 'This looks amazing! Congratulations! 🎉',
      isDeleted: false,
      likeCount: 2,
    },
    {
      postId: posts[0]._id,
      authorId: users[2]._id,
      content: 'Great work! Would love to know more about the tech stack.',
      isDeleted: false,
      likeCount: 1,
    },
    // Comments on sunset post
    {
      postId: posts[1]._id,
      authorId: users[1]._id,
      content: 'Stunning photo! Where was this taken?',
      isDeleted: false,
      likeCount: 3,
    },
    {
      postId: posts[1]._id,
      authorId: users[2]._id,
      content: 'Beautiful! 😍',
      isDeleted: false,
      likeCount: 2,
    },
    // Comments on mountain post
    {
      postId: posts[3]._id,
      authorId: users[0]._id,
      content: 'Wow! Which mountain is this?',
      isDeleted: false,
      likeCount: 1,
    },
    {
      postId: posts[3]._id,
      authorId: users[2]._id,
      content: 'Adding this to my bucket list! 🏔️',
      isDeleted: false,
      likeCount: 2,
    },
    // Comments on coffee post
    {
      postId: posts[4]._id,
      authorId: users[0]._id,
      content: "What's the name of the cafe? I need to check it out!",
      isDeleted: false,
      likeCount: 1,
    },
    {
      postId: posts[4]._id,
      authorId: users[2]._id,
      content: 'Coffee enthusiast here! Thanks for the recommendation ☕',
      isDeleted: false,
      likeCount: 1,
    },
    // Comments on coding project
    {
      postId: posts[6]._id,
      authorId: users[0]._id,
      content: 'Congrats! What was the project about?',
      isDeleted: false,
      likeCount: 2,
    },
    {
      postId: posts[6]._id,
      authorId: users[1]._id,
      content: 'Amazing dedication! 💪',
      isDeleted: false,
      likeCount: 1,
    },
    // Comments on gaming post
    {
      postId: posts[7]._id,
      authorId: users[0]._id,
      content: "I'm down for some co-op! Send me an invite 🎮",
      isDeleted: false,
      likeCount: 1,
    },
    {
      postId: posts[7]._id,
      authorId: users[1]._id,
      content: 'Level 50 already? You are on fire! 🔥',
      isDeleted: false,
      likeCount: 2,
    },
    // Comments on gaming setup
    {
      postId: posts[8]._id,
      authorId: users[0]._id,
      content: 'That setup looks sick! How much did it cost?',
      isDeleted: false,
      likeCount: 3,
    },
    {
      postId: posts[8]._id,
      authorId: users[1]._id,
      content: 'Those RGB lights are perfect! 🌈',
      isDeleted: false,
      likeCount: 2,
    },
    // Comments on programming language post
    {
      postId: posts[9]._id,
      authorId: users[0]._id,
      content: 'Try Rust! It has a bit of learning curve but totally worth it.',
      isDeleted: false,
      likeCount: 2,
    },
    {
      postId: posts[9]._id,
      authorId: users[1]._id,
      content: 'Go is great for backend development!',
      isDeleted: false,
      likeCount: 1,
    },
  ]);

  console.log(`✅ Created ${comments.length} comments`);

  // Create reactions
  console.log('❤️ Creating reactions...');
  const reactions = await reactionModel.insertMany([
    // Reactions on posts
    {
      userId: users[0]._id,
      target: { type: 'post', id: posts[3]._id },
      type: 'love',
    },
    {
      userId: users[1]._id,
      target: { type: 'post', id: posts[0]._id },
      type: 'like',
    },
    {
      userId: users[2]._id,
      target: { type: 'post', id: posts[0]._id },
      type: 'wow',
    },
    {
      userId: users[0]._id,
      target: { type: 'post', id: posts[6]._id },
      type: 'like',
    },
    {
      userId: users[1]._id,
      target: { type: 'post', id: posts[6]._id },
      type: 'like',
    },
    {
      userId: users[2]._id,
      target: { type: 'post', id: posts[1]._id },
      type: 'love',
    },
    {
      userId: users[0]._id,
      target: { type: 'post', id: posts[4]._id },
      type: 'like',
    },
    {
      userId: users[1]._id,
      target: { type: 'post', id: posts[8]._id },
      type: 'wow',
    },
    {
      userId: users[2]._id,
      target: { type: 'post', id: posts[8]._id },
      type: 'love',
    },
    // Reactions on comments
    {
      userId: users[0]._id,
      target: { type: 'comment', id: comments[0]._id },
      type: 'like',
    },
    {
      userId: users[1]._id,
      target: { type: 'comment', id: comments[1]._id },
      type: 'like',
    },
    {
      userId: users[2]._id,
      target: { type: 'comment', id: comments[2]._id },
      type: 'love',
    },
    {
      userId: users[0]._id,
      target: { type: 'comment', id: comments[8]._id },
      type: 'like',
    },
    {
      userId: users[1]._id,
      target: { type: 'comment', id: comments[10]._id },
      type: 'haha',
    },
  ]);

  console.log(`✅ Created ${reactions.length} reactions`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Friendships: ${friendships.length}`);
  console.log(`   - Posts: ${posts.length}`);
  console.log(`   - Comments: ${comments.length}`);
  console.log(`   - Reactions: ${reactions.length}`);
  console.log('\n👤 Test Users:');
  console.log('   - Email: user1@gmail.com | Password: passuser1');
  console.log('   - Email: user2@gmail.com | Password: passuser1');
  console.log('   - Email: user3@gmail.com | Password: passuser1');

  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('❌ Error seeding database:', error);
  process.exit(1);
});
