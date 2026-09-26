import React from 'react';
import { useGame } from '../context/SocketContext';

export const Header = ({ onOpenQR, onOpenRules, onOpenSound }) => {
  const { roomState, lang, toggleLang, shieldActive, toggleShield, soundEnabled, bgmEnabled, showToast } = useGame();

  const copyRoomCode = () => {
    if (!roomState?.roomCode) return;
    navigator.clipboard?.writeText(roomState.roomCode);
    showToast(lang === 'EN' ? `Room Code #${roomState.roomCode} copied!` : `방 코드 #${roomState.roomCode} 복사 완료!`);
  };

  const currentPlayer = roomState?.players?.find(p => p.id === roomState?.myPlayerId);

  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl border-b border-surface-container-high/40 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="h-16 px-4 flex items-center justify-between max-w-md mx-auto">
        {/* Left: Room Status & Code */}
        <div className="flex items-center gap-2">
          {roomState ? (
            <div
              onClick={copyRoomCode}
              role="button"
              className="flex items-center gap-1.5 bg-surface-container/80 hover:bg-surface-container-high rounded-full py-1 px-3 cursor-pointer border border-surface-variant/40 transition-colors"
              title="Click to copy room code"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-headline font-bold text-xs text-on-surface tracking-wider">
                #{roomState.roomCode}
              </span>
              <span className="material-symbols-outlined text-[15px] text-outline">content_copy</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[22px]">theater_comedy</span>
              <span className="font-headline font-bold text-sm tracking-wider text-on-surface">MAFIA PARTY</span>
            </div>
          )}
        </div>

        {/* Right: Controls & Utilities */}
        <div className="flex items-center gap-1.5">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={toggleLang}
            aria-label="Toggle Language"
            className="h-9 px-2.5 flex items-center justify-center rounded-lg bg-surface-container-high/60 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors border border-surface-variant/30"
          >
            {lang === 'EN' ? 'KO' : 'EN'}
          </button>

          {/* Privacy Shield Button */}
          <button
            type="button"
            onClick={toggleShield}
            aria-label="Toggle Privacy Shield"
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors border ${
              shieldActive
                ? 'bg-tertiary/20 text-tertiary border-tertiary/40'
                : 'bg-surface-container-high/60 text-on-surface-variant border-surface-variant/30 hover:text-on-surface'
            }`}
            title="Toggle Privacy Shield"
          >
            <span className="material-symbols-outlined text-[19px]">
              {shieldActive ? 'visibility_off' : 'visibility'}
            </span>
          </button>

          {/* Audio & BGM Controller Modal Trigger */}
          <button
            type="button"
            onClick={onOpenSound}
            aria-label="Audio & BGM Controller"
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors border ${
              bgmEnabled
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-surface-container-high/60 text-on-surface-variant border-surface-variant/30 hover:text-on-surface'
            }`}
            title="Audio & Theme BGM Settings"
          >
            <span className="material-symbols-outlined text-[19px]">
              {bgmEnabled ? 'music_note' : soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </button>

          {/* QR Code */}
          {roomState && (
            <button
              type="button"
              onClick={onOpenQR}
              aria-label="Show QR Invite"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface transition-colors border border-surface-variant/30"
              title="QR Code Invite"
            >
              <span className="material-symbols-outlined text-[19px]">qr_code_2</span>
            </button>
          )}

          {/* Rulebook */}
          <button
            type="button"
            onClick={onOpenRules}
            aria-label="Open Rulebook"
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface transition-colors border border-surface-variant/30"
            title="Scenario Rules"
          >
            <span className="material-symbols-outlined text-[19px]">menu_book</span>
          </button>

          {/* Player Avatar */}
          {currentPlayer && (
            <div
              className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-sm ml-1"
              title={currentPlayer.nickname}
            >
              {currentPlayer.avatar || '👤'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
