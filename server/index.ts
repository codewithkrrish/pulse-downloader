import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { validateMediaUrl, validateThumbnailUrl } from './security.js';
import { PLATFORMS } from './platforms.js';
import { extractMediaMetadata } from './extractor.js';
import { handleMediaStream } from './streamer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve project root directory whether executing from root or inside server/
const rootDir = fs.existsSync(path.resolve(__dirname, 'package.json'))
  ? __dirname
  : path.resolve(__dirname, '..');

const distPath = path.resolve(rootDir, 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');

// Automatically compile frontend client bundle if missing so 'node index.js' works with zero prep
if (!fs.existsSync(indexHtmlPath)) {
  console.log('[PULSE Engine] Client distribution bundle not found.');
  console.log('[PULSE Engine] Automatically compiling Vite frontend bundle...');
  try {
    const buildResult = spawnSync('npx', ['vite', 'build'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    });
    if (buildResult.status === 0) {
      console.log('[PULSE Engine] Frontend bundle successfully built.');
    }
  } catch (err: any) {
    console.error('[PULSE Engine] Notice: Automatic build encountered an issue:', err?.message);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function checkBinaryAvailable(cmd: string, flag = '--version'): boolean {
  try {
    const res = spawnSync(cmd, [flag], { stdio: 'ignore' });
    return res.status === 0;
  } catch {
    return false;
  }
}

// Binary probes are SLOW on small instances (yt-dlp is a Python zipapp;
// a cold `--version` spawn can take seconds and spawnSync blocks the event
// loop). Probing on every /api/health request made platform health checks
// time out and got the instance restart-looped on Render's free tier.
// So: probe once at boot, cache the result, refresh in the background.
const binaryStatus = { ytDlp: false, ffmpeg: false };
function refreshBinaryStatus(): void {
  binaryStatus.ytDlp = checkBinaryAvailable(process.env.YT_DLP_PATH || 'yt-dlp', '--version');
  binaryStatus.ffmpeg = checkBinaryAvailable('ffmpeg', '-version');
}
refreshBinaryStatus();
const binaryRefreshTimer = setInterval(refreshBinaryStatus, 5 * 60 * 1000);
binaryRefreshTimer.unref();

// Lightweight liveness probe for platform health checks — must stay instant.
app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

// System Health & Engine Diagnostics
app.get('/api/health', (req: Request, res: Response) => {
  const ytdlpOk = binaryStatus.ytDlp;
  const ffmpegOk = binaryStatus.ffmpeg;

  res.json({
    status: ytdlpOk && ffmpegOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    engine: 'PULSE Studio Engine v1.0',
    binaries: {
      ytDlp: ytdlpOk,
      ffmpeg: ffmpegOk,
    },
    capabilities: {
      zeroDiskStreaming: ytdlpOk,
      audioTranscoding: ffmpegOk,
      highResolutionMuxing: ytdlpOk && ffmpegOk,
      supportedPlatformsCount: Object.keys(PLATFORMS).length,
    },
    hostingNotice: !ytdlpOk || !ffmpegOk
      ? 'Required system binaries (yt-dlp or ffmpeg) are missing from the host environment. Deploy using Docker or a Linux VPS.'
      : undefined,
  });
});

// Platform Directory
app.get('/api/platforms', (req: Request, res: Response) => {
  res.json({
    platforms: Object.values(PLATFORMS),
  });
});

// Probe & Extract Media Metadata
app.post('/api/extract', async (req: Request, res: Response) => {
  const { url, cookies } = req.body;

  const validation = validateMediaUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const metadata = await extractMediaMetadata(validation.url!);
    res.json({ success: true, data: metadata });
  } catch (err: any) {
    console.error('[API /api/extract Error]:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to extract media metadata',
    });
  }
});

// Direct Media Stream Pipe
app.get('/api/stream', (req: Request, res: Response) => {
  const { url, format_id, type, ext, title, start_time, end_time } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing media URL parameter' });
  }

  const validation = validateMediaUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const streamType = type === 'audio' ? 'audio' : 'video';
  const streamExt = typeof ext === 'string' && ext ? ext : (streamType === 'audio' ? 'mp3' : 'mp4');
  const streamTitle = typeof title === 'string' && title ? title : 'media';
  const formatId = typeof format_id === 'string' && format_id ? format_id : (streamType === 'audio' ? 'bestaudio-mp3-320' : 'best');

  try {
    handleMediaStream(
      validation.url!,
      {
        url: validation.url!,
        formatId,
        type: streamType,
        ext: streamExt,
        title: streamTitle,
        startTime: typeof start_time === 'string' && start_time.trim() ? start_time.trim() : undefined,
        endTime: typeof end_time === 'string' && end_time.trim() ? end_time.trim() : undefined,
      },
      res
    );
  } catch (err: any) {
    console.error('[API /api/stream Error]:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream initiation failed' });
    }
  }
});

// HD Thumbnail Downloader Proxy (Protected against SSRF)
app.get('/api/thumbnail', async (req: Request, res: Response) => {
  const { url, title } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing thumbnail URL' });
  }

  const validation = validateThumbnailUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const fetchRes = await fetch(validation.url!);
    if (!fetchRes.ok) throw new Error('Failed to fetch remote thumbnail');
    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const cleanTitle = typeof title === 'string' && title ? title.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim() : 'thumbnail';
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanTitle)}-cover.jpg"`);
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to download thumbnail' });
  }
});

// Serve frontend static build if dist exists
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Express 5 SPA fallback handler
app.use((req: Request, res: Response) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PULSE Studio Engine</title>
  <style>
    body { background: #08090C; color: #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #12141A; border: 1px solid #232734; padding: 2.5rem; border-radius: 12px; max-width: 480px; text-align: center; }
    h1 { font-size: 1.25rem; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 0.75rem; color: #FFFFFF; }
    p { color: #9CA3AF; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.5rem; }
    code { background: #1E222D; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; color: #60A5FA; }
  </style>
</head>
<body>
  <div class="card">
    <h1>PULSE Studio Server Online</h1>
    <p>API endpoints are active. The frontend distribution bundle was not found at <code>dist/</code>. Run the build command to generate the UI:</p>
    <p><code>npm run build</code></p>
  </div>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`
========================================================================
  PULSE MEDIA STUDIO ENGINE - ONLINE
  Web Interface:    http://localhost:${PORT}
  API Health Check: http://localhost:${PORT}/api/health
========================================================================
`);
});

