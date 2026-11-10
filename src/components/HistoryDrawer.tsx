import React from 'react';
import { X, Trash2, Download, Clock, ExternalLink, HardDrive } from 'lucide-react';
import { DownloadHistoryItem } from '../lib/formatters';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: DownloadHistoryItem[];
  onClear: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#0D111A] border-l border-white/10 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Session Library</h3>
            <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                title="Clear all history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* History Items List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <Clock className="w-10 h-10 stroke-1 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">No media downloaded yet</p>
              <p className="text-xs text-slate-600">Past extractions in this session will appear here for one-click re-download.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-[#141A26] border border-white/5 hover:border-white/10 transition-all flex gap-3 items-center group"
              >
                <div className="w-16 h-12 rounded-lg bg-black/40 overflow-hidden shrink-0 border border-white/5">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 font-mono text-[9px]">
                      {item.ext.toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                    <span style={{ color: item.platformColor }}>{item.platformName}</span>
                    <span>•</span>
                    <span className="text-cyan-400">{item.quality}</span>
                  </div>
                </div>

                <a
                  href={item.downloadUrl}
                  download={`${item.title}.${item.ext}`}
                  className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors shrink-0"
                  title="Re-download"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer Privacy Note */}
        <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <span>Encrypted Local Storage</span>
          <span>Zero Server Tracking</span>
        </div>
      </div>
    </div>
  );
};
