import { copyFile, mkdir, rename, rm, unlink } from 'fs/promises';
import { basename, join, resolve, sep } from 'path';
import { Injectable, NotFoundException } from '@nestjs/common';
import { uploadRoot } from './project-file';

@Injectable()
export class ProjectFileStorage {
  videoDir(videoId: string) {
    if (!/^[a-f0-9]{24}$/i.test(videoId)) {
      throw new NotFoundException('File not found');
    }
    return join(uploadRoot(), 'videos', videoId);
  }

  resolve(videoId: string, storedName: string) {
    if (!/^[a-f0-9-]{36}\.[a-z0-9]{1,8}$/i.test(storedName)) {
      throw new NotFoundException('File not found');
    }
    const dir = resolve(this.videoDir(videoId));
    const path = resolve(dir, basename(storedName));
    if (!path.startsWith(dir + sep)) {
      throw new NotFoundException('File not found');
    }
    return path;
  }

  async moveIn(videoId: string, from: string, storedName: string) {
    const dir = this.videoDir(videoId);
    await mkdir(dir, { recursive: true });
    const dest = this.resolve(videoId, storedName);
    try {
      await rename(from, dest);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'EXDEV') {
        throw error;
      }
      await copyFile(from, dest);
      await unlink(from);
    }
    return dest;
  }

  async removeFile(videoId: string, storedName: string) {
    await unlink(this.resolve(videoId, storedName)).catch(() => undefined);
  }

  async removeVideo(videoId: string) {
    if (!/^[a-f0-9]{24}$/i.test(videoId)) {
      return;
    }
    await rm(this.videoDir(videoId), { recursive: true, force: true });
  }
}
