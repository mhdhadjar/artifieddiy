import { createHash, randomUUID } from 'crypto';
import { createReadStream, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import type { Request } from 'express';

export const PROJECT_FILE_CATEGORIES = ['tutorial', 'model3d', 'printing', 'other'] as const;
export type ProjectFileCategory = (typeof PROJECT_FILE_CATEGORIES)[number];

export const MAX_PROJECT_FILES = 40;
export const MAX_PROJECT_FILE_BYTES = 100 * 1024 * 1024;

export const ALLOWED_EXTENSIONS = new Set([
  '.stl',
  '.3mf',
  '.obj',
  '.step',
  '.stp',
  '.iges',
  '.igs',
  '.ply',
  '.amf',
  '.glb',
  '.gltf',
  '.dae',
  '.fbx',
  '.blend',
  '.3ds',
  '.wrl',
  '.x3d',
  '.scad',
  '.f3d',
  '.f3z',
  '.gcode',
  '.gco',
  '.gx',
  '.bgcode',
  '.ctb',
  '.lys',
  '.lyz',
  '.photon',
  '.sl1',
  '.pdf',
  '.svg',
  '.dxf',
  '.dwg',
  '.ai',
  '.eps',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.zip',
  '.7z',
  '.rar',
  '.txt',
  '.csv',
  '.md',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
]);

export type SkippedProjectFile = {
  name: string;
  reason: 'duplicate' | 'unsupported' | 'empty' | 'limit' | 'single';
};

export type UploadRequest = Request & {
  rejectedFiles?: string[];
};

export function md5File(path: string) {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash('md5');
    const stream = createReadStream(path);
    stream.on('error', reject);
    hash.on('error', reject);
    stream.pipe(hash);
    hash.on('finish', () => resolve(hash.digest('hex')));
  });
}

export function uploadRoot() {
  return process.env.UPLOAD_DIR?.trim() || join(process.cwd(), 'uploads');
}

export function fileExtension(filename: string) {
  return extname(filename).toLowerCase();
}

export function assertAllowedExtension(filename: string) {
  const extension = fileExtension(filename);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new BadRequestException(
      extension
        ? `${extension} files are not supported`
        : 'This file needs a supported extension',
    );
  }
  return extension;
}

export function displayNameFromUpload(originalName: string, override?: string) {
  const source = (override?.trim() || originalName).replace(/[\u0000-\u001f]/g, '');
  const base = source.split(/[/\\]/).pop()?.trim() ?? '';
  const name = base.slice(0, 200);
  if (!name || name === '.' || name === '..') {
    return 'file';
  }
  return name;
}

export function downloadFilename(name: string, storedName: string) {
  const extension = fileExtension(storedName);
  const base = name.replace(/[\u0000-\u001f]/g, '').trim() || 'download';
  if (base.toLowerCase().endsWith(extension)) {
    return base;
  }
  return `${base}${extension}`;
}

export function attachmentDisposition(filename: string) {
  const cleaned = filename.replace(/[\r\n"]/g, '').trim() || 'download';
  const ascii = cleaned.replace(/[^\x20-\x7E]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(cleaned)}`;
}

export function isProjectFileCategory(value: string): value is ProjectFileCategory {
  return (PROJECT_FILE_CATEGORIES as readonly string[]).includes(value);
}

const ARCHIVE_LABELS: Record<ProjectFileCategory, string> = {
  tutorial: 'tutorial',
  model3d: '3d-files',
  printing: 'printing-files',
  other: 'other-files',
};

export function categoryArchiveFilename(slug: string, category: ProjectFileCategory) {
  const safeSlug = slug.replace(/[^\w.-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '') || 'project';
  return `${safeSlug}-${ARCHIVE_LABELS[category]}.zip`;
}

export function uniqueArchiveEntryName(filename: string, used: Set<string>) {
  const cleaned =
    filename.replace(/[\\/]/g, '_').replace(/[\u0000-\u001f]/g, '').trim() || 'file';
  const extension = fileExtension(cleaned);
  const stem = (extension ? cleaned.slice(0, -extension.length) : cleaned) || 'file';
  let candidate = cleaned;
  let index = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${stem}-${index}${extension}`;
    index += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export function projectFileUploadOptions() {
  return {
    storage: diskStorage({
      destination: (
        _req: Request,
        _file: Express.Multer.File,
        callback: (error: Error | null, destination: string) => void,
      ) => {
        const dir = join(uploadRoot(), 'incoming');
        mkdirSync(dir, { recursive: true });
        callback(null, dir);
      },
      filename: (
        _req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void,
      ) => {
        const extension = fileExtension(file.originalname);
        callback(null, `${randomUUID()}${extension}`);
      },
    }),
    limits: { fileSize: MAX_PROJECT_FILE_BYTES, files: MAX_PROJECT_FILES },
    fileFilter: (
      req: UploadRequest,
      file: Express.Multer.File,
      callback: (error: Error | null, accept: boolean) => void,
    ) => {
      const extension = fileExtension(file.originalname);
      if (!ALLOWED_EXTENSIONS.has(extension)) {
        const rejected = req.rejectedFiles ?? [];
        rejected.push(displayNameFromUpload(file.originalname));
        req.rejectedFiles = rejected;
        callback(null, false);
        return;
      }
      callback(null, true);
    },
  };
}
