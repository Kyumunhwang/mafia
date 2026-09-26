import React, { useState } from 'react';
import { useGame, sounds } from '../context/SocketContext';
import { SCENARIOS } from '../scenarios';

export const NightPhaseView = () => {
  const { socket, roomState, lang, showToast } = useGame();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  if (!roomState) return null;

  const currentTheme = roomState.theme || 'classic';
  const scenario = SCENARIOS[currentTheme] || SCENARIOS.classic;
  const myPlayer = roomState.players.find(p => p.id === roomState.myPlayerId);
  const isAlive = myPlayer?.isAlive;
  const myRole = roomState.myRole;
  const roleInfo = scenario.roles[myRole] || scenario.roles.CITIZEN;

  const livingPlayers = roomState.players.filter(p => p.isAlive);

  // Eligible targets based on role
  const eligibleTargets = livingPlayers.filter(p => {
    if (myRole === 'MAFIA') {
      // Cannot target fellow mafia members or self
      return p.id !== roomState.myPlayerId && p.role !== 'MAFIA';
    }
    if (myRole === 'POLICE') {
      // Cannot target self
      return p.id !== roomState.myPlayerId;
    }
    return true; // Doctor can target anyone including self
  });

  const fellowMafia = myRole === 'MAFIA'
    ? livingPlayers.filter(p => p.role === 'MAFIA' && p.id !== roomState.myPlayerId)
    : [];

  const handleSelectTarget = (targetId) => {
    if (!isAlive || hasConfirmed) return;
    sounds.playTick();
    setSelectedTarget(targetId);
  };

  const handleConfirmAction = () => {
    if (!selectedTarget) {
      showToast(lang === 'EN' ? 'Please select a target first!' : '먼저 대상을 선택해주세요!');
      return;
    }
    sounds.playAction();
    socket.emit('night_action', { targetId: selectedTarget });
    setHasConfirmed(true);

    const targetPlayer = roomState.players.find(p => p.id === selectedTarget);
    const actionName = myRole === 'MAFIA'
      ? (lang === 'EN' ? `Assassination Target Confirmed: ${targetPlayer?.nickname}` : `암살 대상 확정: ${targetPlayer?.nickname}`)
      : myRole === 'POLICE'
        ? (lang === 'EN' ? `Investigation Target Confirmed: ${targetPlayer?.nickname}` : `심문 대상 확정: ${targetPlayer?.nickname}`)
        : (lang === 'EN' ? `Protection Target Confirmed: ${targetPlayer?.nickname}` : `치료 대상 확정: ${targetPlayer?.nickname}`);

    showToast(actionName);

    // Auto-lock for security after confirmation
    setTimeout(() => {
      setIsUnlocked(false);
    }, 600);
  };

  const timerRemaining = roomState.timer?.remainingSeconds || 0;
  const timerTotal = roomState.timer?.totalSeconds || 40;
  const progressPercent = Math.max(0, Math.min(100, (timerRemaining / timerTotal) * 100));

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-4.5rem)] max-w-md mx-auto px-4 py-3 select-none justify-between">
      {/* Night Atmosphere Header */}
      <div>
        <div className="flex items-center justify-between bg-surface-container-low border border-surface-variant/40 rounded-2xl p-3.5 shadow-lg mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">dark_mode</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-headline font-bold text-sm text-primary tracking-wide uppercase">
                  {lang === 'EN' ? `Night ${roomState.dayCount}` : `밤의 시간 ${roomState.dayCount}`}
                </span>
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              </div>
              <p className="text-[11px] text-outline">
                {lang === 'EN' ? 'Silence falls over the city...' : '어둠이 내리고 비밀 임무가 시작됩니다'}
              </p>
            </div>
          </div>

          {/* Timer Gauge */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-primary font-headline font-bold text-lg">
              <span className="material-symbols-outlined text-[16px]">timer</span>
              <span>{timerRemaining}s</span>
            </div>
            <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Fellow Mafia Notification Banner (if any) */}
        {myRole === 'MAFIA' && fellowMafia.length > 0 && isUnlocked && (
          <div className="mb-3 p-2.5 rounded-xl bg-primary-container/20 border border-primary/40 flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-primary text-[18px]">group</span>
            <span className="text-xs text-primary-fixed">
              {lang === 'EN' ? 'Fellow Mafia: ' : '동료 마피아: '}
              <strong>{fellowMafia.map(m => m.nickname).join(', ')}</strong>
            </span>
          </div>
        )}

        {/* Main Card Container */}
        <div className="relative rounded-3xl overflow-hidden bg-surface-container border border-surface-variant/40 p-5 shadow-2xl min-h-[380px] flex flex-col justify-between">
          {!isAlive ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <span className="material-symbols-outlined text-[48px] text-error mb-2">skull</span>
              <h3 className="font-headline font-bold text-lg text-error">
                {lang === 'EN' ? 'You are Eliminated' : '당신은 사망했습니다'}
              </h3>
              <p className="text-xs text-on-surface-variant mt-2 max-w-xs">
                {lang === 'EN'
                  ? 'Spectate in silence until the game concludes.'
                  : '게임이 끝날 때까지 침묵을 유지하세요.'}
              </p>
            </div>
          ) : isUnlocked ? (
            /* Unlocked View: Role Card & Action Selector */
            <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
              <div>
                {/* Role Header */}
                <div className="flex items-center justify-between pb-3 border-b border-surface-variant/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${roleInfo.badgeBg} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined ${roleInfo.color} text-[26px]`}>
                        {roleInfo.icon}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                        {lang === 'EN' ? 'Your Secret Role' : '비밀 직업'}
                      </span>
                      <h3 className={`font-headline text-lg font-black ${roleInfo.color}`}>
                        {lang === 'EN' ? roleInfo.name : roleInfo.nameKo}
                      </h3>
                    </div>
                  </div>

                  {/* Quick Lock Button */}
                  <button
                    type="button"
                    onClick={() => setIsUnlocked(false)}
                    className="p-1.5 rounded-lg bg-surface-container-high text-outline hover:text-on-surface flex items-center gap-1 text-xs"
                    title="Conceal Screen"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                    <span>{lang === 'EN' ? 'Hide' : '가리기'}</span>
                  </button>
                </div>

                {/* Mission Text */}
                <p className="text-xs text-on-surface-variant my-2.5 leading-snug">
                  {lang === 'EN' ? roleInfo.desc : roleInfo.descKo}
                </p>

                {/* Role-Specific Action Board */}
                {myRole === 'CITIZEN' ? (
                  <div className="p-6 text-center flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-[36px] text-tertiary mb-2">hotel</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {lang === 'EN'
                        ? 'Good citizens sleep during the night. Stay quiet and observe who awakens!'
                        : '선량한 시민은 밤에 잠을 잡니다. 폰을 엎어두고 아침을 기다리세요.'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-headline font-bold text-xs text-outline uppercase tracking-wider">
                        {myRole === 'MAFIA' && (lang === 'EN' ? 'Choose Victim to Assassinate' : '암살할 대상을 선택하세요')}
                        {myRole === 'POLICE' && (lang === 'EN' ? 'Choose Suspect to Interrogate' : '심문할 용의자를 선택하세요')}
                        {myRole === 'DOCTOR' && (lang === 'EN' ? 'Choose Patient to Protect' : '보호할 대상을 선택하세요')}
                      </span>
                      {hasConfirmed && (
                        <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
                          {lang === 'EN' ? 'Confirmed' : '확정완료'}
                        </span>
                      )}
                    </div>

                    {/* Target Cards Grid */}
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-52 pr-1 no-scrollbar">
                      {eligibleTargets.map((target) => {
                        const isChosen = selectedTarget === target.id;
                        return (
                          <button
                            key={target.id}
                            type="button"
                            disabled={hasConfirmed}
                            onClick={() => handleSelectTarget(target.id)}
                            className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left transition-all ${
                              isChosen
                                ? myRole === 'MAFIA'
                                  ? 'bg-primary-container text-on-primary-container border-primary shadow-lg shadow-primary-container/30 ring-2 ring-primary scale-[1.02]'
                                  : 'bg-tertiary-container text-on-tertiary-container border-tertiary shadow-lg ring-2 ring-tertiary scale-[1.02]'
                                : 'bg-surface-container-low border-surface-variant/40 hover:bg-surface-container-high text-on-surface'
                            } ${hasConfirmed ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span className="text-xl shrink-0">{target.avatar || '👤'}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs truncate">{target.nickname}</p>
                              <span className="text-[10px] opacity-75">
                                {isChosen
                                  ? (myRole === 'MAFIA' ? 'TARGET' : 'SELECTED')
                                  : (lang === 'EN' ? 'Tap to pick' : '선택하기')}
                              </span>
                            </div>
                            {isChosen && (
                              <span className="material-symbols-outlined text-[18px]">
                                {myRole === 'MAFIA' ? 'target' : 'check_circle'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Cop Inspection Clue Result */}
                    {myRole === 'POLICE' && roomState.privateInspection && (
                      <div className="mt-3 p-2.5 rounded-xl bg-tertiary-container/20 border border-tertiary/40 flex items-center gap-2">
                        <span className="material-symbols-outlined text-tertiary text-[20px]">search_check</span>
                        <p className="text-xs text-tertiary-fixed">
                          {roomState.privateInspection.targetNickname}:{' '}
                          <strong>
                            {roomState.privateInspection.isMafia
                              ? (lang === 'EN' ? 'MAFIA SUSPECT CONFIRMED!' : '마피아가 맞습니다!')
                              : (lang === 'EN' ? 'Innocent Citizen' : '선량한 시민입니다')}
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Confirm Button */}
              {myRole !== 'CITIZEN' && (
                <div className="pt-3">
                  <button
                    type="button"
                    disabled={!selectedTarget || hasConfirmed}
                    onClick={handleConfirmAction}
                    className={`w-full py-3.5 rounded-2xl font-headline font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                      hasConfirmed
                        ? 'bg-surface-container-high text-outline opacity-60 cursor-not-allowed'
                        : selectedTarget
                          ? myRole === 'MAFIA'
                            ? 'bg-primary-container hover:bg-primary-container/90 text-on-primary-container shadow-primary-container/30 active:scale-98 cursor-pointer'
                            : 'bg-tertiary-container hover:bg-tertiary-container/90 text-on-tertiary-container shadow-tertiary-container/30 active:scale-98 cursor-pointer'
                          : 'bg-surface-container-high text-outline opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {hasConfirmed ? 'lock' : myRole === 'MAFIA' ? 'crisis_alert' : 'check'}
                    </span>
                    <span>
                      {hasConfirmed
                        ? (lang === 'EN' ? 'Target Confirmed & Locked' : '행동 확정 및 보안 잠금 완료')
                        : myRole === 'MAFIA'
                          ? (lang === 'EN' ? 'CONFIRM ASSASSINATION' : '암살 실행 확정하기')
                          : (lang === 'EN' ? 'CONFIRM ACTION' : '능력 실행 확정하기')}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Locked View: Frosted Glass Cover with Tap to Unlock */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-surface-container-high border border-surface-variant flex items-center justify-center text-primary mb-3 shadow-xl">
                <span className="material-symbols-outlined text-[32px]">lock</span>
              </div>
              <h4 className="font-headline font-bold text-base text-on-surface mb-1">
                {lang === 'EN' ? 'Screen Concealed for Privacy' : '엿보기 방지 화면 잠금 중'}
              </h4>
              <p className="text-xs text-outline max-w-xs leading-relaxed mb-6">
                {lang === 'EN'
                  ? 'Tap below to reveal your secret role and execute night abilities safely.'
                  : '아래 버튼을 눌러 화면을 열고 암살 및 비밀 행동을 실행하세요.'}
              </p>

              <button
                type="button"
                onClick={() => { sounds.playAction(); setIsUnlocked(true); }}
                className="py-3 px-6 rounded-2xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline font-bold text-xs flex items-center gap-2 border border-surface-variant/60 shadow-lg active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">visibility</span>
                <span>{lang === 'EN' ? 'Tap to Unlock Secret Action' : '탭하여 비밀 행동 화면 열기'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
