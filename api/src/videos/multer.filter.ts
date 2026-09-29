import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';
import { MAX_PROJECT_FILES } from './project-file';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(error: MulterError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Each file must be 100 MB or smaller'
        : error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE'
          ? `Select up to ${MAX_PROJECT_FILES} files at a time`
          : 'Could not upload that file';
    response.status(400).json({ statusCode: 400, message });
  }
}
