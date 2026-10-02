import { ProjectFileCategory, SessionUser, Tag, Video, Weblog, YoutubePreview } from './types';

export function apiUrl() {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:2201';
}

export function webUrl() {
  return import.meta.env.VITE_WEB_URL ?? 'http://localhost:2202';
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (typeof init?.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${apiUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join(', ');
      else if (body.message) message = body.message;
    } catch {
      message = response.statusText;
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  me: () => request<SessionUser>('/auth/me'),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  videos: () => request<Video[]>('/admin/videos'),
  video: (id: string) => request<Video>(`/admin/videos/${id}`),
  preview: (url: string) =>
    request<YoutubePreview>('/admin/videos/preview', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  create: (body: unknown) =>
    request<Video>('/admin/videos', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, body: unknown) =>
    request<Video>(`/admin/videos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    request<{ ok: boolean }>(`/admin/videos/${id}`, { method: 'DELETE' }),
  uploadFiles: (id: string, category: ProjectFileCategory, files: File[]) => {
    const body = new FormData();
    body.set('category', category);
    for (const file of files) {
      body.append('file', file);
    }
    return request<Video & { skipped: { name: string; reason: string }[] }>(
      `/admin/videos/${id}/files`,
      { method: 'POST', body },
    );
  },
  updateFile: (
    videoId: string,
    fileId: string,
    body: { name?: string; category?: ProjectFileCategory },
  ) =>
    request<Video>(`/admin/videos/${videoId}/files/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  removeFile: (videoId: string, fileId: string) =>
    request<Video>(`/admin/videos/${videoId}/files/${fileId}`, { method: 'DELETE' }),
  tags: () => request<Tag[]>('/admin/tags'),
  createTag: (name: string) =>
    request<Tag>('/admin/tags', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  updateTag: (id: string, name: string) =>
    request<Tag>(`/admin/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  removeTag: (id: string) =>
    request<{ ok: boolean }>(`/admin/tags/${id}`, { method: 'DELETE' }),
  weblogs: () => request<Weblog[]>('/admin/weblogs'),
  weblog: (id: string) => request<Weblog>(`/admin/weblogs/${id}`),
  createWeblog: (body: unknown) =>
    request<Weblog>('/admin/weblogs', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateWeblog: (id: string, body: unknown) =>
    request<Weblog>(`/admin/weblogs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  removeWeblog: (id: string) =>
    request<{ ok: boolean }>(`/admin/weblogs/${id}`, { method: 'DELETE' }),
  uploadWeblogImage: (file: File) => {
    const body = new FormData();
    body.set('image', file);
    return request<{ url: string }>('/admin/weblogs/images', { method: 'POST', body });
  },
};
