import { stat, unlink } from 'fs/promises';
import { basename } from 'path';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { extractYoutubeId, slugify } from '../common/slug';
import { CreateWeblogDto, UpdateWeblogDto, WeblogBlockDto } from './dto/weblog.dto';
import { WeblogImageStorage } from './weblog-image';
import { RESERVED_ADDRESSES, Weblog, WeblogBlock, WeblogDocument } from './weblog.schema';

@Injectable()
export class WeblogsService {
  constructor(
    @InjectModel(Weblog.name) private readonly weblogs: Model<Weblog>,
    private readonly images: WeblogImageStorage,
    private readonly config: ConfigService,
  ) {}

  async listPublic() {
    const posts = await this.weblogs
      .find({ published: true })
      .sort({ updatedAt: -1 })
      .limit(200)
      .select('address title description mainImage updatedAt')
      .exec();
    return posts.map((post) => ({
      address: post.address,
      title: post.title,
      description: post.description,
      mainImage: post.mainImage,
      updatedAt: post.updatedAt.toISOString(),
    }));
  }

  async getPublicByAddress(address: string) {
    const post = await this.weblogs.findOne({ address, published: true }).exec();
    if (!post) {
      throw new NotFoundException('Weblog not found');
    }
    return this.present(post, true);
  }

  async openImage(filename: string) {
    const path = this.images.resolve(filename);
    try {
      const info = await stat(path);
      return {
        path,
        size: info.size,
        filename: basename(filename),
        contentType: this.images.contentType(filename),
      };
    } catch {
      throw new NotFoundException('Image not found');
    }
  }

  async listAdmin() {
    const posts = await this.weblogs.find().sort({ updatedAt: -1 }).limit(200).exec();
    return posts.map((post) => this.present(post, false));
  }

  async getAdmin(id: string) {
    const post = await this.weblogs.findById(id).exec();
    if (!post) {
      throw new NotFoundException('Weblog not found');
    }
    return this.present(post, true);
  }

  async saveImage(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Choose an image to upload');
    }
    const filename = basename(file.filename);
    if (!this.images.isStoredName(filename)) {
      await unlink(file.path).catch(() => undefined);
      throw new BadRequestException('Could not store that image');
    }
    return { url: this.mediaUrl(filename) };
  }

  async create(dto: CreateWeblogDto) {
    const address = await this.addressFor(dto.address, dto.title);
    try {
      const post = await this.weblogs.create({
        title: dto.title.trim(),
        address,
        description: dto.description.trim(),
        youtubeUrl: dto.youtubeUrl?.trim() ?? '',
        mainImage: dto.mainImage?.trim() ?? '',
        content: this.cleanBlocks(dto.content),
        published: dto.published,
      });
      return this.present(post, true);
    } catch (error) {
      if (this.isDuplicate(error)) {
        throw new ConflictException('That address is already used');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateWeblogDto) {
    const post = await this.weblogs.findById(id).exec();
    if (!post) {
      throw new NotFoundException('Weblog not found');
    }

    const before = this.referencedImages(post);
    if (dto.title !== undefined) post.title = dto.title.trim();
    if (dto.address !== undefined) {
      post.address = await this.addressFor(dto.address, post.title, post.id);
    }
    if (dto.description !== undefined) post.description = dto.description.trim();
    if (dto.youtubeUrl !== undefined) post.youtubeUrl = dto.youtubeUrl?.trim() ?? '';
    if (dto.mainImage !== undefined) post.mainImage = dto.mainImage?.trim() ?? '';
    if (dto.content) post.content = this.cleanBlocks(dto.content);
    if (dto.published !== undefined) post.published = dto.published;

    try {
      await post.save();
    } catch (error) {
      if (this.isDuplicate(error)) {
        throw new ConflictException('That address is already used');
      }
      throw error;
    }

    await this.forgetImages(before, this.referencedImages(post));
    return this.present(post, true);
  }

  async remove(id: string) {
    const post = await this.weblogs.findById(id).exec();
    if (!post) {
      throw new NotFoundException('Weblog not found');
    }
    const images = this.referencedImages(post);
    await post.deleteOne();
    await this.forgetImages(images, new Set());
    return { ok: true };
  }

  private async addressFor(input: string | undefined, title: string, currentId?: string) {
    const address = slugify((input?.trim() || title).trim());
    if (!address) {
      throw new BadRequestException('Address needs letters or numbers');
    }
    if (RESERVED_ADDRESSES.has(address)) {
      throw new BadRequestException('That address is already used by the site');
    }
    const clash = await this.weblogs
      .findOne({
        address,
        ...(currentId ? { _id: { $ne: currentId } } : {}),
      })
      .select('_id')
      .exec();
    if (clash) {
      throw new ConflictException('That address is already used');
    }
    return address;
  }

  private cleanBlocks(blocks: WeblogBlockDto[]): WeblogBlock[] {
    const cleaned: WeblogBlock[] = [];
    for (const block of blocks) {
      if (block.type === 'markdown') {
        const markdown = (block.markdown ?? '').replace(/\u0000/g, '');
        if (!markdown.trim()) {
          continue;
        }
        cleaned.push({ type: 'markdown', markdown, imageUrl: '', alt: '' });
        continue;
      }
      const imageUrl = block.imageUrl?.trim() ?? '';
      if (!imageUrl) {
        throw new BadRequestException('Each image row needs an image');
      }
      cleaned.push({
        type: 'image',
        markdown: '',
        imageUrl,
        alt: (block.alt ?? '').trim().slice(0, 300),
      });
    }
    return cleaned;
  }

  private mediaUrl(filename: string) {
    const base = (
      this.config.get<string>('API_PUBLIC_URL') ?? 'http://localhost:2201'
    ).replace(/\/$/, '');
    return `${base}/weblogs/media/${filename}`;
  }

  private filenameOf(url?: string) {
    if (!url) {
      return null;
    }
    try {
      const match = new URL(url).pathname.match(
        /\/weblogs\/media\/([a-f0-9-]{36}\.(?:jpg|jpeg|png|webp|gif))$/i,
      );
      return match ? match[1].toLowerCase() : null;
    } catch {
      return null;
    }
  }

  private referencedImages(post: { mainImage?: string; content?: WeblogBlock[] }) {
    const names = new Set<string>();
    const main = this.filenameOf(post.mainImage);
    if (main) {
      names.add(main);
    }
    for (const block of post.content ?? []) {
      const name = this.filenameOf(block.imageUrl);
      if (name) {
        names.add(name);
      }
    }
    return names;
  }

  private async forgetImages(before: Set<string>, after: Set<string>) {
    await Promise.all(
      [...before]
        .filter((name) => !after.has(name))
        .map((name) => this.images.remove(name)),
    );
  }

  private isDuplicate(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    );
  }

  private present(post: WeblogDocument, withContent: boolean) {
    const content = post.content ?? [];
    return {
      id: post.id as string,
      title: post.title,
      address: post.address,
      description: post.description,
      youtubeUrl: post.youtubeUrl,
      youtubeId: extractYoutubeId(post.youtubeUrl) ?? '',
      mainImage: post.mainImage,
      content: withContent
        ? content.map((block) => ({
            type: block.type,
            markdown: block.markdown ?? '',
            imageUrl: block.imageUrl ?? '',
            alt: block.alt ?? '',
          }))
        : [],
      contentCount: content.length,
      published: post.published,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}
