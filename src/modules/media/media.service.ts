import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CloudinaryResult } from 'src/common/types';
import { MediaType, UploadMediaDto } from './dto/update-media.dto';
import { Media } from './schema/media.schema';
import { v2 } from 'cloudinary';
@Injectable()
export class MediaService {
  constructor(@InjectModel(Media.name) private mediaModel: Model<Media>) {}

  async upload(file: Express.Multer.File, userId: string, dto: UploadMediaDto) {
    const resourceType: 'image' | 'video' =
      dto.mediaType === MediaType.VIDEO ? 'video' : 'image';

    const result: CloudinaryResult & { [key: string]: any } = await new Promise(
      (resolve: (value: CloudinaryResult) => void, reject) => {
        v2.uploader
          .upload_stream(
            {
              resource_type: resourceType,
              folder: `social/${dto.targetType}/${userId}`,
            },
            (error: unknown, result: CloudinaryResult | undefined) => {
              if (error) {
                return reject(
                  error instanceof Error
                    ? error
                    : new Error('Cloudinary upload error'),
                );
              }
              if (result) {
                resolve(result);
              } else {
                reject(new Error('No result returned from Cloudinary upload.'));
              }
            },
          )
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          .end(file.buffer);
      },
    );

    return this.mediaModel.create({
      ownerId: userId,
      mediaType: dto.mediaType,
      url: result.secure_url,
      publicId: result.public_id,
      thumbnailUrl: result.thumbnail_url,
      targetType: dto.targetType,
      status: 'ready',
      metadata: {
        width: result.width ?? undefined,
        height: result.height ?? undefined,
        duration: result.duration ?? undefined,
        size: (file as unknown as { size?: number }).size ?? undefined,
      },
    });
  }

  async deleteMedia(mediaId: string) {
    const media = await this.mediaModel.findById(mediaId);
    if (!media) {
      throw new Error('Media not found');
    }

    if (media.publicId) {
      try {
        await v2.uploader.destroy(media.publicId, {
          resource_type: media.mediaType === 'video' ? 'video' : 'image',
        });
      } catch (error) {
        // Log Cloudinary deletion errors but continue to delete from DB
        // Consider using your application's logger here
        console.error('Cloudinary deletion error:', error);
      }
    }

    await media.deleteOne();
    return { success: true, message: 'Media deleted successfully.' };
  }
}
