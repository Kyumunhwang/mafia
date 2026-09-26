import React from 'react';
import { useGame } from '../context/SocketContext';
import { SCENARIOS } from '../scenarios';

export const RulesModal = ({ isOpen, onClose }) => {
  const { roomState, lang } = useGame();
  if (!isOpen) return null;

  const currentTheme = roomState?.theme || 'classic';
  const scenario = SCENARIOS[currentTheme] || SCENARIOS.classic;

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md flex flex-col justify-end p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-low border border-surface-variant/50 rounded-2xl p-5 max-h-[85vh] overflow-y-auto flex flex-col gap-4 shadow-2xl max-w-md mx-auto w-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">local_library</span>
            <h3 className="font-headline font-bold text-lg text-on-surface">
              {lang === 'EN' ? `${scenario.title} Rules` : `${scenario.titleKo} 규칙`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Roles Breakdown */}
        <div>
          <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-outline mb-2">
            {lang === 'EN' ? 'Character Roles' : '역할 구성'}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(scenario.roles).map(([roleKey, role]) => (
              <div key={roleKey} className="rounded-xl bg-surface-container p-3 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg ${role.badgeBg} flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined ${role.color} text-[20px]`}>{role.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`font-bold text-sm ${role.color}`}>
                      {lang === 'EN' ? role.name : role.nameKo}
                    </p>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant uppercase font-semibold">
                      {role.team}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">
                    {lang === 'EN' ? role.desc : role.descKo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase Walkthrough */}
        <div className="space-y-2.5">
          <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-outline">
            {lang === 'EN' ? 'Game Phases' : '게임 진행 단계'}
          </h4>
          <div className="bg-surface-container p-3 rounded-xl border border-surface-variant/30">
            <h5 className="font-bold text-xs text-primary mb-1 flex items-center gap-1.5">
              <span>🌙</span> {lang === 'EN' ? 'Night Phase' : '밤의 페이즈'}
            </h5>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {lang === 'EN'
                ? 'Everyone holds their phone face-down. In secret, Mafia picks a target, the Doctor heals, and the Detective inspects one player.'
                : '모든 참가자는 폰을 엎어둡니다. 진동 신호에 따라 마피아는 표적을 고르고, 의사는 수호할 사람을, 경찰은 마피아 용의자를 확인합니다.'}
            </p>
          </div>

          <div className="bg-surface-container p-3 rounded-xl border border-surface-variant/30">
            <h5 className="font-bold text-xs text-secondary mb-1 flex items-center gap-1.5">
              <span>☀️</span> {lang === 'EN' ? 'Day & Discussion' : '낮과 토론 페이즈'}
            </h5>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {lang === 'EN'
                ? 'Casualties are revealed at dawn. Players hold open discussions until the timer expires, then vote for the prime suspect.'
                : '지난밤 희생자 여부가 공개되며 자유 토론이 진행됩니다. 의심스러운 인물을 지목하여 최후 변론과 처형 투표가 시작됩니다.'}
            </p>
          </div>

          <div className="bg-surface-container p-3 rounded-xl border border-surface-variant/30">
            <h5 className="font-bold text-xs text-tertiary mb-1 flex items-center gap-1.5">
              <span>🛡️</span> {lang === 'EN' ? 'Shoulder-Surfing Shield' : '화면 가림막 보안'}
            </h5>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {lang === 'EN'
                ? 'Your secret role card is veiled by default. Press and hold the "Hold to Peek" button to reveal it. Releasing instantly conceals your screen.'
                : '신분 카드는 평소 암호화 커튼으로 숨겨져 있으며, 화면을 누르고 있을 때만 투명화되어 옆 사람의 엿보기를 완벽히 방지합니다.'}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-primary-container text-on-primary-container font-headline font-bold text-sm shadow-md active:scale-98 transition-transform"
        >
          {lang === 'EN' ? 'Got it, Return to Game' : '확인 완료, 게임으로 복귀'}
        </button>
      </div>
    </div>
  );
};
