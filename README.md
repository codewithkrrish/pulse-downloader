# PULSE — Studio-Grade Universal Media Downloader

> An elite, high-fidelity universal media extraction platform engineered for seamless audio and video downloads from YouTube, Instagram, Facebook, TikTok, Twitter/X, and 1,000+ sources with zero advertisements, zero tracking, and instant zero-disk streaming.

---

## Architectural Highlights

- **Obsidian & Bioluminescent Studio Design**: Built according to luxury creative software standards (Linear / Ableton / DaVinci Resolve aesthetic), complete with animated real-time HTML5 Canvas audio spectrum visualizer.
- **Zero-Disk Direct Streaming**: Streams media chunks directly from social media CDNs to the client's browser through chunked HTTP responses. No wasted server disk space, no storage exhaustion risk, instant download start.
- **On-the-Fly Audio Mastering**: Built-in FFmpeg transcode pipeline extracts 320kbps Studio MP3, 256kbps High-Fidelity, and Lossless WAV master audio directly from video streams.
- **Full Social Media Coverage**:
  - **YouTube**: Up to 4K UHD 60fps, 1080p, 720p, Shorts, Audio.
  - **Instagram**: Reels, Video Posts, Stories, Carousels.
  - **Facebook**: Watch clips, Reels, Public Page Videos.
  - **TikTok**: Clean watermark-free videos and audio.
  - **Twitter / X & Reddit**: Embedded video and GIF extraction.
  - **SoundCloud**: High-bitrate audio stream extraction.
- **Privacy & Security Vault**: Local session history saved strictly on client-side IndexedDB/localStorage. Netscape cookie injection support for restricted/private content without server storage.

---

## Quick Start

### 1. Requirements
- Node.js v18+ (tested on Node.js v26)
- Python 3 with `yt-dlp` installed
- `ffmpeg` installed

### 2. Run Locally
```bash
cd /home/krrish/.gemini/antigravity/scratch/pulse-downloader

# Run unified fullstack production server (serves UI + API on port 3001)
npm run server
```

Open your browser to:
```
http://localhost:3001
```

### 3. Development Mode
To run Vite hot-reloading dev server:
```bash
# Terminal 1 (Backend API)
npm run server

# Terminal 2 (Vite Frontend with HMR)
npm run dev
```

---

## API Endpoints

- `GET /api/health` — Core engine health and diagnostic capabilities.
- `GET /api/platforms` — Supported platforms directory and visual badges.
- `POST /api/extract` — Probe media URL, extract metadata, thumbnails, and available video/audio streams.
- `GET /api/stream` — Direct zero-disk HTTP stream pipe for video or audio download.

---

## Security & System Isolation

- **SSRF Protection**: Strict domain whitelist rejecting local IP ranges (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, link-local, localhost).
- **Socket Safety**: Client aborts (`EPIPE` / `ECONNRESET`) are caught gracefully with automatic child process cleanup.
