import React from 'react';
import { useGame, bgmEngine, sounds } from '../context/SocketContext';
import { SCENARIOS } from '../scenarios';

export const SoundModal = ({ isOpen, onClose }) => {
  const {
    roomState,
    lang,
    bgmEnabled,
    toggleBgm,
    bgmVolume,
    setBgmVolume,
    soundEnabled,
    toggleSound,
    showToast
  } = useGame();

  if (!isOpen) return null;

  const currentTheme = roomState?.theme || 'classic';
  const scenario = SCENARIOS[currentTheme] || SCENARIOS.classic;

  const THEME_TRACK_NAMES = {
    classic: { title: 'Rainy City Noir Jazz', desc: 'Melancholic walking double bass & muted piano blues' },
    school: { title: 'Midnight Music Box', desc: 'Chilling celesta chimes with suspenseful heartbeat pulse' },
    space: { title: 'Deep Space Cybernetic Pulse', desc: 'Futuristic 110 BPM synth arpeggios & reactor drone' },
    vampire: { title: 'Cathedral Pipe Organ', desc: 'Baroque minor organ chords & gothic funeral bell toll' }
  };

  const trackInfo = THEME_TRACK_NAMES[currentTheme] || THEME_TRACK_NAMES.classic;

  const handlePreviewTheme = (themeKey) => {
    sounds.playAction();
    bgmEngine.playTheme(themeKey);
    showToast(lang === 'EN' ? `Previewing: ${THEME_TRACK_NAMES[themeKey].title}` : `미리듣기: ${THEME_TRACK_NAMES[themeKey].title}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-low border border-surface-variant/50 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">music_note</span>
            <h3 className="font-headline font-bold text-base text-on-surface">
              {lang === 'EN' ? 'Audio & Theme BGM' : '사운드 및 테마 BGM 설정'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Current Active Track Card */}
        <div className="rounded-2xl bg-surface-container border border-surface-variant/40 p-3.5 flex items-center gap-3 shadow-inner">
          <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary shrink-0 relative overflow-hidden">
            <span className="material-symbols-outlined text-[26px]">album</span>
            {bgmEnabled && (
              <span className="absolute inset-0 bg-primary/20 rounded-xl animate-ping opacity-30"></span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                {lang === 'EN' ? 'Now Playing' : '현재 재생 중'}
              </span>
              <span className="text-[10px] text-tertiary font-bold">{scenario.title}</span>
            </div>
            <p className="font-headline font-bold text-xs text-on-surface truncate mt-0.5">
              {trackInfo.title}
            </p>
            <p className="text-[11px] text-on-surface-variant truncate">{trackInfo.desc}</p>
          </div>
        </div>

        {/* Master Controls */}
        <div className="space-y-3">
          {/* BGM Toggle & Volume */}
          <div className="p-3 rounded-2xl bg-surface-container border border-surface-variant/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">equalizer</span>
                <span className="font-bold text-xs text-on-surface">
                  {lang === 'EN' ? 'Procedural Theme BGM' : '테마 배경음악 (BGM)'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleBgm}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  bgmEnabled
                    ? 'bg-primary-container text-on-primary-container shadow-sm'
                    : 'bg-surface-container-high text-outline'
                }`}
              >
                {bgmEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Volume Slider */}
            {bgmEnabled && (
              <div className="flex items-center gap-3 pt-1">
                <span className="material-symbols-outlined text-[16px] text-outline">volume_mute</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                  className="flex-1 accent-primary h-1.5 bg-surface-container-highest rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-mono text-outline w-8 text-right">
                  {Math.round(bgmVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* SFX Toggle */}
          <div className="p-3 rounded-2xl bg-surface-container border border-surface-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]">notifications</span>
              <div>
                <span className="font-bold text-xs text-on-surface block">
                  {lang === 'EN' ? 'Sound FX (Ticks, Gongs)' : '게임 효과음 (타이머, 징소리)'}
                </span>
                <span className="text-[10px] text-outline">
                  {lang === 'EN' ? 'Synthesized Audio FX' : '자체 신디사이저 효과음'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                soundEnabled
                  ? 'bg-tertiary-container text-on-tertiary-container shadow-sm'
                  : 'bg-surface-container-high text-outline'
              }`}
            >
              {soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* 4 Theme Soundtracks Preview Grid */}
        <div>
          <span className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-2">
            {lang === 'EN' ? 'Preview 4 Scenario Tracks' : '4대 시나리오 음원 미리듣기'}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(THEME_TRACK_NAMES).map(([key, track]) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePreviewTheme(key)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  currentTheme === key
                    ? 'bg-surface-container-high border-primary/50 text-primary'
                    : 'bg-surface-container border-surface-variant/30 text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold truncate">{SCENARIOS[key].title}</span>
                  <span className="material-symbols-outlined text-[15px]">play_circle</span>
                </div>
                <p className="text-[10px] text-outline truncate">{track.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline font-bold text-xs border border-surface-variant/40 transition-colors shadow-md"
        >
          {lang === 'EN' ? 'Done' : '완료'}
        </button>
      </div>
    </div>
  );
};
