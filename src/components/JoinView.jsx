import React, { useState, useEffect } from 'react';
import { useGame, sounds } from '../context/SocketContext';

const AVATARS = ['👑', '🦊', '🐺', '🦁', '🐯', '🦅', '🦉', '🦇', '👻', '🎭', '🎩', '🕵️'];

export const JoinView = ({ onOpenRules }) => {
  const { socket, lang, showToast } = useGame();
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [mode, setMode] = useState('join'); // 'join' or 'create'

  useEffect(() => {
    // Check if room code was passed via URL parameter
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code);
      setMode('join');
    }
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      showToast(lang === 'EN' ? 'Please enter a nickname' : '닉네임을 입력해주세요');
      return;
    }
    sounds.playAction();
    socket.emit('create_room', {
      nickname: nickname.trim(),
      avatar,
      theme: 'classic'
    });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      showToast(lang === 'EN' ? 'Please enter a nickname' : '닉네임을 입력해주세요');
      return;
    }
    if (!roomCode.trim() || roomCode.trim().length !== 4) {
      showToast(lang === 'EN' ? 'Please enter a valid 4-digit room code' : '4자리 방 코드를 입력해주세요');
      return;
    }
    sounds.playAction();
    socket.emit('join_room', {
      roomCode: roomCode.trim(),
      nickname: nickname.trim(),
      avatar
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] max-w-md mx-auto px-4 py-6 select-none animate-in fade-in duration-300">
      <div className="w-full rounded-3xl bg-surface-container border border-surface-variant/50 p-6 flex flex-col shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>

        {/* Title & Brand */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary-container/20 border border-primary/40 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="material-symbols-outlined text-[36px] text-primary">theater_comedy</span>
          </div>
          <h1 className="font-headline text-2xl font-black text-on-surface tracking-wider">
            MAFIA PARTY WEB
          </h1>
          <p className="text-xs text-outline mt-1">
            {lang === 'EN'
              ? 'Real-Time In-Person Mafia Game with Dynamic Scenarios'
              : '시나리오 테마 기반 실시간 대면 마피아 게임'}
          </p>
        </div>

        {/* Mode Selector Tab */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-container-low border border-surface-variant/40 mb-5">
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`py-2 rounded-lg font-headline font-bold text-xs transition-all ${
              mode === 'join'
                ? 'bg-surface-container-high text-on-surface shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            {lang === 'EN' ? 'Join Existing Room' : '방 코드로 입장'}
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`py-2 rounded-lg font-headline font-bold text-xs transition-all ${
              mode === 'create'
                ? 'bg-surface-container-high text-on-surface shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            {lang === 'EN' ? 'Create New Room' : '새 게임 방 개설'}
          </button>
        </div>

        {/* Profile Inputs */}
        <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="space-y-4">
          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
              {lang === 'EN' ? 'Your Nickname' : '플레이어 닉네임'}
            </label>
            <input
              type="text"
              required
              maxLength={12}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={lang === 'EN' ? 'e.g. Detective John' : '예: 명탐정 김셜록'}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-surface-variant/60 text-on-surface text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
              {lang === 'EN' ? 'Select Profile Avatar' : '프로필 아바타 선택'}
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => { sounds.playTick(); setAvatar(av); }}
                  className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all border ${
                    avatar === av
                      ? 'bg-primary/20 border-primary scale-105 shadow-md'
                      : 'bg-surface-container-low border-surface-variant/40 hover:bg-surface-container-high'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Room Code Input (only in Join mode) */}
          {mode === 'join' && (
            <div>
              <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-1.5">
                {lang === 'EN' ? '4-Digit Room Code' : '4자리 방 코드'}
              </label>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={4}
                required
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="8429"
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-surface-variant/60 text-on-surface text-center font-headline font-bold text-xl tracking-widest focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-container/30 active:scale-98 transition-all mt-2"
          >
            <span className="material-symbols-outlined text-[20px]">
              {mode === 'create' ? 'add_circle' : 'login'}
            </span>
            <span>
              {mode === 'create'
                ? (lang === 'EN' ? 'Create Room & Become Host' : '방 개설하고 방장 되기')
                : (lang === 'EN' ? 'Enter Room' : '게임 룸 입장하기')}
            </span>
          </button>
        </form>

        {/* Footer info link */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onOpenRules}
            className="text-xs text-outline hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            <span className="material-symbols-outlined text-[15px]">menu_book</span>
            <span>{lang === 'EN' ? 'How to Play & Scenario Rules' : '게임 방법 및 시나리오 규칙'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
