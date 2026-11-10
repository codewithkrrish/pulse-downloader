import React, { useState, useEffect } from 'react';
import {
  Settings2,
  HardDrive,
  AlertCircle,
  Shield,
  Layers,
  Volume2
} from 'lucide-react';
import { Omnibar } from './components/Omnibar';
import { MediaInspector } from './components/MediaInspector';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { fetchPlatforms, fetchHealth, extractMedia, getHistory, saveHistoryItem, clearHistory } from './lib/api';
import { PlatformMeta, ExtractedMedia, FormattedStream, DownloadHistoryItem } from './lib/formatters';

export const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [platforms, setPlatforms] = useState<PlatformMeta[]>([]);
  const [media, setMedia] = useState<ExtractedMedia | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    fetchPlatforms()
      .then(setPlatforms)
      .catch((err) => console.error('Platform error:', err));

    fetchHealth()
      .then(setSystemHealth)
      .catch((err) => console.error('Health error:', err));

    setHistory(getHistory());
  }, []);

  const handleExtract = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || url;
    if (!targetUrl.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await extractMedia(targetUrl);
      setMedia(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to probe media stream');
      setMedia(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadStarted = (stream: FormattedStream, downloadUrl: string) => {
    if (!media) return;

    const newItem: DownloadHistoryItem = {
      id: `${media.id}-${stream.formatId}-${Date.now()}`,
      title: media.title,
      uploader: media.uploader,
      platformName: media.platform.name,
      platformColor: media.platform.color,
      thumbnail: media.thumbnail,
      quality: stream.qualityLabel,
      ext: stream.ext,
      type: stream.type,
      downloadUrl,
      timestamp: Date.now(),
    };

    const updated = saveHistoryItem(newItem);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-slate-100 flex flex-col selection:bg-white/20 selection:text-white">
      {/* Subtle ambient light backdrop */}
      <div className="ambient-glow" />

      {/* Minimal Studio Top Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#08090C]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Minimalist Wordmark */}
          <div className="flex items-center gap-2.5">
            <span className="font-bold tracking-widest text-sm text-white font-mono">PULSE</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-l border-white/10 pl-2">
              STUDIO
            </span>
          </div>

          {/* Minimal Header Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Operational</span>
            </div>

            <button
              onClick={() => setIsHistoryOpen(true)}
              className="relative p-2 rounded-lg btn-secondary text-slate-400 hover:text-white"
              title="Recent Library"
            >
              <HardDrive className="w-3.5 h-3.5" />
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white text-slate-950 text-[9px] font-mono font-bold flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg btn-secondary text-slate-400 hover:text-white"
              title="Preferences"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-8 pb-28 sm:pb-14 relative z-10">
        {/* Confident, Quiet Headline */}
        <div className="text-center space-y-2.5 max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white">
            Universal Media Extraction
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Download high-fidelity video and studio audio from YouTube, Instagram, Facebook, and TikTok with direct zero-disk streaming.
          </p>
        </div>

        {/* Omnibar Input */}
        <Omnibar
          url={url}
          setUrl={setUrl}
          onExtract={handleExtract}
          isLoading={isLoading}
          platforms={platforms}
        />

        {/* Error Notification */}
        {errorMessage && (
          <div className="max-w-2xl mx-auto p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-semibold text-rose-200">Extraction Notice</h4>
              <p className="text-rose-300/80 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Minimal Loading Skeleton */}
        {isLoading && (
          <div className="max-w-3xl mx-auto studio-card rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="w-full sm:w-64 aspect-video rounded-xl bg-white/[0.04]" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-white/[0.06] rounded w-3/4" />
                <div className="h-3 bg-white/[0.04] rounded w-1/3" />
                <div className="h-10 bg-white/[0.03] rounded-xl w-full" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-12 bg-white/[0.03] rounded-xl" />
              <div className="h-12 bg-white/[0.03] rounded-xl" />
            </div>
          </div>
        )}

        {/* Media Inspector Workspace */}
        {media && !isLoading && (
          <MediaInspector
            media={media}
            onDownloadStarted={handleDownloadStarted}
          />
        )}

        {/* Minimal Quiet Feature Highlights (Shown only when idle) */}
        {!media && !isLoading && (
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-[#090C12] border border-white/[0.04] space-y-1.5">
              <span className="text-xs font-semibold text-slate-200 block">Direct Stream Piping</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Chunks route directly from source CDN into your browser without server disk buffering.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#090C12] border border-white/[0.04] space-y-1.5">
              <span className="text-xs font-semibold text-slate-200 block">320kbps Audio Mastering</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Native FFmpeg transcode pipeline generates broadcast-quality MP3 and lossless WAV audio.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#090C12] border border-white/[0.04] space-y-1.5">
              <span className="text-xs font-semibold text-slate-200 block">Private Client Storage</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Zero tracking redirects and zero server logs. Session data resides strictly on your device.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Minimalist Studio Footer */}
      <footer className="w-full border-t border-white/[0.04] bg-[#07080B] py-6 text-[11px] font-mono text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">PULSE MEDIA ENGINE</span>
            <span>•</span>
            <span>yt-dlp Core</span>
            <span>•</span>
            <span>FFmpeg 6.1</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>Encrypted Vault</span>
            <span>•</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-white transition-colors"
            >
              Session Config
            </button>
          </div>
        </div>
      </footer>

      {/* History and Settings Modals */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClear={handleClearHistory}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
export default App;
