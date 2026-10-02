import { PassThrough } from 'stream';
import archiver from 'archiver';
import { attachmentDisposition } from './project-file';

export type ArchiveEntry = {
  path: string;
  name: string;
};

export function archiveHeaders(filename: string) {
  return {
    'Content-Type': 'application/zip',
    'Content-Disposition': attachmentDisposition(filename),
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
  };
}

export function createProjectArchive(entries: ArchiveEntry[]) {
  const output = new PassThrough();
  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', (error: Error) => {
    output.destroy(error);
  });
  archive.pipe(output);
  for (const entry of entries) {
    archive.file(entry.path, { name: entry.name });
  }
  void archive.finalize();
  return output;
}
