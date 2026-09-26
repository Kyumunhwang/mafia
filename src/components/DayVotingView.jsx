import React, { useState } from 'react';
import { useGame, sounds } from '../context/SocketContext';

export const DayVotingView = () => {
  const { socket, roomState, lang, showToast } = useGame();
  const [votedTargetId, setVotedTargetId] = useState(null);

  if (!roomState) return null;

  const myPlayer = roomState.players.find(p => p.id === roomState.myPlayerId);
  const isAlive = myPlayer?.isAlive;
  const livingPlayers = roomState.players.filter(p => p.isAlive);

  const handleVote = (targetId) => {
    if (!isAlive) return;
    setVotedTargetId(targetId);
    sounds.playAction();
    socket.emit('cast_day_vote', { targetId });
    const target = roomState.players.find(p => p.id === targetId);
    showToast(lang === 'EN' ? `Voted for ${target?.nickname}` : `${target?.nickname} 님에게 투표했습니다`);
  };

  const timerRemaining = roomState.timer?.remainingSeconds || 0;
  const timerTotal = roomState.timer?.totalSeconds || 45;
  const progressPercent = Math.max(0, Math.min(100, (timerRemaining / timerTotal) * 100));

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-4rem)] max-w-md mx-auto px-4 py-3 select-none">
      {/* Header & Timer */}
      <div className="flex items-center justify-between bg-surface-container-low border border-surface-variant/40 rounded-2xl p-4 shadow-lg mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">how_to_vote</span>
          </div>
          <div>
            <span className="font-headline font-bold text-sm text-primary tracking-wide uppercase">
              {lang === 'EN' ? 'Execution Vote' : '용의자 지목 투표'}
            </span>
            <p className="text-xs text-outline">
              {lang === 'EN' ? 'Vote for the primary suspect' : '가장 의심되는 용의자 1명을 지목하세요'}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-primary font-headline font-bold text-xl">
            <span className="material-symbols-outlined text-[18px]">timer</span>
            <span>{timerRemaining}s</span>
          </div>
          <div className="w-20 h-1.5 bg-surface-container-highest rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Voting Instruction Banner */}
      <div className="rounded-2xl bg-surface-container border border-surface-variant/40 p-4 shadow-md mb-4 text-center">
        <p className="text-xs text-on-surface-variant leading-relaxed">
          {lang === 'EN'
            ? 'The person with the most votes will face the stand for their final defense.'
            : '최다 득표자는 법대에 서서 최후 변론을 진행하며 찬반 투표에 부쳐집니다.'}
        </p>
      </div>

      {/* Suspect Roster to Vote */}
      <div className="flex-1 flex flex-col mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-headline font-bold text-xs text-outline uppercase tracking-wider">
            {lang === 'EN' ? 'Suspect Candidates' : '투표 대상자'}
          </span>
          {votedTargetId && (
            <span className="text-[11px] text-secondary font-bold">
              {lang === 'EN' ? 'Vote Cast' : '투표 완료'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2.5 overflow-y-auto max-h-96 pr-1 no-scrollbar">
          {livingPlayers.map((player) => {
            const isMe = player.id === roomState.myPlayerId;
            const isSelected = votedTargetId === player.id;

            return (
              <button
                key={player.id}
                type="button"
                disabled={!isAlive || isMe}
                onClick={() => handleVote(player.id)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-primary-container text-on-primary-container border-primary-container shadow-md shadow-primary-container/20 scale-98'
                    : isMe
                      ? 'bg-surface-container-lowest/50 border-surface-variant/30 opacity-50 cursor-not-allowed text-on-surface'
                      : 'bg-surface-container-low border-surface-variant/40 hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-xl shrink-0">
                    {player.avatar || '👤'}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-sm truncate">
                      {player.nickname} {isMe && `(${lang === 'EN' ? 'You' : '나'})`}
                    </p>
                    <span className="text-[10px] text-outline">
                      {isMe
                        ? (lang === 'EN' ? 'Cannot vote for yourself' : '본인에게 투표 불가')
                        : (lang === 'EN' ? 'Click to accuse' : '클릭하여 투표')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isSelected ? (
                    <span className="material-symbols-outlined text-primary-fixed text-[24px]">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-outline text-[22px]">how_to_vote</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
