import React, { useState } from 'react';
import { Download, ExternalLink, Clock, User, Check, HardDrive, Share2, QrCode, X, Scissors } from 'lucide-react';
import { ExtractedMedia, FormattedStream } from '../lib/formatters';
import { FormatSelector } from './FormatSelector';
import { AudioWaveform } from './AudioWaveform';
import { buildStreamUrl } from '../lib/api';

interface MediaInspectorProps {
  media: ExtractedMedia;
  onDownloadStarted: (stream: FormattedStream, downloadUrl: string) => void;
}

export const MediaInspector: React.FC<MediaInspectorProps> = ({
  media,
  onDownloadStarted,
}) => {
  const [selectedStream, setSelectedStream] = useState<FormattedStream>(
    media.videoStreams[0] || media.audioStreams[0]
  );
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleDownload = () => {
    if (!selectedStream) return;
    const downloadUrl = buildStreamUrl(media.webpageUrl, selectedStream, media.title, startTime, endTime);
    onDownloadStarted(selectedStream, downloadUrl);

    const a = document.createElement('a');
    a.href = downloadUrl;
    const clipTag = (startTime || endTime) ? `-clip` : '';
    a.download = `${media.title}${clipTag}.${selectedStream.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    if (!selectedStream) return;
    const streamUrl = `${window.location.origin}${buildStreamUrl(media.webpageUrl, selectedStream, media.title, startTime, endTime)}`;
    navigator.clipboard.writeText(streamUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  const handleNativeShare = async () => {
    if (!selectedStream) return;
    const streamUrl = `${window.location.origin}${buildStreamUrl(media.webpageUrl, selectedStream, media.title, startTime, endTime)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: media.title,
          text: `Download ${media.title} (${selectedStream.qualityLabel} • ${selectedStream.filesizeFormatted}) via PULSE`,
          url: streamUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const currentStreamUrl = selectedStream ? `${window.location.origin}${buildStreamUrl(media.webpageUrl, selectedStream, media.title, startTime, endTime)}` : '';
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=FFFFFF&bgcolor=08090C&data=${encodeURIComponent(currentStreamUrl)}`;

  return (
    <div className="w-full max-w-3xl mx-auto studio-card rounded-2xl p-5 sm:p-7 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-24 sm:pb-7">
      {/* Media Header Framing */}
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Poster / Thumbnail */}
        <div className="relative w-full sm:w-64 aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/[0.08] shrink-0">
          {media.thumbnail && (
            <img
              src={media.thumbnail}
              alt={media.title}
              className="w-full h-full object-cover"
            />
          )}

          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider bg-black/70 backdrop-blur-md text-slate-200 border border-white/10">
            {media.platform.name}
          </div>

          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-slate-300 text-[11px] font-mono flex items-center gap-1 border border-white/10">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{media.durationFormatted}</span>
          </div>
        </div>

        {/* Media Metadata */}
        <div className="flex-1 space-y-2.5 w-full min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-white line-clamp-2 leading-snug">
            {media.title}
          </h2>

          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-300">
              <User className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[140px] sm:max-w-none">{media.uploader}</span>
            </div>

            {selectedStream?.filesizeFormatted && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-slate-200 font-medium text-[11px]">
                <HardDrive className="w-3 h-3 text-slate-400" />
                <span>{selectedStream.filesizeFormatted}</span>
              </div>
            )}

            {(startTime || endTime) && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-slate-200 font-medium text-[11px]">
                <Scissors className="w-3 h-3 text-slate-400" />
                <span>{startTime || '0:00'} - {endTime || 'end'}</span>
              </div>
            )}

            <a
              href={media.webpageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors ml-auto sm:ml-0 text-[11px]"
            >
              <span>Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Minimalist Audio Spectrum */}
          <div className="pt-1">
            <AudioWaveform isPlaying={isPlayingAudio} />
          </div>
        </div>
      </div>

      {/* Format Selector */}
      <FormatSelector
        videoStreams={media.videoStreams}
        audioStreams={media.audioStreams}
        thumbnailUrl={media.thumbnail}
        mediaTitle={media.title}
        duration={media.duration}
        onSelectStream={(stream) => setSelectedStream(stream)}
        activeStreamId={selectedStream?.formatId || null}
        onPreviewAudio={() => setIsPlayingAudio(!isPlayingAudio)}
        isPreviewingAudio={isPlayingAudio}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
      />

      {/* Desktop Precision Command Bar */}
      <div className="hidden sm:flex pt-4 border-t border-white/[0.06] items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-slate-500">Selected:</span>
          <span className="text-white font-medium">{selectedStream?.qualityLabel}</span>
          <span className="text-slate-400 uppercase">({selectedStream?.ext})</span>
          <span className="text-slate-200 font-semibold">• {selectedStream?.filesizeFormatted}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQrOpen(true)}
            className="p-2 rounded-xl btn-secondary text-slate-400 hover:text-white"
            title="Scan on Phone"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            onClick={handleNativeShare}
            className="px-3 py-2 rounded-xl btn-secondary text-xs font-mono text-slate-300 flex items-center gap-1.5"
            title="Share Link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl btn-secondary text-xs font-mono text-slate-300 flex items-center gap-1.5"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-5 py-2 rounded-xl btn-primary text-xs font-semibold flex items-center gap-2 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {selectedStream?.ext.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Minimalist Mobile Sticky Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08090C]/95 backdrop-blur-2xl border-t border-white/[0.08] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-mono text-slate-400 truncate">
            {selectedStream?.qualityLabel} ({selectedStream?.ext.toUpperCase()})
          </div>
          <div className="text-xs font-mono font-semibold text-white truncate">
            {selectedStream?.filesizeFormatted}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleNativeShare}
            className="p-2.5 rounded-xl btn-secondary text-slate-300 active:scale-95"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2.5 rounded-xl btn-primary text-xs font-bold flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* QR Code Phone Modal */}
      {isQrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-[#0E1117] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-white font-semibold text-xs tracking-wider font-mono">
                <QrCode className="w-4 h-4 text-slate-400" />
                <span>Phone Transfer</span>
              </div>
              <button
                onClick={() => setIsQrOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Scan with your phone camera to download directly to your mobile device.
            </p>

            <div className="p-3 bg-[#08090C] rounded-xl border border-white/[0.06] flex items-center justify-center">
              <img
                src={qrCodeImageUrl}
                alt="Download QR Code"
                className="w-44 h-44 rounded-lg"
              />
            </div>

            <div className="text-[11px] font-mono text-slate-300 bg-white/[0.04] py-1 px-2.5 rounded-lg border border-white/[0.06]">
              {selectedStream?.qualityLabel} • {selectedStream?.filesizeFormatted}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
