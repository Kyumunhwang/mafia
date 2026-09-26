import React, { useState } from 'react';
import { useGame, sounds } from '../context/SocketContext';
import { SCENARIOS } from '../scenarios';

export const LobbyView = ({ onOpenQR, onOpenRules }) => {
  const { socket, roomState, lang, showToast, toggleShield, shieldActive } = useGame();
  const [isStarting, setIsStarting] = useState(false);

  if (!roomState) return null;

  const currentTheme = roomState.theme || 'classic';
  const scenario = SCENARIOS[currentTheme] || SCENARIOS.classic;
  const isHost = roomState.hostId === roomState.myPlayerId;
  const myPlayer = roomState.players.find(p => p.id === roomState.myPlayerId);
  const playerCount = roomState.players.length;
  const botCount = roomState.players.filter(p => p.isBot).length;
  const canStart = playerCount >= 5;

  const handleSelectScenario = (key) => {
    if (!isHost) {
      showToast(lang === 'EN' ? 'Only the Host can select the scenario' : '방장만 시나리오를 변경할 수 있습니다');
      return;
    }
    sounds.playAction();
    socket.emit('select_scenario', { theme: key });
    showToast(lang === 'EN' ? `Scenario changed to ${SCENARIOS[key].title}` : `${SCENARIOS[key].titleKo} 시나리오가 선택되었습니다`);
  };

  const handleToggleReady = () => {
    sounds.playAction();
    socket.emit('toggle_ready');
  };

  const handleAddBot = () => {
    sounds.playAction();
    socket.emit('add_bot');
  };

  const handleRemoveBot = () => {
    sounds.playAction();
    socket.emit('remove_bot');
  };

  const handleFillBots = () => {
    sounds.playAction();
    socket.emit('fill_bots', { targetCount: 5 });
    showToast(lang === 'EN' ? 'Room filled with AI Bots!' : 'AI 봇으로 5인 방을 채웠습니다!');
  };

  const handleStartGame = () => {
    if (!canStart) {
      showToast(lang === 'EN' ? 'Minimum 5 players required to start!' : '최소 5명 이상이어야 게임을 시작할 수 있습니다!');
      return;
    }
    setIsStarting(true);
    sounds.playGong();
    socket.emit('start_game');
  };

  const copyRoomCode = () => {
    navigator.clipboard?.writeText(roomState.roomCode);
    showToast(lang === 'EN' ? `Room Code #${roomState.roomCode} copied!` : `방 코드 #${roomState.roomCode} 복사 완료!`);
  };

  const shareInvite = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Mafia Party Web',
        text: `Join Mafia Game #${roomState.roomCode}!`,
        url
      }).catch(() => {});
    } else {
      copyRoomCode();
    }
  };

  return (
    <div className="flex flex-col w-full pb-28 pt-2 max-w-md mx-auto">
      {/* Hero Lobby Status Banner */}
      <section className="px-4 pt-2">
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-4 shadow-lg border border-surface-variant/40">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary-container/10 blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-secondary-container animate-pulse"></span>
              <span className="font-headline font-bold text-xs text-secondary tracking-wide">
                {lang === 'EN' ? 'LOBBY OPEN' : '대기실 오픈됨'}
              </span>
              {isHost && (
                <span className="bg-primary/20 text-primary-fixed-dim px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                  {lang === 'EN' ? 'Host' : '방장'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-full text-xs">
              <span className="material-symbols-outlined text-tertiary text-[15px]">groups</span>
              <span className="text-on-surface">
                {lang === 'EN' ? 'Players ' : '현재 '}
                <strong className="text-tertiary-fixed font-bold">{playerCount}</strong>
                {lang === 'EN' ? ' / Min 5' : '명 (최소 5명)'}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[11px] text-outline font-semibold uppercase tracking-wider">
                {lang === 'EN' ? 'Party Room' : '파티 룸'}
              </p>
              <h2 className="font-headline text-2xl font-black text-on-surface tracking-wider mt-0.5">
                ROOM #{roomState.roomCode}
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={copyRoomCode}
                className="flex items-center gap-1 bg-surface-container-high px-2.5 py-2 rounded-xl text-on-surface hover:text-primary active:scale-95 transition-all text-xs font-semibold border border-surface-variant/40"
              >
                <span className="material-symbols-outlined text-[15px]">content_copy</span>
                <span>{lang === 'EN' ? 'Copy' : '복사'}</span>
              </button>
              <button
                type="button"
                onClick={shareInvite}
                className="flex items-center gap-1 bg-primary-container px-3 py-2 rounded-xl text-on-primary-container active:scale-95 transition-all text-xs font-bold shadow-md shadow-primary-container/20"
              >
                <span className="material-symbols-outlined text-[15px]">share</span>
                <span>{lang === 'EN' ? 'Invite' : '초대'}</span>
              </button>
            </div>
          </div>

          {/* Quick Rules Pills */}
          <div className="mt-3.5 pt-2 border-t border-surface-variant/30 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 bg-surface-container-highest/60 px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] text-on-surface-variant">
              <span className="material-symbols-outlined text-secondary text-[13px]">timer</span>
              <span>{lang === 'EN' ? 'Discussion 90s' : '토론 90초'}</span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-highest/60 px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] text-on-surface-variant">
              <span className="material-symbols-outlined text-tertiary text-[13px]">shield</span>
              <span>{lang === 'EN' ? 'Privacy Shield' : '가림막 보호'}</span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-highest/60 px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[13px]">smart_toy</span>
              <span>{lang === 'EN' ? `Bots: ${botCount}` : `AI 봇: ${botCount}명`}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Solo Play / AI Bot Control Bar (Host Only) */}
      {isHost && (
        <section className="px-4 mt-3">
          <div className="rounded-2xl bg-surface-container border border-surface-variant/50 p-3 flex flex-col gap-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[20px]">smart_toy</span>
                <span className="font-headline font-bold text-xs text-on-surface">
                  {lang === 'EN' ? 'Solo Play & AI Bots' : '개인용 1인 플레이 (AI 봇)'}
                </span>
              </div>
              <span className="text-[11px] text-outline">
                {lang === 'EN' ? 'Play alone against computer' : '혼자서 컴퓨터와 대전'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleFillBots}
                className="py-2.5 px-2 rounded-xl bg-tertiary-container hover:bg-tertiary-container/90 text-on-tertiary-container font-headline font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                title="Fill to 5 players with AI bots"
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>{lang === 'EN' ? 'Fill to 5' : '5인 채우기'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddBot}
                disabled={playerCount >= 15}
                className="py-2.5 px-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline font-bold text-xs flex items-center justify-center gap-1.5 border border-surface-variant/40 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>{lang === 'EN' ? '+ Add Bot' : '+ 봇 추가'}</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveBot}
                disabled={botCount === 0}
                className="py-2.5 px-2 rounded-xl bg-surface-container-high hover:bg-error-container/20 text-error font-headline font-bold text-xs flex items-center justify-center gap-1.5 border border-surface-variant/40 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">remove</span>
                <span>{lang === 'EN' ? '- Remove' : '- 봇 제거'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Scenario Deck Carousel */}
      <section className="mt-5 flex flex-col">
        <div className="px-4 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">theater_comedy</span>
            <h3 className="font-headline font-bold text-base text-on-surface">
              {lang === 'EN' ? 'Choose Scenario Deck' : '시나리오 덱 선택'}
            </h3>
          </div>
          <span className="text-xs text-outline font-semibold">
            {lang === 'EN' ? '4 Themes Available' : '총 4개 테마'}
          </span>
        </div>

        {/* Horizontal Carousel */}
        <div className="flex gap-3 overflow-x-auto px-4 py-2 snap-x snap-mandatory no-scrollbar">
          {Object.entries(SCENARIOS).map(([key, sc]) => {
            const isSelected = currentTheme === key;
            return (
              <div
                key={key}
                onClick={() => handleSelectScenario(key)}
                className={`scenario-card snap-center shrink-0 w-[260px] rounded-2xl bg-surface-container p-4 flex flex-col justify-between relative overflow-hidden transition-all duration-300 cursor-pointer shadow-lg border ${
                  isSelected
                    ? 'ring-2 ring-primary-container border-primary-container shadow-primary-container/20 opacity-100 scale-[1.01]'
                    : 'border-surface-variant/40 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="bg-primary-container/80 text-on-primary-container text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                      {lang === 'EN' ? sc.tag : sc.tagKo}
                    </span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-[22px]">check_circle</span>
                    )}
                  </div>

                  <div className="mt-2.5">
                    <h4 className="font-headline text-lg font-bold text-on-surface">
                      {lang === 'EN' ? sc.title : sc.titleKo}
                    </h4>
                    <p className="text-xs text-outline">{sc.subtitle}</p>
                  </div>

                  <div className="w-full h-24 rounded-xl my-2.5 overflow-hidden relative shadow-inner">
                    <img
                      src={sc.bgImage}
                      alt={sc.title}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent"></div>
                  </div>

                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {lang === 'EN' ? sc.desc : sc.descKo}
                  </p>
                </div>

                <div className="relative z-10 mt-3 pt-2 border-t border-surface-variant/30 flex flex-wrap gap-1">
                  {Object.values(sc.roles).map((r, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-surface-container-high/80 text-on-surface-variant px-2 py-0.5 rounded-md font-medium"
                    >
                      {lang === 'EN' ? r.name : r.nameKo}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Role Distribution Preview */}
      <section className="mt-5 px-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">badge</span>
            <h3 className="font-headline font-bold text-sm text-on-surface">
              {lang === 'EN' ? 'Role Breakdown' : '직업 배분 미리보기'}
            </h3>
          </div>
          <span className="text-xs text-primary font-bold">
            {lang === 'EN' ? scenario.title : scenario.titleKo}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(scenario.roles).map(([roleKey, role]) => (
            <div key={roleKey} className="rounded-xl bg-surface-container-low p-3 flex items-start gap-2.5 border border-surface-variant/30 shadow-sm">
              <div className={`w-8 h-8 rounded-lg ${role.badgeBg} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined ${role.color} text-[18px]`}>{role.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`font-bold text-xs ${role.color} truncate`}>
                    {lang === 'EN' ? role.name : role.nameKo}
                  </p>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug line-clamp-1">
                  {lang === 'EN' ? role.desc : role.descKo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Players Roster */}
      <section className="mt-5 px-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">person_check</span>
            <h3 className="font-headline font-bold text-sm text-on-surface">
              {lang === 'EN' ? `Roster (${playerCount}/15)` : `참가자 명단 (${playerCount}/15)`}
            </h3>
          </div>
          <span className="text-xs text-outline">
            {canStart
              ? (lang === 'EN' ? 'Ready to Play' : '시작 가능')
              : (lang === 'EN' ? `Need ${5 - playerCount} more` : `${5 - playerCount}명 더 필요`)}
          </span>
        </div>

        {/* Players Bento Grid */}
        <div className="grid grid-cols-2 gap-2">
          {roomState.players.map((p) => {
            const isMe = p.id === roomState.myPlayerId;
            return (
              <div
                key={p.id}
                className={`rounded-xl p-3 flex items-center justify-between border shadow-sm transition-all ${
                  isMe
                    ? 'bg-surface-container-high border-primary/40 ring-1 ring-primary/30'
                    : p.isBot
                      ? 'bg-surface-container border-tertiary/30'
                      : 'bg-surface-container-low border-surface-variant/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-lg shrink-0 border border-surface-variant/40">
                    {p.avatar || '👤'}
                    {p.isHost && (
                      <span className="absolute -top-1.5 -right-1 text-[11px]">👑</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-bold text-xs text-on-surface truncate">
                        {p.nickname}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {p.isBot ? (
                        <span className="text-[10px] bg-tertiary/20 text-tertiary px-1.5 py-0.2 rounded font-bold">
                          AI BOT
                        </span>
                      ) : (
                        <span className="text-[10px] text-outline font-medium">
                          {p.isHost ? (lang === 'EN' ? 'Host' : '방장') : (lang === 'EN' ? 'Player' : '참가자')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`material-symbols-outlined text-[18px] ${
                    p.ready || p.isHost || p.isBot ? 'text-secondary-container' : 'text-outline/40'
                  }`}
                  title={p.ready || p.isHost ? 'Ready' : 'Not ready'}
                >
                  {p.ready || p.isHost || p.isBot ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
            );
          })}

          {/* Quick Add Bot Slot */}
          {isHost && playerCount < 15 && (
            <button
              type="button"
              onClick={handleAddBot}
              className="rounded-xl bg-surface-container/40 p-3 flex items-center justify-center gap-1.5 text-outline hover:text-tertiary active:scale-95 transition-all border border-dashed border-tertiary/40"
            >
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              <span className="font-headline font-semibold text-xs">
                {lang === 'EN' ? '+ Add AI Bot' : '+ AI 봇 추가'}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl px-4 pt-3 pb-safe border-t border-surface-container-high/40 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          {/* Main Action Button */}
          {isHost ? (
            <button
              type="button"
              disabled={!canStart || isStarting}
              onClick={handleStartGame}
              className={`w-full h-13 py-3.5 rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                canStart
                  ? 'bg-primary-container text-on-primary-container shadow-primary-container/30 active:scale-98 cursor-pointer'
                  : 'bg-surface-container text-outline opacity-60 cursor-not-allowed'
              }`}
            >
              {isStarting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                  <span>{lang === 'EN' ? 'Distributing Roles...' : '역할 분배 중...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                  <span>
                    {canStart
                      ? (lang === 'EN' ? `Launch Game (${playerCount} Players)` : `게임 시작하기 (${playerCount}명 준비완료)`)
                      : (lang === 'EN' ? `Need 5 Players (Click 'Fill to 5')` : `최소 5명 필요 ('5인 채우기' 클릭)`)}
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleReady}
              className={`w-full h-13 py-3.5 rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                myPlayer?.ready
                  ? 'bg-secondary-container text-on-secondary-container shadow-secondary-container/20'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {myPlayer?.ready ? 'check_circle' : 'hourglass_empty'}
              </span>
              <span>
                {myPlayer?.ready
                  ? (lang === 'EN' ? 'Ready! (Click to cancel)' : '준비 완료! (클릭 시 취소)')
                  : (lang === 'EN' ? 'I am Ready' : '준비하기')}
              </span>
            </button>
          )}

          {/* Secondary Utilities */}
          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={onOpenRules}
              className="flex-1 py-2 px-3 rounded-xl bg-surface-container flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-on-surface active:scale-95 transition-all text-xs font-semibold border border-surface-variant/30"
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              <span>{lang === 'EN' ? 'Rules' : '시나리오 규칙'}</span>
            </button>
            <button
              type="button"
              onClick={toggleShield}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs font-semibold border ${
                shieldActive
                  ? 'bg-tertiary/20 text-tertiary border-tertiary/40'
                  : 'bg-surface-container text-on-surface-variant border-surface-variant/30 hover:text-tertiary'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">visibility_off</span>
              <span>{lang === 'EN' ? 'Privacy Shield' : '가림막 모드'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
