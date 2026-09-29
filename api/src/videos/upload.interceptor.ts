import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { Request } from 'express';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable()
export class CleanupUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      catchError((error: unknown) => {
        const uploads = [
          ...(request.file ? [request.file] : []),
          ...(Array.isArray(request.files) ? request.files : []),
        ];
        for (const file of uploads) {
          if (file.path) {
            void unlink(file.path).catch(() => undefined);
          }
        }
        return throwError(() => error);
      }),
    );
  }
}
