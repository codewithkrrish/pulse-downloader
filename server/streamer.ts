import { spawn, ChildProcess } from 'child_process';
import { Response } from 'express';

const NODE_PATH = process.execPath;
const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';

export interface StreamOptions {
  url: string;
  formatId: string;
  type: 'video' | 'audio';
  ext: string;
  title: string;
  cookiesFile?: string;
  startTime?: string;
  endTime?: string;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

export function handleMediaStream(reqUrl: string, options: StreamOptions, res: Response): void {
  const { url, formatId, type, ext, title } = options;
  const cleanTitle = sanitizeFilename(title) || 'download';
  const outFilename = `${cleanTitle}.${ext}`;

  // Content type mapping
  let contentType = 'application/octet-stream';
  if (ext === 'mp3') contentType = 'audio/mpeg';
  else if (ext === 'm4a') contentType = 'audio/mp4';
  else if (ext === 'wav') contentType = 'audio/wav';
  else if (ext === 'opus') contentType = 'audio/opus';
  else if (ext === 'mp4') contentType = 'video/mp4';
  else if (ext === 'webm') contentType = 'video/webm';
  else if (ext === 'mkv') contentType = 'video/x-matroska';

  // Set HTTP download headers
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(outFilename)}"; filename*=UTF-8''${encodeURIComponent(outFilename)}`);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Transfer-Encoding', 'chunked');

  let activeProcesses: ChildProcess[] = [];
  let isCleanedUp = false;

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    for (const proc of activeProcesses) {
      if (!proc.killed) {
        try {
          proc.kill('SIGKILL');
        } catch {}
      }
    }
    activeProcesses = [];
  };

  // Gracefully handle client disconnects and socket errors
  res.on('close', cleanup);
  res.on('error', (err: any) => {
    if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
      console.warn('[Streamer] Client socket error:', err.message);
    }
    cleanup();
  });

  const attachSafePipe = (readable: any, writable: any) => {
    readable.on('error', (err: any) => {
      if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
        console.warn('[Streamer] Pipe readable error:', err.message);
      }
      cleanup();
    });
    writable.on('error', (err: any) => {
      if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
        console.warn('[Streamer] Pipe writable error:', err.message);
      }
      cleanup();
    });
    readable.pipe(writable);
  };

  if (type === 'audio') {
    // Determine bitrate or format
    let bitrate = '320k';
    let outputFormat = ext;
    if (formatId.includes('192')) bitrate = '192k';
    else if (formatId.includes('128')) bitrate = '128k';

    // yt-dlp fetches raw audio stream to stdout
    const ytdlpArgs = [
      '--no-playlist',
      '--no-warnings',
      '--js-runtimes', `node:${NODE_PATH}`,
      '-f', 'ba/b',
      '-o', '-',
    ];

    if (options.startTime || options.endTime) {
      ytdlpArgs.push('--download-sections', `*${options.startTime || '00:00'}-${options.endTime || 'inf'}`);
    }

    ytdlpArgs.push(url);

    const ytdlpProc = spawn(YT_DLP_PATH, ytdlpArgs);
    ytdlpProc.stderr?.resume();
    activeProcesses.push(ytdlpProc);

    // ffmpeg converts audio stream to requested MP3 / WAV / AAC on the fly
    const ffmpegArgs = [
      '-i', 'pipe:0',
      '-vn',
      '-ab', bitrate,
      '-f', outputFormat,
      'pipe:1',
    ];

    const ffmpegProc = spawn('ffmpeg', ffmpegArgs);
    ffmpegProc.stderr?.resume();
    activeProcesses.push(ffmpegProc);

    attachSafePipe(ytdlpProc.stdout, ffmpegProc.stdin);
    attachSafePipe(ffmpegProc.stdout, res);

    ytdlpProc.on('error', cleanup);
    ffmpegProc.on('error', cleanup);
    ffmpegProc.on('close', cleanup);
  } else {
    // Video streaming
    let formatArg = formatId;
    const isSpecificNumeric = /^\d+$/.test(formatId);

    if (isSpecificNumeric) {
      formatArg = `${formatId}+ba/b`;
    } else if (!formatId || formatId === 'best') {
      formatArg = 'bv*+ba/b';
    }

    const ytdlpArgs = [
      '--no-playlist',
      '--no-warnings',
      '--js-runtimes', `node:${NODE_PATH}`,
      '-f', formatArg,
      '--downloader-args', 'ffmpeg:-movflags frag_keyframe+empty_moov',
      '-o', '-',
    ];

    if (options.startTime || options.endTime) {
      ytdlpArgs.push('--download-sections', `*${options.startTime || '00:00'}-${options.endTime || 'inf'}`);
    }

    ytdlpArgs.push(url);

    const ytdlpProc = spawn(YT_DLP_PATH, ytdlpArgs);
    ytdlpProc.stderr?.resume();
    activeProcesses.push(ytdlpProc);

    attachSafePipe(ytdlpProc.stdout, res);

    ytdlpProc.on('error', cleanup);
    ytdlpProc.on('close', cleanup);
  }
}
