import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateBlockDto {
  @IsString()
  type: string;

  @IsObject()
  content: Record<string, unknown>;

  @IsNumber()
  position: number;

  @IsOptional()
  @IsString()
  parentBlockId?: string;
}
