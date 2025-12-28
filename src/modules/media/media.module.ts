import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryProvider } from 'src/config/cloudinary.config';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Media, MediaSchema } from './schema/media.schema';
import { CLOUDINARY } from 'src/common/constants';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
  ],
  providers: [MediaService, CloudinaryProvider],
  controllers: [MediaController],
  exports: [CLOUDINARY],
})
export class MediaModule {}
