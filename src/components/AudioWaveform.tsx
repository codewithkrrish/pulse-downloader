import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isPlaying: boolean;
  color?: string;
  barsCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isPlaying,
  barsCount = 52,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const totalBarSpace = width / barsCount;
      const barWidth = 2;

      for (let i = 0; i < barsCount; i++) {
        const x = i * totalBarSpace + (totalBarSpace - barWidth) / 2;
        
        // Gentle, fluid audio frequency oscillation
        const freq = isPlaying
          ? Math.sin(phase + i * 0.2) * 0.35 + Math.sin(phase * 1.2 + i * 0.12) * 0.25 + 0.35
          : Math.sin(i * 0.18) * 0.12 + 0.15;

        const barHeight = Math.max(3, freq * height * 0.8);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
          gradient.addColorStop(1, 'rgba(148, 163, 184, 0.3)');
        } else {
          gradient.addColorStop(0, 'rgba(148, 163, 184, 0.35)');
          gradient.addColorStop(1, 'rgba(71, 85, 105, 0.15)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 1);
        ctx.fill();
      }

      phase += isPlaying ? 0.05 : 0.012;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, barsCount]);

  return (
    <div className="relative w-full h-12 rounded-xl bg-[#090B10] border border-white/[0.06] p-2 flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={400}
        height={48}
        className="w-full h-full"
      />
      <div className="absolute right-3 top-2 flex items-center gap-1.5 text-[9px] font-mono tracking-wider text-slate-400">
        <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-white animate-pulse' : 'bg-slate-600'}`} />
        <span>{isPlaying ? 'AUDIO LIVE' : 'SPECTRUM IDLE'}</span>
      </div>
    </div>
  );
};
