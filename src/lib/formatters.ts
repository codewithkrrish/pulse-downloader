export interface PlatformMeta {
  id: string;
  name: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  icon: string;
  supportsAudio: boolean;
  supports4K: boolean;
}

export interface FormattedStream {
  formatId: string;
  type: 'video' | 'audio';
  qualityLabel: string;
  resolution?: string;
  fps?: number;
  ext: string;
  filesize: number | null;
  filesizeFormatted: string;
  hasAudio: boolean;
  hasVideo: boolean;
  tbr?: number;
  abr?: number;
  vcodec?: string;
  acodec?: string;
  isBest?: boolean;
}

export interface ExtractedMedia {
  id: string;
  title: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  uploader: string;
  uploaderUrl?: string;
  webpageUrl: string;
  platform: PlatformMeta;
  videoStreams: FormattedStream[];
  audioStreams: FormattedStream[];
}

export interface DownloadHistoryItem {
  id: string;
  title: string;
  uploader: string;
  platformName: string;
  platformColor: string;
  thumbnail: string;
  quality: string;
  ext: string;
  type: 'video' | 'audio';
  downloadUrl: string;
  timestamp: number;
}
