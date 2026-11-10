import { URL } from 'url';

// Allowed social media and streaming domain patterns
const ALLOWED_DOMAINS = [
  // YouTube
  /^(?:.*\.)?youtube\.com$/,
  /^youtu\.be$/,
  // Instagram
  /^(?:.*\.)?instagram\.com$/,
  // Facebook
  /^(?:.*\.)?facebook\.com$/,
  /^fb\.watch$/,
  // TikTok
  /^(?:.*\.)?tiktok\.com$/,
  // Twitter / X
  /^(?:.*\.)?twitter\.com$/,
  /^(?:.*\.)?x\.com$/,
  // Reddit
  /^(?:.*\.)?reddit\.com$/,
  // Pinterest
  /^(?:.*\.)?pinterest\.com$/,
  /^(?:.*\.)?pin\.it$/,
  // Vimeo & SoundCloud
  /^(?:.*\.)?vimeo\.com$/,
  /^(?:.*\.)?soundcloud\.com$/,
  // Threads
  /^(?:.*\.)?threads\.net$/,
];

// Private IP ranges to prevent SSRF
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^169\.254\./, // Link-local
  /^localhost$/i,
  /^::1$/,
];

export function validateMediaUrl(rawUrl: string): { valid: boolean; error?: string; url?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Malformed URL provided' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are permitted' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Guard against SSRF to localhost or private IPs
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Internal or loopback addresses are blocked' };
    }
  }

  // Check against allowed social media domains
  const isAllowed = ALLOWED_DOMAINS.some(regex => regex.test(hostname));
  if (!isAllowed) {
    return {
      valid: false,
      error: `Unsupported domain: ${hostname}. Supported platforms include YouTube, Instagram, Facebook, TikTok, Twitter/X, Reddit, and SoundCloud.`,
    };
  }

  return { valid: true, url: trimmed };
}

export function validateThumbnailUrl(rawUrl: string): { valid: boolean; error?: string; url?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Thumbnail URL is required' };
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Malformed thumbnail URL provided' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are permitted' };
  }

  const hostname = parsed.hostname.toLowerCase();

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Internal or loopback addresses are blocked' };
    }
  }

  return { valid: true, url: trimmed };
}
