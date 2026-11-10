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

export const PLATFORMS: Record<string, PlatformMeta> = {
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    badgeBg: 'rgba(255, 0, 0, 0.12)',
    badgeBorder: 'rgba(255, 0, 0, 0.3)',
    icon: 'youtube',
    supportsAudio: true,
    supports4K: true,
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    color: '#E1306C',
    badgeBg: 'rgba(225, 48, 108, 0.12)',
    badgeBorder: 'rgba(225, 48, 108, 0.3)',
    icon: 'instagram',
    supportsAudio: true,
    supports4K: false,
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    badgeBg: 'rgba(24, 119, 242, 0.12)',
    badgeBorder: 'rgba(24, 119, 242, 0.3)',
    icon: 'facebook',
    supportsAudio: true,
    supports4K: false,
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    color: '#00F2FE',
    badgeBg: 'rgba(0, 242, 254, 0.12)',
    badgeBorder: 'rgba(0, 242, 254, 0.3)',
    icon: 'music',
    supportsAudio: true,
    supports4K: false,
  },
  twitter: {
    id: 'twitter',
    name: 'X / Twitter',
    color: '#1DA1F2',
    badgeBg: 'rgba(29, 161, 242, 0.12)',
    badgeBorder: 'rgba(29, 161, 242, 0.3)',
    icon: 'twitter',
    supportsAudio: false,
    supports4K: false,
  },
  reddit: {
    id: 'reddit',
    name: 'Reddit',
    color: '#FF4500',
    badgeBg: 'rgba(255, 69, 0, 0.12)',
    badgeBorder: 'rgba(255, 69, 0, 0.3)',
    icon: 'message-square',
    supportsAudio: true,
    supports4K: false,
  },
  soundcloud: {
    id: 'soundcloud',
    name: 'SoundCloud',
    color: '#FF5500',
    badgeBg: 'rgba(255, 85, 0, 0.12)',
    badgeBorder: 'rgba(255, 85, 0, 0.3)',
    icon: 'headphones',
    supportsAudio: true,
    supports4K: false,
  },
  generic: {
    id: 'generic',
    name: 'Universal Media',
    color: '#00F5D4',
    badgeBg: 'rgba(0, 245, 212, 0.12)',
    badgeBorder: 'rgba(0, 245, 212, 0.3)',
    icon: 'film',
    supportsAudio: true,
    supports4K: true,
  },
};

export function identifyPlatform(url: string): PlatformMeta {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return PLATFORMS.youtube;
  if (lower.includes('instagram.com')) return PLATFORMS.instagram;
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return PLATFORMS.facebook;
  if (lower.includes('tiktok.com')) return PLATFORMS.tiktok;
  if (lower.includes('twitter.com') || lower.includes('x.com')) return PLATFORMS.twitter;
  if (lower.includes('reddit.com')) return PLATFORMS.reddit;
  if (lower.includes('soundcloud.com')) return PLATFORMS.soundcloud;
  return PLATFORMS.generic;
}
