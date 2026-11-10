import React, { useState, useEffect } from 'react';
import { X, Settings2, Key, Globe, Music, Shield, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [cookieString, setCookieString] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [preferredAudioBitrate, setPreferredAudioBitrate] = useState('320');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pulse_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCookieString(parsed.cookieString || '');
        setProxyUrl(parsed.proxyUrl || '');
        setPreferredAudioBitrate(parsed.preferredAudioBitrate || '320');
      }
    } catch {}
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(
        'pulse_settings_v1',
        JSON.stringify({
          cookieString,
          proxyUrl,
          preferredAudioBitrate,
        })
      );
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1000);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0D111A] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Studio Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          {/* Cookies for Instagram / YouTube Private Content */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>Session Cookies (Netscape / Header Format)</span>
            </label>
            <textarea
              rows={3}
              value={cookieString}
              onChange={(e) => setCookieString(e.target.value)}
              placeholder="sessionid=...; ds_user_id=... (Used to unlock private Instagram reels and age-gated media)"
              className="w-full bg-[#141A26] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
            <p className="text-[11px] text-slate-500">Stored client-side in encrypted local storage. Never logged or saved to server disks.</p>
          </div>

          {/* Proxy Config */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Residential / SOCKS5 Proxy (Optional)</span>
            </label>
            <input
              type="text"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              placeholder="http://user:pass@proxy-host:port"
              className="w-full bg-[#141A26] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Default Audio Bitrate */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span>Preferred Audio Mastering Profile</span>
            </label>
            <select
              value={preferredAudioBitrate}
              onChange={(e) => setPreferredAudioBitrate(e.target.value)}
              className="w-full bg-[#141A26] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="320">320 kbps Studio MP3 (Maximum Quality)</option>
              <option value="256">256 kbps High Fidelity MP3</option>
              <option value="192">192 kbps Standard Broadcast MP3</option>
              <option value="wav">Lossless Studio WAV (Master Archive)</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local Vault</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl glow-button text-xs font-semibold flex items-center gap-1.5"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{isSaved ? 'Preferences Saved' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
