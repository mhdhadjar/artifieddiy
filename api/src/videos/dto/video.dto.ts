import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  PROJECT_FILE_CATEGORIES,
  ProjectFileCategory,
} from '../project-file';

export class AffiliateItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  url: string;

  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== '' && value != null)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CreateVideoDto {
  @Matches(/^[A-Za-z0-9_-]{11}$/)
  youtubeId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(20000)
  description: string;

  @IsUrl({ require_protocol: true, protocols: ['https'] })
  thumbnail: string;

  @IsISO8601()
  publishedAt: string;

  @IsString()
  @MaxLength(32)
  duration: string;

  @IsString()
  @MaxLength(200)
  channelTitle: string;

  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(80)
  slug?: string;

  @IsBoolean()
  published: boolean;

  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => AffiliateItemDto)
  tools: AffiliateItemDto[];

  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => AffiliateItemDto)
  materials: AffiliateItemDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ArrayUnique()
  @IsMongoId({ each: true })
  tagIds?: string[];
}

export class UpdateVideoDto extends PartialType(CreateVideoDto) {}

export class UploadProjectFileDto {
  @IsIn(PROJECT_FILE_CATEGORIES)
  category: ProjectFileCategory;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}

export class UpdateProjectFileDto {
  @IsOptional()
  @IsIn(PROJECT_FILE_CATEGORIES)
  category?: ProjectFileCategory;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;
}

export class PreviewVideoDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  url: string;
}
