import React from 'react';
import { useGame } from '../context/SocketContext';
import { SCENARIOS } from '../scenarios';

export const ExecutionResultView = () => {
  const { roomState, lang } = useGame();

  if (!roomState) return null;

  const currentTheme = roomState.theme || 'classic';
  const scenario = SCENARIOS[currentTheme] || SCENARIOS.classic;
  const candidate = roomState.executionCandidate;
  const { guilty = 0, innocent = 0 } = roomState.defenseVotes || {};
  const isExecuted = guilty > innocent;

  const roleData = candidate?.role ? scenario.roles[candidate.role] : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] max-w-md mx-auto px-4 py-6 text-center select-none animate-in fade-in duration-300">
      <div className="relative w-full rounded-3xl bg-surface-container border border-surface-variant/50 p-6 flex flex-col items-center shadow-2xl overflow-hidden">
        {/* Glow backdrop */}
        <div
          className={`absolute inset-0 blur-3xl opacity-20 pointer-events-none ${
            isExecuted ? 'bg-error' : 'bg-tertiary'
          }`}
        ></div>

        {/* Verdict Badge */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-xl border-2 ${
            isExecuted
              ? 'bg-error-container/30 border-error text-error animate-bounce'
              : 'bg-tertiary-container/30 border-tertiary text-tertiary'
          }`}
        >
          <span className="material-symbols-outlined text-[40px]">
            {isExecuted ? 'gavel' : 'shield_with_heart'}
          </span>
        </div>

        <span className="font-headline font-extrabold text-xs uppercase tracking-widest text-outline mb-1">
          {lang === 'EN' ? 'Jury Verdict' : '재판 판결 결과'}
        </span>

        <h2 className="font-headline text-2xl font-black text-on-surface mb-2">
          {isExecuted
            ? (lang === 'EN' ? `${candidate?.nickname} was Executed!` : `${candidate?.nickname} 님이 처형되었습니다!`)
            : (lang === 'EN' ? `${candidate?.nickname} was Acquitted!` : `${candidate?.nickname} 님이 무죄로 방면되었습니다!`)}
        </h2>

        {/* Vote Counts */}
        <p className="text-xs text-on-surface-variant mb-6">
          {lang === 'EN'
            ? `Guilty: ${guilty} vs Innocent: ${innocent}`
            : `찬성: ${guilty}표 vs 반대: ${innocent}표`}
        </p>

        {/* Identity Reveal Card if Executed */}
        {isExecuted && roleData && (
          <div className="w-full p-4 rounded-2xl bg-surface-container-high border border-surface-variant/50 flex items-center gap-3 shadow-inner">
            <div className={`w-12 h-12 rounded-xl ${roleData.badgeBg} flex items-center justify-center shrink-0`}>
              <span className={`material-symbols-outlined ${roleData.color} text-[26px]`}>
                {roleData.icon}
              </span>
            </div>
            <div className="text-left min-w-0 flex-1">
              <span className="text-[10px] text-outline uppercase font-semibold">
                {lang === 'EN' ? 'Revealed True Identity' : '공개된 정체'}
              </span>
              <p className={`font-headline font-bold text-base ${roleData.color}`}>
                {lang === 'EN' ? roleData.name : roleData.nameKo}
              </p>
              <p className="text-[11px] text-on-surface-variant truncate">
                {roleData.team === 'mafia'
                  ? (lang === 'EN' ? 'A conspirator was eliminated!' : '마피아 조직원이 처형되었습니다!')
                  : (lang === 'EN' ? 'An innocent citizen was lost...' : '선량한 시민이 희생되었습니다...')}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 text-xs text-outline flex items-center gap-1.5 animate-pulse">
          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
          <span>{lang === 'EN' ? 'Proceeding to next phase...' : '다음 단계로 자동 전환 중...'}</span>
        </div>
      </div>
    </div>
  );
};
