export function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size < 0) {
    return '';
  }
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

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function publicApi() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:2201';
}

export function adminAppUrl() {
  return process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:2203';
}
