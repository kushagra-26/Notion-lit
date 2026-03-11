import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateBlockDto {
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsString()
  type?: string;
}

export class ReorderBlockDto {
  @IsString()
  id: string;

  @IsNumber()
  position: number;
}
