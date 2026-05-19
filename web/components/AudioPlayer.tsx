'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Download } from 'lucide-react';

interface Props {
  src: string;
  downloadName?: string;
  size?: 'lg' | 'md' | 'sm';
  showDownload?: boolean;
  onTimeUpdate?: (currentSeconds: number, durationSeconds: number) => void;
  onPlayStateChange?: (playing: boolean) => void;
}

// Deterministic pseudo-random heights so the "waveform" is unique per src but stable across renders.
function bars(seed: string, count: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    // weighted: center bars higher, edges lower (sine envelope)
    const env = Math.sin((Math.PI * i) / (count - 1));
    const r = (h % 1000) / 1000; // 0..1
    const h01 = 0.22 + r * 0.78 * env; // 0.22..1.0 ish
    out.push(h01);
  }
  return out;
}

export default function AudioPlayer({
  src,
  downloadName,
  size = 'lg',
  showDownload = true,
  onTimeUpdate,
  onPlayStateChange,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const numBars = size === 'sm' ? 36 : size === 'md' ? 48 : 64;
  const heights = useMemo(() => bars(src, numBars), [src, numBars]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime, audio.duration || 0);
    };
    const onEnded = () => {
      setPlaying(false);
      onPlayStateChange?.(false);
    };
    const onErr = () => setError('audio unavailable');
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onErr);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onErr);
    };
  }, [onTimeUpdate, onPlayStateChange]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
        onPlayStateChange?.(false);
      } else {
        await audio.play();
        setPlaying(true);
        onPlayStateChange?.(true);
      }
    } catch {
      setError('audio playback blocked');
    }
  };

  const seek = (clientX: number) => {
    const audio = audioRef.current;
    const track = trackRef.current;
    if (!audio || !track || !duration) return;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
    setCurrentTime(audio.currentTime);
  };

  const fmt = (s: number) => {
    if (!Number.isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const progress = duration ? currentTime / duration : 0;
  const playSize = size === 'sm' ? 'w-12 h-12' : size === 'md' ? 'w-16 h-16' : 'w-20 h-20';
  const playIcon = size === 'sm' ? 18 : size === 'md' ? 22 : 26;
  const barWidth = size === 'sm' ? 'w-[3px]' : 'w-[4px]';
  const barGap = size === 'sm' ? 'gap-[3px]' : 'gap-[4px]';
  const containerHeight = size === 'sm' ? 'h-12' : size === 'md' ? 'h-14' : 'h-16';

  return (
    <div className="w-full">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-4">
        <button
          aria-label={playing ? 'pause' : 'play'}
          onClick={toggle}
          className={`${playSize} rounded-full bg-amber text-bg flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 ${playing ? 'play-pulse' : ''}`}
        >
          {playing ? <Pause size={playIcon} fill="currentColor" /> : <Play size={playIcon} fill="currentColor" style={{ marginLeft: '2px' }} />}
        </button>

        <div className="flex-1 min-w-0">
          <div
            ref={trackRef}
            className={`relative ${containerHeight} flex items-center ${barGap} cursor-pointer select-none`}
            onClick={(e) => seek(e.clientX)}
          >
            {heights.map((h, i) => {
              const barProgress = (i + 1) / heights.length;
              const active = barProgress <= progress;
              const justPlayed = Math.abs(barProgress - progress) < 1 / heights.length / 2;
              return (
                <div
                  key={i}
                  className={`${barWidth} rounded-full transition-colors duration-100 ${
                    justPlayed
                      ? 'bg-amber-bright'
                      : active
                      ? 'bg-amber'
                      : 'bg-fg-dim'
                  }`}
                  style={{ height: `${Math.max(12, h * 100)}%` }}
                />
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[0.75rem] text-fg-muted tabular-nums">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-[0.8125rem] text-error">
          {error}. <a href={src} download={downloadName} className="underline">download instead</a>
        </p>
      ) : null}

      {showDownload ? (
        <a
          href={src}
          download={downloadName ?? 'oath-ritual.mp3'}
          className="mt-4 inline-flex items-center gap-2 text-[0.8125rem] text-fg-muted hover:text-amber transition-colors"
        >
          <Download size={14} />
          download mp3
        </a>
      ) : null}
    </div>
  );
}
