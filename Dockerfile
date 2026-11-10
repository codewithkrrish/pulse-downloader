# Production Dockerfile for PULSE Media Downloader
FROM node:20-bookworm-slim

# Install system dependencies: Python 3, FFmpeg, and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install official yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy package manifests
COPY package*.json tsconfig.json ./

# Install npm dependencies
RUN npm install

# Copy application source
COPY . .

# Build the frontend production bundle
RUN npm run build

# Default environment configuration
ENV NODE_ENV=production
ENV PORT=3001
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp

# Expose server port
EXPOSE 3001

# Start the fullstack production server
CMD ["node", "index.js"]
