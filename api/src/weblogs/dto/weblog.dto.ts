import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { WEBLOG_BLOCK_TYPES, WeblogBlockType } from '../weblog.schema';

const httpUrl = {
  require_protocol: true,
  require_tld: false,
  protocols: ['http', 'https'],
};

export class WeblogBlockDto {
  @IsIn(WEBLOG_BLOCK_TYPES)
  type: WeblogBlockType;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  markdown?: string;

  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== '' && value != null)
  @IsUrl(httpUrl)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  alt?: string;
}

export class CreateWeblogDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  address?: string;

  @IsString()
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== '' && value != null)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(500)
  youtubeUrl?: string;

  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== '' && value != null)
  @IsUrl(httpUrl)
  mainImage?: string;

  @IsArray()
  @ArrayMaxSize(80)
  @ValidateNested({ each: true })
  @Type(() => WeblogBlockDto)
  content: WeblogBlockDto[];

  @IsBoolean()
  published: boolean;
}

export class UpdateWeblogDto extends PartialType(CreateWeblogDto) {}
