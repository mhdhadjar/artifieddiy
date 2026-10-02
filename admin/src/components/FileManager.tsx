import { DownloadSimpleIcon, TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { api, apiUrl } from '../api';
import { ProjectFile, ProjectFileCategory } from '../types';

const fileAccept = [
  '.stl', '.3mf', '.obj', '.step', '.stp', '.iges', '.igs', '.ply', '.amf',
  '.glb', '.gltf', '.dae', '.fbx', '.blend', '.3ds', '.wrl', '.x3d', '.scad',
  '.f3d', '.f3z', '.gcode', '.gco', '.gx', '.bgcode', '.ctb', '.lys', '.lyz',
  '.photon', '.sl1', '.pdf', '.svg', '.dxf', '.dwg', '.ai', '.eps', '.png',
  '.jpg', '.jpeg', '.webp', '.gif', '.zip', '.7z', '.rar', '.txt', '.csv',
  '.md', '.doc', '.docx', '.xls', '.xlsx',
].join(',');

const groups: {
  category: ProjectFileCategory;
  title: string;
  multiple: boolean;
  accept: string;
  empty: string;
}[] = [
  {
    category: 'tutorial',
    title: 'Tutorial',
    multiple: false,
    accept: '.pdf',
    empty: 'No tutorial yet. Upload one PDF.',
  },
  {
    category: 'model3d',
    title: '3D files',
    multiple: true,
    accept: fileAccept,
    empty: 'No files yet.',
  },
  {
    category: 'printing',
    title: 'Printing files',
    multiple: true,
    accept: fileAccept,
    empty: 'No files yet.',
  },
  {
    category: 'other',
    title: 'Other files',
    multiple: true,
    accept: fileAccept,
    empty: 'No files yet.',
  },
];

function formatBytes(size: number) {
  if (!Number.isFinite(size) || size < 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

export function FileManager({
  videoId,
  files,
  onChange,
}: {
  videoId?: string;
  files: ProjectFile[];
  onChange: (files: ProjectFile[]) => void;
}) {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');

  async function upload(category: ProjectFileCategory, list: FileList | null) {
    const selected = list ? [...list] : [];
    if (selected.length === 0 || !videoId) return;
    setError('');
    setNotice('');
    setBusy(category);
    try {
      const video = await api.uploadFiles(videoId, category, selected);
      onChange(video.files);
      setNotice(skippedMessage(video.skipped ?? []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload those files');
    } finally {
      setBusy('');
    }
  }

  async function rename(fileId: string, name: string) {
    if (!videoId) return;
    setError('');
    setBusy(fileId);
    try {
      const video = await api.updateFile(videoId, fileId, { name });
      onChange(video.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename that file');
    } finally {
      setBusy('');
    }
  }

  async function move(fileId: string, category: ProjectFileCategory) {
    if (!videoId) return;
    setError('');
    setBusy(fileId);
    try {
      const video = await api.updateFile(videoId, fileId, { category });
      onChange(video.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not move that file');
    } finally {
      setBusy('');
    }
  }

  async function remove(file: ProjectFile) {
    if (!videoId || !window.confirm(`Remove ${file.name}?`)) return;
    setError('');
    setBusy(file.id);
    try {
      const video = await api.removeFile(videoId, file.id);
      onChange(video.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove that file');
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
      <h2 className="font-medium">Project files</h2>
      <p className="mt-1 text-sm text-muted dark:text-muted-dark">
        Optional. Select one or more files. Identical files are skipped. Empty categories stay hidden on the website. Up to 100 MB each.
      </p>
      {!videoId ? (
        <p className="mt-3 text-sm text-muted dark:text-muted-dark">
          Save the video first, then upload a tutorial PDF, 3D files, printing files, or other files.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {groups.map((group) => {
            const listed = files.filter((file) => file.category === group.category);
            return (
              <div key={group.category} className="rounded-xl bg-panel p-3 dark:bg-panel-dark">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium">{group.title}</h3>
                  <div className="flex items-center gap-3">
                    {listed.length > 1 ? (
                      <a
                        href={`${apiUrl()}/admin/videos/${videoId}/files/archive/${encodeURIComponent(group.category)}`}
                        aria-label={`Download all ${group.title}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-yt"
                      >
                        <DownloadSimpleIcon size={16} />
                        Download all
                      </a>
                    ) : null}
                    <label
                      className={`inline-flex items-center gap-1 text-sm font-medium text-yt ${
                        busy ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      }`}
                    >
                      <UploadSimpleIcon size={16} />
                      {!group.multiple && listed.length > 0 ? 'Replace' : 'Upload'}
                      <input
                        type="file"
                        accept={group.accept}
                        multiple={group.multiple}
                        className="hidden"
                        disabled={Boolean(busy)}
                        onChange={(event) => {
                          const list = event.target.files;
                          event.target.value = '';
                          void upload(group.category, list);
                        }}
                      />
                    </label>
                  </div>
                </div>
                {listed.length === 0 ? (
                  <p className="mt-3 text-sm text-muted dark:text-muted-dark">{group.empty}</p>
                ) : (
                  <ul className="mt-3 grid gap-2">
                    {listed.map((file) => (
                      <FileRow
                        key={file.id}
                        videoId={videoId}
                        file={file}
                        movable={group.multiple}
                        disabled={Boolean(busy)}
                        onRename={(name) => void rename(file.id, name)}
                        onMove={(category) => void move(file.id, category)}
                        onRemove={() => void remove(file)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
      {notice ? <p className="mt-3 text-sm text-muted dark:text-muted-dark">{notice}</p> : null}
      {error ? <p className="mt-3 text-sm text-yt">{error}</p> : null}
    </section>
  );
}

function skippedMessage(items: { name: string; reason: string }[]) {
  if (items.length === 0) return '';
  const labels: Record<string, string> = {
    duplicate: 'already uploaded',
    unsupported: 'not a supported file type',
    empty: 'empty',
    limit: 'over the 40 file limit',
    single: 'only one tutorial PDF is kept',
  };
  return items
    .map((item) => `${item.name} skipped (${labels[item.reason] ?? item.reason})`)
    .join('. ');
}

function FileRow({
  videoId,
  file,
  movable,
  disabled,
  onRename,
  onMove,
  onRemove,
}: {
  videoId: string;
  file: ProjectFile;
  movable: boolean;
  disabled: boolean;
  onRename: (name: string) => void;
  onMove: (category: ProjectFileCategory) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(file.name);

  useEffect(() => {
    setName(file.name);
  }, [file.name]);

  return (
    <li className={`grid gap-2 sm:items-center ${movable ? 'sm:grid-cols-[1fr_auto_auto]' : 'sm:grid-cols-[1fr_auto]'}`}>
      <input
        value={name}
        disabled={disabled}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => {
          const next = name.trim();
          if (!next || next === file.name) {
            setName(file.name);
            return;
          }
          onRename(next);
        }}
        className="field"
        aria-label="File name"
      />
      {movable ? (
        <select
          value={file.category}
          disabled={disabled}
          onChange={(event) => onMove(event.target.value as ProjectFileCategory)}
          className="field sm:w-40"
          aria-label="File category"
        >
          {groups
            .filter((group) => group.multiple)
            .map((group) => (
              <option key={group.category} value={group.category}>
                {group.title}
              </option>
            ))}
        </select>
      ) : null}
      <div className="flex items-center gap-3 text-sm text-muted dark:text-muted-dark">
        <span className="tabular-nums">{formatBytes(file.size)}</span>
        <a
          href={`${apiUrl()}/admin/videos/${videoId}/files/${file.id}`}
          className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-white"
        >
          <DownloadSimpleIcon size={16} />
          Download
        </a>
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="inline-flex items-center gap-1 hover:text-yt disabled:opacity-50"
        >
          <TrashIcon size={16} />
          Remove
        </button>
      </div>
    </li>
  );
}
