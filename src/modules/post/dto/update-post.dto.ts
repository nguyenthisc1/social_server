import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsEnum(['public', 'friends', 'private'])
  visibility?: 'public' | 'friends' | 'private';

  @IsOptional()
  @IsEnum(['text', 'image', 'share'])
  type?: 'text' | 'image' | 'share';

  @IsOptional()
  @IsString()
  sharedPostId?: string;
}
