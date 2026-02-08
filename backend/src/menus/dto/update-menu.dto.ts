import { IsString, IsOptional, IsNumber, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMenuDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string;
}
