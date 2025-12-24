import { IsIn, IsMongoId } from 'class-validator';

export class ReactDto {
  @IsIn(['post', 'comment'])
  targetType: 'post' | 'comment';

  @IsMongoId()
  targetId: string;

  @IsIn(['like', 'love', 'haha', 'wow', 'sad', 'angry'])
  type: string;
}
