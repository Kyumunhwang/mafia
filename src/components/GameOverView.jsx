import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGame, sounds } from '../context/SocketContext';
import { SCENARIOS } from '../scenarios';

export const GameOverView = () => {
  const { socket, roomState, lang, showToast } = useGame();

  if (!roomState) return null;

  const currentTheme = roomState.theme || 'classic';
  const scenario = SCENARIOS[currentTheme] || SCENARIOS.classic;
  const isHost = roomState.hostId === roomState.myPlayerId;
  const winner = roomState.winner; // 'CITIZENS' or 'MAFIA'

  useEffect(() => {
    // Fire celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const handleReturnToLobby = () => {
    if (!isHost) return;
    sounds.playAction();
    socket.emit('reset_to_lobby');
    showToast(lang === 'EN' ? 'Returned to Lobby' : '대기실로 복귀했습니다');
  };

  const isCitizenVictory = winner === 'CITIZENS';

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-4rem)] max-w-md mx-auto px-4 py-4 select-none pb-28">
      {/* Victory Banner */}
      <div className="rounded-3xl bg-surface-container border border-surface-variant/50 p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden mb-6">
        <div
          className={`absolute inset-0 blur-3xl opacity-20 pointer-events-none ${
            isCitizenVictory ? 'bg-tertiary' : 'bg-primary'
          }`}
        ></div>

        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-3 shadow-xl border-2 ${
            isCitizenVictory
              ? 'bg-tertiary-container/30 border-tertiary text-tertiary'
              : 'bg-primary-container/30 border-primary text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[44px]">
            {isCitizenVictory ? 'emoji_events' : 'sports_score'}
          </span>
        </div>

        <span className="font-headline font-extrabold text-xs uppercase tracking-widest text-outline mb-1">
          {lang === 'EN' ? 'Game Over' : '게임 종료'}
        </span>

        <h2 className="font-headline text-2xl font-black text-on-surface mb-2">
          {isCitizenVictory
            ? (lang === 'EN' ? 'CITIZENS TRIUMPH!' : '시민 진영의 완벽한 승리!')
            : (lang === 'EN' ? 'MAFIA TAKEOVER!' : '마피아 진영의 승리!')}
        </h2>

        <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
          {isCitizenVictory
            ? (lang === 'EN'
                ? 'All conspirators were eradicated. Peace is restored to the city.'
                : '모든 마피아 조직원이 소탕되었습니다. 도시에 평화가 찾아왔습니다.')
            : (lang === 'EN'
                ? 'The conspirators have overwhelmed the citizens in the shadows.'
                : '마피아 조직원이 도시를 완전히 장악했습니다.')}
        </p>
      </div>

      {/* Complete Secret Roles Roster */}
      <div className="flex-1 flex flex-col mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-headline font-bold text-xs text-outline uppercase tracking-wider">
            {lang === 'EN' ? 'All Player Secrets Revealed' : '전체 참가자 정체 공개'}
          </span>
          <span className="text-xs text-outline">
            {roomState.players.length} {lang === 'EN' ? 'Players' : '명'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 overflow-y-auto max-h-80 pr-1 no-scrollbar">
          {roomState.players.map((player) => {
            const roleData = scenario.roles[player.role] || scenario.roles.CITIZEN;
            return (
              <div
                key={player.id}
                className="p-3 rounded-2xl bg-surface-container-low border border-surface-variant/40 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-xl shrink-0">
                    {player.avatar || '👤'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-on-surface truncate">
                      {player.nickname}
                    </p>
                    <span className="text-[10px] text-outline">
                      {player.isAlive
                        ? (lang === 'EN' ? 'Survived' : '생존')
                        : (lang === 'EN' ? 'Eliminated' : '사망')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${roleData.color}`}>
                    {lang === 'EN' ? roleData.name : roleData.nameKo}
                  </span>
                  <div className={`w-8 h-8 rounded-lg ${roleData.badgeBg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined ${roleData.color} text-[18px]`}>
                      {roleData.icon}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Return to Lobby CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl px-4 pt-3 pb-safe border-t border-surface-container-high/40 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto">
          {isHost ? (
            <button
              type="button"
              onClick={handleReturnToLobby}
              className="w-full py-4 rounded-2xl bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-container/30 active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">replay</span>
              <span>{lang === 'EN' ? 'Host: Return to Lobby (Play Again)' : '방장: 대기실로 복귀하여 다시하기'}</span>
            </button>
          ) : (
            <div className="w-full py-3.5 rounded-xl bg-surface-container text-center text-xs text-outline font-semibold">
              {lang === 'EN' ? 'Waiting for Host to return to lobby...' : '방장이 새 게임을 시작하기를 기다리는 중...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
