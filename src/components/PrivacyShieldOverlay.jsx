import React from 'react';
import { useGame } from '../context/SocketContext';

export const PrivacyShieldOverlay = () => {
  const { shieldActive, toggleShield, lang } = useGame();

  if (!shieldActive) return null;

  return (
    <div
      onClick={toggleShield}
      className="fixed inset-0 z-50 bg-[#0d0e12]/98 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none animate-in fade-in duration-150"
    >
      <div className="w-20 h-20 rounded-full bg-surface-container-high border border-surface-variant flex items-center justify-center mb-5 shadow-2xl">
        <span className="material-symbols-outlined text-[44px] text-tertiary animate-pulse">
          visibility_off
        </span>
      </div>

      <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
        {lang === 'EN' ? 'PRIVACY SHIELD ACTIVE' : '화면 가림막 모드 작동 중'}
      </h2>

      <p className="text-sm text-on-surface-variant max-w-xs mb-8 leading-relaxed">
        {lang === 'EN'
          ? 'Shoulder-surfing protection is enabled. Tap anywhere on the screen to return.'
          : '주변 엿보기 방지를 위해 화면이 숨겨져 있습니다. 화면을 터치하면 해제됩니다.'}
      </p>

      <div className="px-5 py-2.5 rounded-full bg-surface-container border border-surface-variant/40 text-xs font-semibold text-outline flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">touch_app</span>
        <span>{lang === 'EN' ? 'Tap screen to unlock' : '화면을 터치하여 복귀'}</span>
      </div>
    </div>
  );
};
