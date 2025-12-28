import { IsEnum, IsString } from 'class-validator';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
}

export enum TargetType {
  POST = 'post',
  COMMENT = 'comment',
  MESSAGE = 'message',
  AVATAR = 'avatar',
  COVER = 'cover',
  STORY = 'story',
}

export class UploadMediaDto {
  @IsEnum(MediaType)
  mediaType: MediaType;

  @IsEnum(TargetType)
  targetType: TargetType;

  @IsString()
  targetId: string;
}
