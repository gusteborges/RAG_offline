// ============================================================
// AUDIO PLAYER COMPONENT — Web Audio API (zero dependencies)
// ============================================================
import { useState, useRef, useEffect } from 'react';
import './AudioPlayer.css';

interface AudioPlayerProps {
  src: string;
  title?: string;
}

function formatTime(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ src, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd  = () => setPlaying(false);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrentTime(Number(e.target.value));
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    setMuted(v === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    audio.muted = next;
    setMuted(next);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={src} preload="metadata" />

      {title && (
        <div className="audio-title">
          <span className="audio-icon">♪</span>
          <span className="truncate">{title}</span>
        </div>
      )}

      <div className="audio-timeline">
        <span className="audio-time">{formatTime(currentTime)}</span>
        <div className="audio-progress-wrap">
          <div className="audio-progress-fill" style={{ width: `${progress}%` }} />
          <input
            id="audio-seek"
            className="audio-seek-input"
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={seek}
            aria-label="Posição do áudio"
          />
        </div>
        <span className="audio-time">{formatTime(duration)}</span>
      </div>

      <div className="audio-controls">
        <button
          id="audio-play-pause"
          className="audio-play-btn"
          onClick={togglePlay}
          aria-label={playing ? 'Pausar' : 'Reproduzir'}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <div className="audio-volume">
          <button
            id="audio-mute"
            className="audio-mute-btn"
            onClick={toggleMute}
            aria-label={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </button>
          <input
            id="audio-volume"
            type="range"
            min={0} max={1} step={0.05}
            value={muted ? 0 : volume}
            onChange={changeVolume}
            className="audio-volume-input"
            aria-label="Volume"
          />
        </div>

        <a
          href={src}
          download
          className="btn btn-ghost btn-sm"
          id="audio-download"
        >
          ⬇ Download
        </a>
      </div>
    </div>
  );
}
