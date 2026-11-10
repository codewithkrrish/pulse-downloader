import React, { useState } from 'react';
import { Video, Music, Download, Check, Volume2, Shield, Image as ImageIcon, Scissors, Clock } from 'lucide-react';
import { FormattedStream } from '../lib/formatters';
import { buildThumbnailUrl } from '../lib/api';

interface FormatSelectorProps {
  videoStreams: FormattedStream[];
  audioStreams: FormattedStream[];
  thumbnailUrl?: string;
  mediaTitle: string;
  duration: number;
  onSelectStream: (stream: FormattedStream) => void;
  activeStreamId: string | null;
  onPreviewAudio: (stream: FormattedStream) => void;
  isPreviewingAudio: boolean;
  startTime: string;
  setStartTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  videoStreams,
  audioStreams,
  thumbnailUrl,
  mediaTitle,
  onSelectStream,
  activeStreamId,
  onPreviewAudio,
  isPreviewingAudio,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'thumbnail' | 'trim'>('video');

  const handleDownloadThumbnail = () => {
    if (!thumbnailUrl) return;
    const url = buildThumbnailUrl(thumbnailUrl, mediaTitle);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mediaTitle}-cover.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full space-y-4">
      {/* Studio Minimalist Tab Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#090C12] border border-white/[0.06] overflow-x-auto max-w-full scrollbar-none">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'video'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video ({videoStreams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'audio'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Audio ({audioStreams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('thumbnail')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'thumbnail'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Cover Art</span>
          </button>

          <button
            onClick={() => setActiveTab('trim')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'trim'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Clip & Trim</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 shrink-0">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Zero-Disk Stream</span>
        </div>
      </div>

      {/* Tab 1: Video Streams List */}
      {activeTab === 'video' && (
        <div className="space-y-2">
          {videoStreams.map((stream) => {
            const isSelected = activeStreamId === stream.formatId;
            return (
              <div
                key={stream.formatId}
                onClick={() => onSelectStream(stream)}
                className={`group flex items-center justify-between p-3 sm:px-4 sm:py-3 rounded-xl cursor-pointer transition-all active:scale-[0.99] border ${
                  isSelected
                    ? 'bg-white/[0.06] border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                    : 'bg-[#0A0D14]/70 hover:bg-[#0E121B] border-white/[0.04] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'bg-slate-700 group-hover:bg-slate-500'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-100">{stream.qualityLabel}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                        {stream.ext}
                      </span>
                      {stream.isBest && (
                        <span className="text-[9px] font-mono tracking-wider font-semibold text-slate-300 px-1.5 py-0.2 rounded bg-white/[0.08]">
                          MAX
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-slate-300 font-medium">
                    {stream.filesizeFormatted}
                  </span>
                  <div className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-white text-slate-950' : 'bg-white/[0.04] text-slate-400 group-hover:text-white'}`}>
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Audio Streams List */}
      {activeTab === 'audio' && (
        <div className="space-y-2">
          {audioStreams.map((stream) => {
            const isSelected = activeStreamId === stream.formatId;
            return (
              <div
                key={stream.formatId}
                onClick={() => onSelectStream(stream)}
                className={`group flex items-center justify-between p-3 sm:px-4 sm:py-3 rounded-xl cursor-pointer transition-all active:scale-[0.99] border ${
                  isSelected
                    ? 'bg-white/[0.06] border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                    : 'bg-[#0A0D14]/70 hover:bg-[#0E121B] border-white/[0.04] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'bg-slate-700 group-hover:bg-slate-500'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-100">{stream.qualityLabel}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                        {stream.ext}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewAudio(stream);
                    }}
                    className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                    title="Audio Spectrum Preview"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isPreviewingAudio ? 'text-white' : ''}`} />
                  </button>

                  <span className="text-xs font-mono text-slate-300 font-medium">
                    {stream.filesizeFormatted}
                  </span>

                  <div className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-white text-slate-950' : 'bg-white/[0.04] text-slate-400 group-hover:text-white'}`}>
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Minimalist Cover Art */}
      {activeTab === 'thumbnail' && (
        <div className="p-5 rounded-2xl bg-[#090C12] border border-white/[0.06] flex flex-col md:flex-row gap-5 items-center">
          <div className="w-full md:w-64 aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/[0.08] shrink-0">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={mediaTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-mono">No Cover</div>
            )}
          </div>
          <div className="flex-1 space-y-2.5 text-center md:text-left w-full">
            <h3 className="text-sm font-semibold text-slate-100">Original Artwork</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Uncompressed studio cover image in high-resolution JPG format.
            </p>
            <div className="pt-1 flex flex-wrap gap-2.5 justify-center md:justify-start">
              <button
                onClick={handleDownloadThumbnail}
                className="px-4 py-2 rounded-xl btn-primary text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Artwork (JPG)</span>
              </button>
              <a
                href={thumbnailUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl btn-secondary text-xs font-mono text-slate-300"
              >
                Fullscreen
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Minimalist Clip / Trim Scrubber */}
      {activeTab === 'trim' && (
        <div className="p-5 rounded-2xl bg-[#090C12] border border-white/[0.06] space-y-4">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs tracking-wider uppercase font-mono">
            <Scissors className="w-3.5 h-3.5 text-slate-400" />
            <span>Time-Range Scrubber</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Start Time (MM:SS)</span>
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="00:00"
                className="w-full bg-[#11141C] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-white/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>End Time (MM:SS)</span>
              </label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="00:30"
                className="w-full bg-[#11141C] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-white/20"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
            <span className="text-slate-500">Presets:</span>
            <button
              onClick={() => { setStartTime('00:00'); setEndTime('00:15'); }}
              className="px-2.5 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06]"
            >
              15s
            </button>
            <button
              onClick={() => { setStartTime('00:00'); setEndTime('00:30'); }}
              className="px-2.5 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06]"
            >
              30s
            </button>
            <button
              onClick={() => { setStartTime('00:00'); setEndTime('01:00'); }}
              className="px-2.5 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06]"
            >
              60s
            </button>
            <button
              onClick={() => { setStartTime(''); setEndTime(''); }}
              className="px-2.5 py-0.5 rounded-md bg-white/[0.04] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-white/[0.06]"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
