import React, { useState, useEffect, useRef } from 'react';
import { useGame, sounds } from '../context/SocketContext';

export const DefenseVoteView = () => {
  const { socket, roomState, lang, showToast } = useGame();
  const [myVerdict, setMyVerdict] = useState(null);
  const [defenseInput, setDefenseInput] = useState('');
  const chatEndRef = useRef(null);

  if (!roomState) return null;

  const candidate = roomState.executionCandidate;
  const isCandidate = candidate?.id === roomState.myPlayerId;
  const myPlayer = roomState.players.find(p => p.id === roomState.myPlayerId);
  const isAlive = myPlayer?.isAlive;
  const chatMessages = roomState.chatMessages || [];
  const latestDefense = roomState.defenseSpeech;

  const timerRemaining = roomState.timer?.remainingSeconds || 0;
  const timerTotal = roomState.timer?.totalSeconds || 30;
  const progressPercent = Math.max(0, Math.min(100, (timerRemaining / timerTotal) * 100));

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSendDefense = (e) => {
    e.preventDefault();
    if (!defenseInput.trim()) return;
    sounds.playAction();
    socket.emit('send_chat', { text: defenseInput.trim() });
    setDefenseInput('');
    showToast(isCandidate
      ? (lang === 'EN' ? 'Defense plea transmitted to jury!' : '최후 변론이 배심원단에게 전달되었습니다!')
      : (lang === 'EN' ? 'Juror opinion posted!' : '배심원 의견이 등록되었습니다!')
    );
  };

  const handleVote = (vote) => {
    if (!isAlive || isCandidate) return;
    setMyVerdict(vote);
    sounds.playAction();
    socket.emit('cast_defense_vote', { vote });
    showToast(vote === 'guilty'
      ? (lang === 'EN' ? 'Voted Guilty (Execute)' : '처형 찬성에 투표했습니다')
      : (lang === 'EN' ? 'Voted Innocent (Spare)' : '처형 반대(무죄)에 투표했습니다')
    );
  };

  const { guilty = 0, innocent = 0 } = roomState.defenseVotes || {};

  return (
    <div className="flex flex-col w-full h-[calc(100dvh-4.5rem)] max-w-md mx-auto px-3 py-2 select-none justify-between">
      {/* Top Section: Trial Header & Accused Banner */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between bg-surface-container-low border border-surface-variant/40 rounded-2xl p-3 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-error-container/20 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[20px]">gavel</span>
            </div>
            <div>
              <span className="font-headline font-bold text-xs text-error tracking-wide uppercase">
                {lang === 'EN' ? 'Final Defense Trial' : '최후 변론 및 재판'}
              </span>
              <p className="text-[11px] text-outline">
                {lang === 'EN' ? 'Deliver defense before the verdict' : '변론을 듣고 처형 여부를 결정하세요'}
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1 text-error font-headline font-bold text-base bg-surface-container px-2 py-1 rounded-xl border border-surface-variant/40">
            <span className="material-symbols-outlined text-[16px]">timer</span>
            <span>{timerRemaining}s</span>
          </div>
        </div>

        {/* Accused Center Card */}
        <div className="rounded-2xl bg-surface-container border border-surface-variant/50 p-3 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-full bg-surface-container-high border-2 border-error/50 flex items-center justify-center text-2xl shadow-md">
              {candidate?.avatar || '👤'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-error uppercase bg-error-container/30 px-1.5 py-0.5 rounded">
                  {lang === 'EN' ? 'On Trial' : '피의자'}
                </span>
                <h3 className="font-headline text-sm font-black text-on-surface">
                  {candidate?.nickname}
                </h3>
              </div>
              <p className="text-[11px] text-outline mt-0.5">
                {isCandidate
                  ? (lang === 'EN' ? 'You are on the stand! Defend yourself below!' : '당신이 지목되었습니다! 아래에 결백을 변론하세요!')
                  : (lang === 'EN' ? 'Listen to their defense and cast your vote' : '피의자의 변론을 확인하고 투표하세요')}
              </p>
            </div>
          </div>

          {/* Current Tally */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-error bg-error-container/20 px-2 py-1 rounded-lg border border-error/30">
              {lang === 'EN' ? 'Guilty' : '처형'}: {guilty}
            </span>
            <span className="text-[11px] font-bold text-tertiary bg-tertiary-container/20 px-2 py-1 rounded-lg border border-tertiary/30">
              {lang === 'EN' ? 'Spare' : '무죄'}: {innocent}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Live Defense Dialogue Feed */}
      <div className="flex-1 my-2 overflow-y-auto rounded-2xl bg-surface-container-low border border-surface-variant/40 p-3 flex flex-col gap-2 shadow-inner">
        {/* Latest Defense Spotlight (if any) */}
        {latestDefense && (
          <div className="p-3 rounded-2xl bg-error-container/20 border border-error/40 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-1 text-[11px] font-bold text-error mb-1">
              <span className="material-symbols-outlined text-[15px]">campaign</span>
              <span>{candidate?.nickname} (Official Defense Plea):</span>
            </div>
            <p className="text-xs font-semibold text-on-surface leading-relaxed">
              "{latestDefense}"
            </p>
          </div>
        )}

        {/* Real-Time Chat Stream */}
        {chatMessages.map((msg) => {
          const isCandidateMsg = msg.senderId === candidate?.id;
          const isMe = msg.senderId === roomState.myPlayerId;
          return (
            <div
              key={msg.id}
              className={`flex gap-2 items-start animate-in fade-in duration-150 ${
                isMe ? 'flex-row-reverse self-end max-w-[85%]' : 'flex-row self-start max-w-[85%]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border ${
                  isCandidateMsg
                    ? 'bg-error-container/40 border-error'
                    : msg.isBot
                      ? 'bg-tertiary-container/30 border-tertiary/40'
                      : 'bg-surface-container border-surface-variant/40'
                }`}
              >
                {msg.avatar || '👤'}
              </div>

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className={`text-[10px] font-bold ${isCandidateMsg ? 'text-error' : msg.isBot ? 'text-tertiary-fixed' : 'text-on-surface'}`}>
                  {msg.sender} {isCandidateMsg && `[${lang === 'EN' ? 'ACCUSED' : '피의자'}]`}
                </span>
                <div
                  className={`px-3 py-1.5 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                    isCandidateMsg
                      ? 'bg-error-container text-on-error-container border border-error/50 font-medium'
                      : isMe
                        ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                        : 'bg-surface-container text-on-surface border border-surface-variant/40 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Bottom Section: Speech Input Bar & Verdict Actions */}
      <div className="shrink-0 flex flex-col gap-2 pt-1">
        {/* Defense / Chat Input Bar */}
        <form onSubmit={handleSendDefense} className="flex items-center gap-2">
          <input
            type="text"
            maxLength={100}
            value={defenseInput}
            onChange={(e) => setDefenseInput(e.target.value)}
            placeholder={
              isCandidate
                ? (lang === 'EN' ? 'Type your defense plea to convince jurors...' : '살아남기 위한 최후 변론을 입력하세요...')
                : (lang === 'EN' ? 'Question the accused or comment...' : '피의자에게 질문하거나 배심원 의견을 남기세요...')
            }
            className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs text-on-surface focus:outline-none transition-colors ${
              isCandidate
                ? 'bg-error-container/10 border-error/50 focus:border-error text-error placeholder:text-error/60 font-semibold'
                : 'bg-surface-container-low border-surface-variant/60 focus:border-primary'
            }`}
          />
          <button
            type="submit"
            disabled={!defenseInput.trim()}
            className={`h-10 px-3.5 rounded-xl font-headline font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md active:scale-95 transition-all disabled:opacity-40 ${
              isCandidate
                ? 'bg-error text-on-error'
                : 'bg-primary-container text-on-primary-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isCandidate ? 'campaign' : 'send'}
            </span>
            <span>{isCandidate ? (lang === 'EN' ? 'Plead' : '변론') : (lang === 'EN' ? 'Send' : '전송')}</span>
          </button>
        </form>

        {/* Juror Verdict Buttons (For non-candidates) */}
        {!isCandidate && isAlive && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleVote('guilty')}
              className={`py-2.5 rounded-xl font-headline font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all ${
                myVerdict === 'guilty'
                  ? 'bg-error text-on-error ring-2 ring-error scale-98'
                  : 'bg-surface-container-high hover:bg-error-container/20 text-error border border-error/40 active:scale-95'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">thumb_down</span>
              <span>{lang === 'EN' ? 'Guilty (Execute)' : '처형 찬성'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleVote('innocent')}
              className={`py-2.5 rounded-xl font-headline font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all ${
                myVerdict === 'innocent'
                  ? 'bg-tertiary-container text-on-tertiary-container ring-2 ring-tertiary scale-98'
                  : 'bg-surface-container-high hover:bg-tertiary-container/20 text-tertiary border border-tertiary/40 active:scale-95'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">thumb_up</span>
              <span>{lang === 'EN' ? 'Innocent (Spare)' : '무죄 방면'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
