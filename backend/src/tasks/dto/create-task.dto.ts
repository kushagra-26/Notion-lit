import {
  IsDateString, IsIn, IsOptional, IsString, MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsIn(['todo', 'in_progress', 'done', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
