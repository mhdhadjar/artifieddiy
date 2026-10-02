declare module 'archiver' {
  import { Transform } from 'stream';

  interface Archiver extends Transform {
    file(filepath: string, data: { name: string }): this;
    finalize(): Promise<void>;
    pointer(): number;
  }

  function archiver(format: 'zip', options?: { zlib?: { level?: number } }): Archiver;
  export = archiver;
}
