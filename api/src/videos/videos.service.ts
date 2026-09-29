import { randomUUID } from 'crypto';
import { access, unlink } from 'fs/promises';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { slugify, watchUrl } from '../common/slug';
import { TagsService } from '../tags/tags.service';
import {
  AffiliateItemDto,
  CreateVideoDto,
  UpdateProjectFileDto,
  UpdateVideoDto,
  UploadProjectFileDto,
} from './dto/video.dto';
import {
  MAX_PROJECT_FILES,
  SkippedProjectFile,
  assertAllowedExtension,
  displayNameFromUpload,
  downloadFilename,
  fileExtension,
  md5File,
} from './project-file';
import { ProjectFileStorage } from './project-file.storage';
import { ProjectFile, Video, VideoDocument } from './video.schema';

@Injectable()
export class VideosService {
  constructor(
    @InjectModel(Video.name) private readonly videos: Model<Video>,
    private readonly tags: TagsService,
    private readonly storage: ProjectFileStorage,
  ) {}

  async listPublic(tag?: string) {
    const filter: Record<string, unknown> = { published: true };
    const slug = tag?.trim();
    if (slug) {
      const match = await this.tags.findBySlug(slug);
      if (!match) {
        return [];
      }
      filter.tags = match._id;
    }
    const videos = await this.videos
      .find(filter)
      .sort({ publishedAt: -1 })
      .limit(100)
      .populate('tags')
      .exec();
    return videos.map((video) => this.present(video));
  }

  async getPublicBySlug(slug: string) {
    const video = await this.videos
      .findOne({ slug, published: true })
      .populate('tags')
      .exec();
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    return this.present(video);
  }

  async listAdmin() {
    const videos = await this.videos
      .find()
      .sort({ updatedAt: -1 })
      .limit(200)
      .populate('tags')
      .exec();
    return videos.map((video) => this.present(video));
  }

  async getAdmin(id: string) {
    const video = await this.videos.findById(id).populate('tags').exec();
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    await this.removeDuplicateFiles(video);
    return this.present(video);
  }

  async create(dto: CreateVideoDto) {
    const existing = await this.videos
      .findOne({ youtubeId: dto.youtubeId })
      .exec();
    if (existing) {
      throw new ConflictException('This YouTube video is already added');
    }

    const video = await this.videos.create({
      youtubeId: dto.youtubeId,
      url: watchUrl(dto.youtubeId),
      slug: await this.uniqueSlug(dto.slug || dto.title, dto.youtubeId),
      title: dto.title.trim(),
      description: dto.description,
      thumbnail: dto.thumbnail,
      publishedAt: new Date(dto.publishedAt),
      duration: dto.duration,
      channelTitle: dto.channelTitle,
      tools: this.cleanItems(dto.tools),
      materials: this.cleanItems(dto.materials),
      tags: await this.tags.requireIds(dto.tagIds ?? []),
      files: [],
      published: dto.published,
    });
    await video.populate('tags');
    return this.present(video);
  }

  async update(id: string, dto: UpdateVideoDto) {
    const video = await this.videos.findById(id).exec();
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (dto.youtubeId && dto.youtubeId !== video.youtubeId) {
      const clash = await this.videos
        .findOne({ youtubeId: dto.youtubeId, _id: { $ne: video._id } })
        .exec();
      if (clash) {
        throw new ConflictException('This YouTube video is already added');
      }
      video.youtubeId = dto.youtubeId;
      video.url = watchUrl(dto.youtubeId);
    }

    if (dto.title !== undefined) video.title = dto.title.trim();
    if (dto.description !== undefined) video.description = dto.description;
    if (dto.thumbnail !== undefined) video.thumbnail = dto.thumbnail;
    if (dto.publishedAt !== undefined) video.publishedAt = new Date(dto.publishedAt);
    if (dto.duration !== undefined) video.duration = dto.duration;
    if (dto.channelTitle !== undefined) video.channelTitle = dto.channelTitle;
    if (dto.published !== undefined) video.published = dto.published;
    if (dto.tools) video.tools = this.cleanItems(dto.tools);
    if (dto.materials) video.materials = this.cleanItems(dto.materials);
    if (dto.tagIds !== undefined) {
      video.tags = await this.tags.requireIds(dto.tagIds);
    }
    if (dto.slug) {
      video.slug = await this.uniqueSlug(dto.slug, video.youtubeId, video.id);
    }

    await video.save();
    await video.populate('tags');
    return this.present(video);
  }

  async remove(id: string) {
    const video = await this.videos.findById(id).exec();
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    await this.storage.removeVideo(video.id);
    await video.deleteOne();
    return { ok: true };
  }

  async addFiles(
    id: string,
    uploads: Express.Multer.File[],
    dto: UploadProjectFileDto,
    rejected: string[] = [],
  ) {
    if (uploads.length === 0 && rejected.length === 0) {
      throw new BadRequestException('Choose a file to upload');
    }

    const video = await this.videos.findById(id).exec();
    if (!video) {
      await Promise.all(uploads.map((upload) => unlink(upload.path).catch(() => undefined)));
      throw new NotFoundException('Video not found');
    }

    if (!video.files) {
      video.files = [];
    }
    await this.removeDuplicateFiles(video);
    const seen = new Set(
      video.files.flatMap((file) => (file.checksum ? [file.checksum] : [])),
    );
    const skipped: SkippedProjectFile[] = rejected.map((name) => ({
      name,
      reason: 'unsupported',
    }));
    const stored: string[] = [];
    const replaced: string[] = [];
    let tutorialAdded = false;

    try {
      for (const upload of uploads) {
        const name = displayNameFromUpload(upload.originalname, dto.name);
        if (!upload.size) {
          await unlink(upload.path).catch(() => undefined);
          skipped.push({ name, reason: 'empty' });
          continue;
        }
        if (dto.category === 'tutorial' && fileExtension(upload.originalname) !== '.pdf') {
          await unlink(upload.path).catch(() => undefined);
          skipped.push({ name, reason: 'unsupported' });
          continue;
        }
        if (dto.category === 'tutorial' && tutorialAdded) {
          await unlink(upload.path).catch(() => undefined);
          skipped.push({ name, reason: 'single' });
          continue;
        }
        const checksum = await md5File(upload.path);
        if (seen.has(checksum)) {
          await unlink(upload.path).catch(() => undefined);
          skipped.push({ name, reason: 'duplicate' });
          continue;
        }
        const replacedCount =
          dto.category === 'tutorial'
            ? video.files.filter((file) => file.category === 'tutorial').length
            : 0;
        if (video.files.length - replacedCount >= MAX_PROJECT_FILES) {
          await unlink(upload.path).catch(() => undefined);
          skipped.push({ name, reason: 'limit' });
          continue;
        }
        if (dto.category === 'tutorial') {
          for (let index = video.files.length - 1; index >= 0; index -= 1) {
            const current = video.files[index];
            if (current.category !== 'tutorial') continue;
            if (current.checksum) seen.delete(current.checksum);
            replaced.push(current.storedName);
            video.files.splice(index, 1);
          }
        }
        const extension = assertAllowedExtension(upload.originalname);
        const storedName = `${randomUUID()}${extension}`;
        await this.storage.moveIn(video.id, upload.path, storedName);
        stored.push(storedName);
        seen.add(checksum);
        if (dto.category === 'tutorial') tutorialAdded = true;
        video.files.push({
          category: dto.category,
          name,
          storedName,
          size: upload.size,
          mimeType: upload.mimetype || 'application/octet-stream',
          checksum,
        });
      }
      if (stored.length > 0) {
        video.markModified('files');
        await video.save();
        await Promise.all(replaced.map((name) => this.storage.removeFile(video.id, name)));
      }
    } catch (error) {
      await Promise.all(stored.map((name) => this.storage.removeFile(video.id, name)));
      await Promise.all(uploads.map((upload) => unlink(upload.path).catch(() => undefined)));
      throw error;
    }

    await video.populate('tags');
    return { ...this.present(video), skipped };
  }

  async updateFile(id: string, fileId: string, dto: UpdateProjectFileDto) {
    if (dto.name === undefined && dto.category === undefined) {
      throw new BadRequestException('Nothing to update');
    }
    const video = await this.requireVideo(id);
    const file = this.findFile(video, fileId);
    if (dto.name !== undefined) {
      const name = dto.name
        .replace(/[\u0000-\u001f]/g, '')
        .replace(/[/\\]/g, '')
        .trim()
        .slice(0, 200);
      if (!name) {
        throw new BadRequestException('File name is required');
      }
      file.name = name;
    }
    if (dto.category !== undefined) {
      if (dto.category === 'tutorial' && fileExtension(file.storedName) !== '.pdf') {
        throw new BadRequestException('The tutorial must be a PDF');
      }
      if (dto.category === 'tutorial') {
        const taken = video.files.some(
          (item) => item.category === 'tutorial' && this.fileId(item) !== fileId,
        );
        if (taken) {
          throw new BadRequestException('This video already has a tutorial PDF');
        }
      }
      file.category = dto.category;
    }
    video.markModified('files');
    await video.save();
    await video.populate('tags');
    return this.present(video);
  }

  async removeFile(id: string, fileId: string) {
    const video = await this.requireVideo(id);
    const file = this.findFile(video, fileId);
    await this.storage.removeFile(video.id, file.storedName);
    const index = video.files.findIndex((item) => this.fileId(item) === fileId);
    video.files.splice(index, 1);
    video.markModified('files');
    await video.save();
    await video.populate('tags');
    return this.present(video);
  }

  async openAdminFile(id: string, fileId: string) {
    return this.openFile(await this.videos.findById(id).exec(), fileId);
  }

  async openPublicFile(slug: string, fileId: string) {
    return this.openFile(
      await this.videos.findOne({ slug, published: true }).exec(),
      fileId,
    );
  }

  private cleanItems(items: AffiliateItemDto[]) {
    return items.map((item) => ({
      name: item.name.trim(),
      url: item.url.trim(),
      ...(item.imageUrl?.trim() ? { imageUrl: item.imageUrl.trim() } : {}),
      ...(item.note?.trim() ? { note: item.note.trim() } : {}),
    }));
  }

  private async uniqueSlug(
    source: string,
    youtubeId: string,
    ignoreId?: string,
  ): Promise<string> {
    const base = slugify(source) || youtubeId.toLowerCase().replace(/_/g, '-');
    let slug = base;
    for (let attempt = 1; attempt <= 20; attempt += 1) {
      const query: Record<string, unknown> = { slug };
      if (ignoreId) {
        query._id = { $ne: ignoreId };
      }
      const existing = await this.videos.findOne(query).select('_id').exec();
      if (!existing) {
        return slug;
      }
      slug = `${base}-${attempt}`;
    }
    return `${base}-${youtubeId.toLowerCase()}`;
  }

  private async removeDuplicateFiles(video: VideoDocument) {
    if (!video.files?.length) {
      return;
    }
    const seen = new Set<string>();
    const removeAt: number[] = [];
    let changed = false;
    for (let index = 0; index < video.files.length; index += 1) {
      const file = video.files[index];
      if (!file.checksum) {
        try {
          file.checksum = await md5File(this.storage.resolve(video.id, file.storedName));
          changed = true;
        } catch {
          continue;
        }
      }
      if (seen.has(file.checksum)) {
        removeAt.push(index);
        continue;
      }
      seen.add(file.checksum);
    }
    for (const index of removeAt.reverse()) {
      const file = video.files[index];
      await this.storage.removeFile(video.id, file.storedName);
      video.files.splice(index, 1);
      changed = true;
    }
    if (changed) {
      video.markModified('files');
      await video.save();
    }
  }

  private async requireVideo(id: string) {
    const video = await this.videos.findById(id).exec();
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    return video;
  }

  private fileId(file: ProjectFile) {
    return String((file as ProjectFile & { id?: string }).id ?? '');
  }

  private findFile(video: VideoDocument, fileId: string) {
    if (!/^[a-f0-9]{24}$/i.test(fileId)) {
      throw new NotFoundException('File not found');
    }
    const file = video.files.find((item) => this.fileId(item) === fileId);
    if (!file?.storedName) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  private async openFile(video: VideoDocument | null, fileId: string) {
    if (!video) {
      throw new NotFoundException('File not found');
    }
    const file = this.findFile(video, fileId);
    const path = this.storage.resolve(video.id, file.storedName);
    try {
      await access(path);
    } catch {
      throw new NotFoundException('File not found');
    }
    return {
      path,
      size: file.size,
      filename: downloadFilename(file.name, file.storedName),
    };
  }

  private presentFiles(files: ProjectFile[] | undefined) {
    return (files ?? []).flatMap((file) => {
      const id = this.fileId(file);
      if (!id) {
        return [];
      }
      return [
        {
          id,
          category: file.category,
          name: file.name,
          size: file.size,
          extension: fileExtension(file.storedName).replace('.', ''),
        },
      ];
    });
  }

  private presentTags(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.flatMap((tag) => {
      if (!tag || typeof tag !== 'object') {
        return [];
      }
      const doc = tag as { id?: string; name?: string; slug?: string };
      if (!doc.id || !doc.name || !doc.slug) {
        return [];
      }
      return [{ id: doc.id, name: doc.name, slug: doc.slug }];
    });
  }

  private present(video: VideoDocument) {
    return {
      id: video.id as string,
      youtubeId: video.youtubeId,
      url: video.url,
      slug: video.slug,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      publishedAt: video.publishedAt.toISOString(),
      duration: video.duration,
      channelTitle: video.channelTitle,
      tools: video.tools.map((item) => ({
        name: item.name,
        url: item.url,
        imageUrl: item.imageUrl ?? '',
        note: item.note ?? '',
      })),
      materials: video.materials.map((item) => ({
        name: item.name,
        url: item.url,
        imageUrl: item.imageUrl ?? '',
        note: item.note ?? '',
      })),
      tags: this.presentTags(video.tags),
      files: this.presentFiles(video.files),
      published: video.published,
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
    };
  }
}
