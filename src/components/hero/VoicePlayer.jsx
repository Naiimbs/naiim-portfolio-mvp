import React, { useState, useRef, useEffect } from 'react';
import audioSrc from '../../assets/audio/naim-intro-placeholder.wav';
import portraitImg from '../../assets/images/naim-portrait.jpg';

const WAVEFORM_HEIGHTS = [
  12, 22, 15, 29, 19, 11, 25, 17, 31, 20, 14, 27, 18, 23, 12, 30, 17, 25, 14,
  21, 29, 16, 12, 26, 19, 31, 15, 23, 18, 28, 13, 20, 30, 17, 25, 12, 22, 16,
  29, 19, 14, 27, 18, 24, 11, 30, 16, 22, 13, 26, 18, 29,
];

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:47';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function VoicePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeDisplay, setTimeDisplay] = useState('0:47');
  const audioRef = useRef(null);
  const waveRef = useRef(null);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Audio playback failed:', error);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const remaining = Math.max(0, (audio.duration || 0) - audio.currentTime);
    setTimeDisplay(formatTime(remaining));
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setTimeDisplay(formatTime(audio.duration));
  };

  const handleEnded = () => {
    const audio = audioRef.current;
    setIsPlaying(false);
    if (audio) {
      setTimeDisplay(formatTime(audio.duration));
    }
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;
    const wave = waveRef.current;
    if (!audio || !wave || !audio.duration) return;

    const rect = wave.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    audio.currentTime = position * audio.duration;
  };

  return (
    <div className="status-card audio-card">
      <img src={portraitImg} alt="Naïm portrait used for the hero audio introduction" />
      <div className="audio-card-copy">
        <strong>Naïm</strong>
        <span>Product Designer & AI Builder</span>
        <div className={`voice-player ${isPlaying ? 'is-playing' : ''}`} id="voicePlayer">
          <button
            className="voice-play"
            id="voicePlay"
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause introduction' : 'Play introduction'}
          >
            <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
          </button>

          <div
            className="voice-wave"
            id="voiceWave"
            ref={waveRef}
            onClick={handleSeek}
            aria-label="Audio progress"
          >
            {WAVEFORM_HEIGHTS.map((height, index) => (
              <span
                key={index}
                style={{
                  '--h': `${height}px`,
                  '--i': index,
                }}
              />
            ))}
          </div>

          <span className="voice-time" id="voiceTime">
            {timeDisplay}
          </span>

          <audio
            ref={audioRef}
            id="voiceAudio"
            preload="metadata"
            src={audioSrc}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />
        </div>
      </div>
    </div>
  );
}
