import { ExtractedMedia, FormattedStream, DownloadHistoryItem, PlatformMeta } from './formatters';

const API_BASE = '/api';

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to reach backend engine');
  return res.json();
}

export async function fetchPlatforms(): Promise<PlatformMeta[]> {
  const res = await fetch(`${API_BASE}/platforms`);
  if (!res.ok) throw new Error('Failed to fetch platform list');
  const json = await res.json();
  return json.platforms;
}

export async function extractMedia(url: string, cookies?: string): Promise<ExtractedMedia> {
  const res = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, cookies }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to extract media');
  }

  return json.data;
}

export function buildStreamUrl(
  webpageUrl: string,
  stream: FormattedStream,
  title: string,
  startTime?: string,
  endTime?: string
): string {
  const params = new URLSearchParams({
    url: webpageUrl,
    format_id: stream.formatId,
    type: stream.type,
    ext: stream.ext,
    title,
  });
  if (startTime && startTime.trim()) params.append('start_time', startTime.trim());
  if (endTime && endTime.trim()) params.append('end_time', endTime.trim());
  return `${API_BASE}/stream?${params.toString()}`;
}

export function buildThumbnailUrl(thumbnailUrl: string, title: string): string {
  const params = new URLSearchParams({
    url: thumbnailUrl,
    title,
  });
  return `${API_BASE}/thumbnail?${params.toString()}`;
}

const STORAGE_KEY = 'pulse_download_history_v1';

export function getHistory(): DownloadHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(item: DownloadHistoryItem): DownloadHistoryItem[] {
  try {
    const current = getHistory().filter(h => h.id !== item.id);
    const updated = [item, ...current].slice(0, 50); // Keep last 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
