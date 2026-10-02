import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { basename, join, resolve, sep } from 'path';
import {
  ArgumentsHost,
  CallHandler,
  Catch,
  ExceptionFilter,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { diskStorage, MulterError } from 'multer';
import { fileExtension, uploadRoot } from '../videos/project-file';

export const MAX_WEBLOG_IMAGE_BYTES = 8 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const IMAGE_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const STORED_NAME =
  /^[a-f0-9-]{36}\.(?:jpg|jpeg|png|webp|gif)$/i;

@Injectable()
export class WeblogImageStorage {
  dir() {
    return join(uploadRoot(), 'weblogs');
  }

  isStoredName(filename: string) {
    return STORED_NAME.test(filename);
  }

  resolve(filename: string) {
    if (!this.isStoredName(filename)) {
      throw new NotFoundException('Image not found');
    }
    const dir = resolve(this.dir());
    const path = resolve(dir, basename(filename));
    if (!path.startsWith(dir + sep)) {
      throw new NotFoundException('Image not found');
    }
    return path;
  }

  contentType(filename: string) {
    return IMAGE_TYPES[fileExtension(filename)] ?? 'application/octet-stream';
  }

  async remove(filename: string) {
    await unlink(this.resolve(filename)).catch(() => undefined);
  }
}

export function weblogImageUploadOptions() {
  return {
    storage: diskStorage({
      destination: (
        _req: Request,
        _file: Express.Multer.File,
        callback: (error: Error | null, destination: string) => void,
      ) => {
        const dir = join(uploadRoot(), 'weblogs');
        mkdirSync(dir, { recursive: true });
        callback(null, dir);
      },
      filename: (
        _req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void,
      ) => {
        callback(null, `${randomUUID()}${fileExtension(file.originalname)}`);
      },
    }),
    limits: { fileSize: MAX_WEBLOG_IMAGE_BYTES, files: 1 },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, accept: boolean) => void,
    ) => {
      const extension = fileExtension(file.originalname);
      const mimeOk = file.mimetype.startsWith('image/');
      if (!IMAGE_EXTENSIONS.has(extension) || !mimeOk) {
        callback(new Error('IMAGE_TYPE'), false);
        return;
      }
      callback(null, true);
    },
  };
}

@Injectable()
export class CleanupWeblogUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      catchError((error: unknown) => {
        if (request.file?.path) {
          void unlink(request.file.path).catch(() => undefined);
        }
        return throwError(() => error);
      }),
    );
  }
}

@Catch()
export class WeblogImageExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (error instanceof MulterError && error.code === 'LIMIT_FILE_SIZE') {
      response.status(400).json({
        statusCode: 400,
        message: 'Image must be 8 MB or smaller',
      });
      return;
    }
    if (error instanceof Error && error.message === 'IMAGE_TYPE') {
      response.status(400).json({
        statusCode: 400,
        message: 'Upload a JPG, PNG, WEBP, or GIF image',
      });
      return;
    }
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const body = error.getResponse();
      response
        .status(status)
        .json(typeof body === 'string' ? { statusCode: status, message: body } : body);
      return;
    }
    response.status(400).json({
      statusCode: 400,
      message: 'Could not upload that image',
    });
  }
}
