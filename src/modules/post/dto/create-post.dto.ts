import { IsOptional, IsString, MaxLength, IsArray } from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  visibility?: 'public' | 'friends' | 'private';
}
