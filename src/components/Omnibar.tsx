import React, { useState, useEffect } from 'react';
import { Search, Clipboard, X, ArrowRight, Check } from 'lucide-react';
import { PlatformMeta } from '../lib/formatters';

interface OmnibarProps {
  url: string;
  setUrl: (url: string) => void;
  onExtract: (targetUrl?: string) => void;
  isLoading: boolean;
  platforms: PlatformMeta[];
}

export const Omnibar: React.FC<OmnibarProps> = ({
  url,
  setUrl,
  onExtract,
  isLoading,
  platforms,
}) => {
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformMeta | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!url.trim()) {
      setDetectedPlatform(null);
      return;
    }
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      setDetectedPlatform(platforms.find(p => p.id === 'youtube') || null);
    } else if (lower.includes('instagram.com')) {
      setDetectedPlatform(platforms.find(p => p.id === 'instagram') || null);
    } else if (lower.includes('facebook.com') || lower.includes('fb.watch')) {
      setDetectedPlatform(platforms.find(p => p.id === 'facebook') || null);
    } else if (lower.includes('tiktok.com')) {
      setDetectedPlatform(platforms.find(p => p.id === 'tiktok') || null);
    } else if (lower.includes('twitter.com') || lower.includes('x.com')) {
      setDetectedPlatform(platforms.find(p => p.id === 'twitter') || null);
    } else if (lower.includes('soundcloud.com')) {
      setDetectedPlatform(platforms.find(p => p.id === 'soundcloud') || null);
    } else {
      setDetectedPlatform(platforms.find(p => p.id === 'generic') || null);
    }
  }, [url, platforms]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1200);
      }
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && url.trim()) {
      onExtract();
    }
  };

  const sampleLinks = [
    { label: 'YouTube 4K', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { label: 'Instagram Reel', url: 'https://www.instagram.com/reel/C89abcdef/' },
    { label: 'Facebook Watch', url: 'https://www.facebook.com/watch/?v=10158793084832679' },
    { label: 'TikTok Clip', url: 'https://www.tiktok.com/@tiktok/video/7106594312292453678' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Monolithic Precision Omnibar */}
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-white/15 to-white/5 transition-all duration-300 focus-within:from-white/30 focus-within:to-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2.5 bg-[#090C12] rounded-[15px] px-3.5 py-2.5 sm:px-4 sm:py-3">
          {/* Subtle Leading Icon / Platform indicator */}
          <div className="flex items-center shrink-0">
            {detectedPlatform ? (
              <span className="text-[11px] font-mono tracking-wider text-slate-300 px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10">
                {detectedPlatform.name}
              </span>
            ) : (
              <Search className="w-4 h-4 text-slate-500" />
            )}
          </div>

          {/* Clean Input Field */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste media link from YouTube, Instagram, Facebook..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans min-w-0"
          />

          {/* Clear Button */}
          {url && (
            <button
              onClick={() => setUrl('')}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 1-Tap Paste Button */}
          <button
            onClick={handlePaste}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-slate-300 border border-white/[0.08] transition-colors shrink-0 active:scale-95"
            title="Paste from clipboard"
          >
            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3 text-slate-400" />}
            <span className="hidden xs:inline text-[11px]">{isCopied ? 'Pasted' : 'Paste'}</span>
          </button>

          {/* High-Contrast Action Button */}
          <button
            onClick={() => onExtract()}
            disabled={isLoading || !url.trim()}
            className={`px-4 py-2 sm:px-5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-1.5 shrink-0 transition-all ${
              isLoading || !url.trim()
                ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                : 'btn-primary cursor-pointer active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Analyzing</span>
              </>
            ) : (
              <>
                <span>Extract</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subtle sample presets */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500 font-mono pt-1">
        <span>Examples:</span>
        {sampleLinks.map((sample, i) => (
          <button
            key={i}
            onClick={() => {
              setUrl(sample.url);
              onExtract(sample.url);
            }}
            className="hover:text-slate-300 transition-colors underline decoration-slate-700 underline-offset-4"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};
