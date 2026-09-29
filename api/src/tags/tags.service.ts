import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { slugify } from '../common/slug';
import { Video } from '../videos/video.schema';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';
import { Tag, TagDocument } from './tag.schema';

@Injectable()
export class TagsService {
  constructor(
    @InjectModel(Tag.name) private readonly tags: Model<Tag>,
    @InjectModel(Video.name) private readonly videos: Model<Video>,
  ) {}

  async list() {
    const tags = await this.tags.find().sort({ name: 1 }).exec();
    return tags.map((tag) => this.present(tag));
  }

  async listPublic() {
    const used = await this.videos.distinct('tags', { published: true });
    if (used.length === 0) {
      return [];
    }
    const tags = await this.tags
      .find({ _id: { $in: used } })
      .sort({ name: 1 })
      .exec();
    return tags.map((tag) => this.present(tag));
  }

  async findBySlug(slug: string) {
    return this.tags.findOne({ slug }).exec();
  }

  async requireIds(ids: string[]) {
    const unique = [...new Set(ids)];
    if (unique.length === 0) {
      return [];
    }
    const found = await this.tags.find({ _id: { $in: unique } }).select('_id').exec();
    if (found.length !== unique.length) {
      throw new BadRequestException('One or more tags do not exist');
    }
    const allowed = new Set(found.map((tag) => tag.id));
    return unique
      .filter((id) => allowed.has(id))
      .map((id) => new Types.ObjectId(id));
  }

  async create(dto: CreateTagDto) {
    const name = dto.name.trim();
    const slug = this.slugFor(name);
    await this.assertSlugAvailable(slug);
    const tag = await this.tags.create({ name, slug });
    return this.present(tag);
  }

  async update(id: string, dto: UpdateTagDto) {
    const tag = await this.tags.findById(id).exec();
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    const name = dto.name.trim();
    const slug = this.slugFor(name);
    if (slug !== tag.slug) {
      await this.assertSlugAvailable(slug, tag.id);
    }
    tag.name = name;
    tag.slug = slug;
    await tag.save();
    return this.present(tag);
  }

  async remove(id: string) {
    const tag = await this.tags.findById(id).exec();
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    await this.videos.updateMany({ tags: tag._id }, { $pull: { tags: tag._id } });
    await tag.deleteOne();
    return { ok: true };
  }

  private slugFor(name: string) {
    const slug = slugify(name);
    if (!slug) {
      throw new BadRequestException('Tag name needs letters or numbers');
    }
    return slug;
  }

  private async assertSlugAvailable(slug: string, ignoreId?: string) {
    const query: Record<string, unknown> = { slug };
    if (ignoreId) {
      query._id = { $ne: ignoreId };
    }
    const existing = await this.tags.findOne(query).select('_id').exec();
    if (existing) {
      throw new ConflictException('A tag with this name already exists');
    }
  }

  private present(tag: TagDocument) {
    return {
      id: tag.id as string,
      name: tag.name,
      slug: tag.slug,
    };
  }
}
