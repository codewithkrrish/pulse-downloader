import { spawn } from 'child_process';
import { identifyPlatform, PlatformMeta } from './platforms.js';

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

function formatBytes(bytes: number | null, isEstimated = false): string {
  if (!bytes || bytes <= 0) return 'Approx. ~15 MB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  const prefix = isEstimated ? '~' : '';
  return `${prefix}${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Locate node path for yt-dlp JS runtime challenge solving
const NODE_PATH = process.execPath;

export async function extractMediaMetadata(url: string, cookiesFile?: string): Promise<ExtractedMedia> {
  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--no-playlist',
      '--no-warnings',
      '--prefer-free-formats',
      '--js-runtimes', `node:${NODE_PATH}`,
    ];

    if (cookiesFile) {
      args.push('--cookies', cookiesFile);
    }

    args.push(url);

    // Call yt-dlp binary from PATH or ~/.local/bin/yt-dlp
    const ytDlpPath = process.env.YT_DLP_PATH || 'yt-dlp';
    const child = spawn(ytDlpPath, args);

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    child.on('error', (err: any) => {
      if (err.code === 'ENOENT') {
        return reject(new Error("The 'yt-dlp' executable was not found on this server. Standard Node.js hosting without Linux binary support cannot run media extraction. Please deploy using Docker (Railway/Render) or a Linux VPS."));
      }
      reject(new Error(`Failed to launch yt-dlp process: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        let errMsg = stderrData.trim() || `yt-dlp exited with code ${code}`;
        if (errMsg.includes('Sign in to confirm you’re not a bot')) {
          errMsg = 'The media platform triggered a bot check. Please configure an account session cookie in Settings.';
        } else if (errMsg.includes('Private video') || errMsg.includes('login required')) {
          errMsg = 'This media is private or restricted. Authentication is required to access it.';
        }
        return reject(new Error(errMsg));
      }

      try {
        const raw = JSON.parse(stdoutData.trim());
        const platform = identifyPlatform(url);

        const videoStreamsMap = new Map<string, FormattedStream>();
        const audioStreamsMap = new Map<string, FormattedStream>();

        const duration = raw.duration || 0;
        const formats = raw.formats || [];

        for (const f of formats) {
          const hasVideo = f.vcodec && f.vcodec !== 'none';
          const hasAudio = f.acodec && f.acodec !== 'none';
          let size = f.filesize || f.filesize_approx || null;
          let isEstimated = false;

          // If size is missing from provider, calculate from bitrate and duration
          if (!size && duration > 0) {
            const bitrateKbps = f.tbr || (f.vbr ? f.vbr + (f.abr || 128) : (f.abr || null));
            if (bitrateKbps && bitrateKbps > 0) {
              size = Math.round((bitrateKbps * 1000 * duration) / 8);
              isEstimated = true;
            } else if (f.height) {
              let estBitrate = 1500;
              if (f.height >= 2160) estBitrate = 18000;
              else if (f.height >= 1440) estBitrate = 8000;
              else if (f.height >= 1080) estBitrate = 4000;
              else if (f.height >= 720) estBitrate = 2000;
              else if (f.height >= 480) estBitrate = 1000;
              else estBitrate = 500;
              size = Math.round((estBitrate * 1000 * duration) / 8);
              isEstimated = true;
            }
          }

          if (hasVideo && f.height) {
            const height = f.height;
            let qualityLabel = `${height}p`;
            if (height >= 2160) qualityLabel = '4K UHD (2160p)';
            else if (height >= 1440) qualityLabel = '2K QHD (1440p)';
            else if (height >= 1080) qualityLabel = 'Full HD (1080p)';
            else if (height >= 720) qualityLabel = 'HD (720p)';
            else if (height >= 480) qualityLabel = 'SD (480p)';
            else qualityLabel = `${height}p`;

            if (f.fps && f.fps > 30) {
              qualityLabel += ` ${f.fps}fps`;
            }

            // Key on height + fps to avoid redundant duplicates, preferring MP4
            const key = `${height}-${f.fps || 30}`;
            const existing = videoStreamsMap.get(key);

            if (!existing || (f.ext === 'mp4' && existing.ext !== 'mp4')) {
              videoStreamsMap.set(key, {
                formatId: f.format_id,
                type: 'video',
                qualityLabel,
                resolution: `${f.width || '?'}x${f.height}`,
                fps: f.fps,
                ext: f.ext || 'mp4',
                filesize: size,
                filesizeFormatted: formatBytes(size, isEstimated),
                hasAudio: !!hasAudio,
                hasVideo: true,
                tbr: f.tbr,
                vcodec: f.vcodec,
                acodec: f.acodec,
              });
            }
          } else if (hasAudio && !hasVideo) {
            const abr = Math.round(f.abr || 128);
            const key = `${abr}k-${f.ext}`;
            const label = `${abr} kbps ${f.ext.toUpperCase()}`;

            audioStreamsMap.set(key, {
              formatId: f.format_id,
              type: 'audio',
              qualityLabel: label,
              ext: f.ext || 'mp3',
              filesize: size,
              filesizeFormatted: formatBytes(size, isEstimated),
              hasAudio: true,
              hasVideo: false,
              abr,
              acodec: f.acodec,
            });
          }
        }

        // Add standard studio synthesized audio options (MP3 320k, MP3 256k, MP3 128k, WAV)
        const customAudioFormats: FormattedStream[] = [
          {
            formatId: 'bestaudio-mp3-320',
            type: 'audio',
            qualityLabel: 'Studio MP3 320 kbps (High Fidelity)',
            ext: 'mp3',
            filesize: raw.duration ? Math.round(raw.duration * 40000) : null,
            filesizeFormatted: raw.duration ? formatBytes(Math.round(raw.duration * 40000)) : 'High Quality',
            hasAudio: true,
            hasVideo: false,
            abr: 320,
            isBest: true,
          },
          {
            formatId: 'bestaudio-mp3-192',
            type: 'audio',
            qualityLabel: 'Standard MP3 192 kbps',
            ext: 'mp3',
            filesize: raw.duration ? Math.round(raw.duration * 24000) : null,
            filesizeFormatted: raw.duration ? formatBytes(Math.round(raw.duration * 24000)) : 'Standard Quality',
            hasAudio: true,
            hasVideo: false,
            abr: 192,
          },
          {
            formatId: 'bestaudio-wav-lossless',
            type: 'audio',
            qualityLabel: 'Lossless WAV (Studio Master)',
            ext: 'wav',
            filesize: raw.duration ? Math.round(raw.duration * 176400) : null,
            filesizeFormatted: raw.duration ? formatBytes(Math.round(raw.duration * 176400)) : 'Lossless',
            hasAudio: true,
            hasVideo: false,
            isBest: false,
          },
        ];

        // Sort video streams high to low resolution
        const sortedVideo = Array.from(videoStreamsMap.values()).sort((a, b) => {
          const hA = parseInt(a.qualityLabel.match(/\d+/)?.[0] || '0', 10);
          const hB = parseInt(b.qualityLabel.match(/\d+/)?.[0] || '0', 10);
          return hB - hA;
        });

        // Mark the highest video resolution as best
        if (sortedVideo.length > 0) {
          sortedVideo[0].isBest = true;
        }

        // Combine direct audio streams and studio synthesized audio
        const combinedAudio = [...customAudioFormats, ...Array.from(audioStreamsMap.values())];

        const result: ExtractedMedia = {
          id: raw.id || String(Date.now()),
          title: raw.title || 'Untitled Media',
          duration: raw.duration || 0,
          durationFormatted: formatDuration(raw.duration || 0),
          thumbnail: raw.thumbnail || (raw.thumbnails && raw.thumbnails.length ? raw.thumbnails[raw.thumbnails.length - 1].url : ''),
          uploader: raw.uploader || raw.channel || raw.artist || 'Unknown Creator',
          uploaderUrl: raw.uploader_url || raw.channel_url,
          webpageUrl: raw.webpage_url || url,
          platform,
          videoStreams: sortedVideo,
          audioStreams: combinedAudio,
        };

        resolve(result);
      } catch (parseErr: any) {
        reject(new Error(`Failed to parse media metadata: ${parseErr.message}`));
      }
    });
  });
}
