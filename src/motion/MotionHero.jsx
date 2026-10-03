import React, { useState, useEffect, useRef } from 'react';
import './motion.css';

// Scenes V2
import DesignScene from './scenes/DesignScene';
import BuildScene from './scenes/BuildScene';
import AIScene from './scenes/AIScene';
import AutomationScene from './scenes/AutomationScene';
import OutroScene from './scenes/OutroScene';

export default function MotionHero({
  autoPlay = true,
  defaultScene = 'all',
  showControls = true,
}) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialScene = searchParams?.get('scene') || defaultScene;
  const [selectedScene, setSelectedScene] = useState(initialScene);
  const [currentTime, setCurrentTime] = useState(() => {
    if (initialScene === '02') return 5;
    if (initialScene === '03') return 10;
    if (initialScene === '04') return 15;
    if (initialScene === '05') return 20;
    return 0;
  });
  const animationRef = useRef(null);
  const lastTimestampRef = useRef(null);

  // V2 Scene timing configuration (Total: 24 seconds)
  const SCENE_CONFIG = [
    { id: '01', name: 'Design', start: 0, end: 5, label: '01 DESIGN' },
    { id: '02', name: 'Build', start: 5, end: 10, label: '02 BUILD' },
    { id: '03', name: 'AI', start: 10, end: 15, label: '03 AI' },
    { id: '04', name: 'Automation', start: 15, end: 20, label: '04 AUTOMATION' },
    { id: '05', name: 'Outro', start: 20, end: 24, label: '05 OUTRO' },
  ];

  const TOTAL_DURATION = 24;

  // Master Clock tick (smooth rAF)
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      lastTimestampRef.current = null;
      return;
    }

    const tick = (timestamp) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      setCurrentTime((prevTime) => {
        let nextTime = prevTime + delta;

        if (selectedScene !== 'all') {
          const currentConfig = SCENE_CONFIG.find((s) => s.id === selectedScene);
          if (currentConfig && nextTime >= currentConfig.end) {
            return currentConfig.start;
          }
        } else if (nextTime >= TOTAL_DURATION) {
          return 0; // Seamless loop
        }

        return nextTime;
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, selectedScene]);

  // Active scene calculation
  const activeSceneConfig =
    SCENE_CONFIG.find((s) => currentTime >= s.start && currentTime < s.end) || SCENE_CONFIG[0];
  const sceneProgress = Math.max(
    0,
    Math.min(
      1,
      (currentTime - activeSceneConfig.start) /
        (activeSceneConfig.end - activeSceneConfig.start)
    )
  );

  const handleSceneSelect = (sceneId) => {
    setSelectedScene(sceneId);
    if (sceneId === 'all') {
      setCurrentTime(0);
    } else {
      const config = SCENE_CONFIG.find((s) => s.id === sceneId);
      if (config) setCurrentTime(config.start);
    }
  };

  const handleScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const targetTime = Math.max(0, Math.min(TOTAL_DURATION, pos * TOTAL_DURATION));
    setCurrentTime(targetTime);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="motion-player-wrapper">
      {/* 16:9 Viewport */}
      <div className="motion-player-viewport">
        {/* SCENE 01: DESIGN */}
        <DesignScene
          active={activeSceneConfig.id === '01'}
          progress={activeSceneConfig.id === '01' ? sceneProgress : 0}
        />

        {/* SCENE 02: BUILD */}
        <BuildScene
          active={activeSceneConfig.id === '02'}
          progress={activeSceneConfig.id === '02' ? sceneProgress : 0}
        />

        {/* SCENE 03: AI */}
        <AIScene
          active={activeSceneConfig.id === '03'}
          progress={activeSceneConfig.id === '03' ? sceneProgress : 0}
        />

        {/* SCENE 04: AUTOMATION */}
        <AutomationScene
          active={activeSceneConfig.id === '04'}
          progress={activeSceneConfig.id === '04' ? sceneProgress : 0}
        />

        {/* SCENE 05: OUTRO */}
        <OutroScene
          active={activeSceneConfig.id === '05'}
          progress={activeSceneConfig.id === '05' ? sceneProgress : 0}
        />
      </div>

      {/* Control Bar */}
      {showControls && (
        <div className="motion-controls">
          <button
            type="button"
            className="motion-btn-play"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pause motion sequence' : 'Play motion sequence'}
          >
            <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
          </button>

          <div
            className="motion-timeline-track"
            onClick={handleScrub}
            role="slider"
            aria-valuemin="0"
            aria-valuemax={TOTAL_DURATION}
            aria-valuenow={Math.round(currentTime)}
          >
            <div
              className="motion-timeline-progress"
              style={{ width: `${(currentTime / TOTAL_DURATION) * 100}%` }}
            ></div>
          </div>

          <div className="motion-time-display">
            {formatTime(currentTime)} / {formatTime(TOTAL_DURATION)}
          </div>

          <div className="motion-scene-nav">
            <button
              type="button"
              className={`motion-scene-pill ${selectedScene === 'all' ? 'active' : ''}`}
              onClick={() => handleSceneSelect('all')}
            >
              ALL
            </button>
            {SCENE_CONFIG.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`motion-scene-pill ${
                  selectedScene === s.id || (selectedScene === 'all' && activeSceneConfig.id === s.id)
                    ? 'active'
                    : ''
                }`}
                onClick={() => handleSceneSelect(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
