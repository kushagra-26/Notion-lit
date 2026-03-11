import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateJournalDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  mood?: string;
}

export class UpdateJournalDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  mood?: string;
}
