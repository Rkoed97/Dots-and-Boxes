import { IsIn, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username!: string;
}

export class PutThemeDto {
  @IsIn(['light', 'dark'])
  mode!: 'light' | 'dark';

  @IsString()
  accent!: string; // hex or css color string

  @IsIn(['classic', 'minimal'])
  boardStyle!: 'classic' | 'minimal';
}
