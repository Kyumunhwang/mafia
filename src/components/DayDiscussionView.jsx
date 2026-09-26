import React, { useState, useEffect, useRef } from 'react';
import { useGame, sounds } from '../context/SocketContext';
import { SCENARIOS } from '../scenarios';

export const DayDiscussionView = () => {
  const { socket, roomState, lang, showToast } = useGame();
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  if (!roomState) return null;

  const currentTheme = roomState.theme || 'classic';
  const scenario = SCENARIOS[currentTheme] || SCENARIOS.classic;
  const isHost = roomState.hostId === roomState.myPlayerId;
  const lastVictim = roomState.lastVictim;
  const myPlayer = roomState.players.find(p => p.id === roomState.myPlayerId);
  const isAlive = myPlayer?.isAlive;
  const chatMessages = roomState.chatMessages || [];

  const timerRemaining = roomState.timer?.remainingSeconds || 0;
  const timerTotal = roomState.timer?.totalSeconds || 90;
  const progressPercent = Math.max(0, Math.min(100, (timerRemaining / timerTotal) * 100));

  // Auto scroll to latest chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!isAlive) {
      showToast(lang === 'EN' ? 'Eliminated players cannot speak!' : '사망자는 발언할 수 없습니다!');
      return;
    }
    sounds.playAction();
    socket.emit('send_chat', { text: inputText.trim() });
    setInputText('');
  };

  const handleSkip = () => {
    if (!isHost) return;
    sounds.playAction();
    socket.emit('skip_discussion');
    showToast(lang === 'EN' ? 'Proceeding to Suspect Voting' : '토론을 종료하고 투표로 이동합니다');
  };

  return (
    <div className="flex flex-col w-full h-[calc(100dvh-4.5rem)] max-w-md mx-auto px-3 py-2 select-none justify-between">
      {/* Top Section: Header & Morning Report */}
      <div className="flex flex-col gap-2 shrink-0">
        {/* Discussion Header & Countdown */}
        <div className="flex items-center justify-between bg-surface-container-low border border-surface-variant/40 rounded-2xl p-3 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-secondary-container/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">sunny</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-headline font-bold text-xs text-secondary tracking-wide uppercase">
                  {lang === 'EN' ? `Day ${roomState.dayCount} Live Debate` : `낮 ${roomState.dayCount} 실시간 토론`}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-outline truncate">
                {lang === 'EN' ? 'Discuss clues with players & AI bots' : '플레이어 및 봇과 자유롭게 단서를 토론하세요'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Countdown */}
            <div className="flex items-center gap-1 text-secondary font-headline font-bold text-base bg-surface-container px-2 py-1 rounded-xl border border-surface-variant/40">
              <span className="material-symbols-outlined text-[16px]">timer</span>
              <span>{timerRemaining}s</span>
            </div>

            {/* Host Skip Button */}
            {isHost && (
              <button
                type="button"
                onClick={handleSkip}
                className="h-8 px-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline font-bold text-[11px] flex items-center gap-1 border border-surface-variant/40 transition-colors"
                title="Skip to vote"
              >
                <span className="material-symbols-outlined text-[15px]">fast_forward</span>
                <span>{lang === 'EN' ? 'Vote' : '투표'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Morning Incident Pill */}
        {lastVictim && (
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs shadow-sm ${
              lastVictim.saved
                ? 'bg-secondary-container/20 border-secondary-container/40 text-secondary'
                : 'bg-error-container/20 border-error-container/40 text-error'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] shrink-0">
              {lastVictim.saved ? 'verified_user' : 'skull'}
            </span>
            <p className="truncate">
              {lastVictim.saved
                ? (lang === 'EN' ? `Miracle! ${lastVictim.nickname} was saved!` : `기적! ${lastVictim.nickname} 님이 생존했습니다!`)
                : (lang === 'EN' ? `Tragedy: ${lastVictim.nickname} (${scenario.roles[lastVictim.role]?.name || 'Citizen'}) died!` : `사망: ${lastVictim.nickname} (${scenario.roles[lastVictim.role]?.nameKo || '시민'}) 님이 살해당했습니다!`)}
            </p>
          </div>
        )}
      </div>

      {/* Middle Section: Real-Time Chat Discussion Feed */}
      <div className="flex-1 my-2 overflow-y-auto rounded-2xl bg-surface-container-low border border-surface-variant/40 p-3 flex flex-col gap-2.5 shadow-inner">
        {chatMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-outline">
            <span className="material-symbols-outlined text-[32px] text-tertiary/40 mb-1 animate-pulse">forum</span>
            <p className="text-xs">
              {lang === 'EN' ? 'Debate is beginning... Speak up!' : '토론이 시작되었습니다. 의견을 말해보세요!'}
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.senderId === roomState.myPlayerId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 items-start animate-in fade-in duration-150 ${
                  isMe ? 'flex-row-reverse self-end max-w-[85%]' : 'flex-row self-start max-w-[85%]'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 border ${
                    msg.isBot
                      ? 'bg-tertiary-container/30 border-tertiary/40'
                      : isMe
                        ? 'bg-primary-container/30 border-primary/40'
                        : 'bg-surface-container border-surface-variant/40'
                  }`}
                >
                  {msg.avatar || '👤'}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`text-[11px] font-bold ${msg.isBot ? 'text-tertiary-fixed' : isMe ? 'text-primary' : 'text-on-surface'}`}>
                      {msg.sender}
                    </span>
                    {msg.isBot && (
                      <span className="text-[9px] bg-tertiary/20 text-tertiary px-1 rounded font-bold">BOT</span>
                    )}
                    <span className="text-[9px] text-outline ml-1">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`px-3 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                      isMe
                        ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                        : msg.isBot
                          ? 'bg-surface-container-high border border-surface-variant/40 text-on-surface rounded-tl-none'
                          : 'bg-surface-container text-on-surface border border-surface-variant/40 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Bottom Section: Live Chat Input Bar */}
      <form onSubmit={handleSendMessage} className="shrink-0 flex items-center gap-2 pt-1">
        <input
          type="text"
          disabled={!isAlive}
          maxLength={100}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            !isAlive
              ? (lang === 'EN' ? 'Eliminated players cannot speak...' : '사망자는 발언할 수 없습니다...')
              : (lang === 'EN' ? 'Share your clue, accuse, or defend...' : '단서를 말하거나 용의자를 의심해보세요...')
          }
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!isAlive || !inputText.trim()}
          className="h-10 w-10 rounded-xl bg-primary-container hover:bg-primary-container/90 text-on-primary-container flex items-center justify-center shrink-0 shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title="Send message"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </form>
    </div>
  );
};
