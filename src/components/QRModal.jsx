import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useGame } from '../context/SocketContext';

export const QRModal = ({ isOpen, onClose }) => {
  const { roomState, serverInfo, lang, showToast } = useGame();
  const canvasRef = useRef(null);
  const [selectedIp, setSelectedIp] = useState('');

  const defaultIp = serverInfo.localIp || window.location.hostname;
  const currentIp = selectedIp || defaultIp;
  const clientPort = serverInfo.clientPort || 3005;
  const joinUrl = `http://${currentIp}:${clientPort}?room=${roomState?.roomCode || ''}`;

  useEffect(() => {
    if (serverInfo.localIp && !selectedIp) {
      setSelectedIp(serverInfo.localIp);
    }
  }, [serverInfo.localIp]);

  useEffect(() => {
    if (isOpen && canvasRef.current && roomState?.roomCode) {
      QRCode.toCanvas(canvasRef.current, joinUrl, {
        width: 210,
        margin: 2,
        color: {
          dark: '#121317',
          light: '#ffffff'
        }
      });
    }
  }, [isOpen, joinUrl, roomState?.roomCode]);

  if (!isOpen) return null;

  const copyUrl = () => {
    navigator.clipboard?.writeText(joinUrl);
    showToast(lang === 'EN' ? 'Join URL copied to clipboard!' : '초대 URL이 클립보드에 복사되었습니다!');
  };

  const availableIps = serverInfo.availableIps || [];

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-low border border-surface-variant/50 rounded-2xl p-5 flex flex-col items-center gap-3.5 shadow-2xl max-w-sm w-full text-center">
        {/* Header */}
        <div className="flex items-center justify-between w-full pb-1 border-b border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">qr_code_2</span>
            <h3 className="font-headline font-bold text-base text-on-surface">
              {lang === 'EN' ? 'Scan with Mobile' : '스마트폰 카메라로 스캔'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* QR Canvas Box */}
        <div className="bg-white p-2.5 rounded-2xl shadow-xl flex items-center justify-center">
          <canvas ref={canvasRef} className="rounded-xl"></canvas>
        </div>

        {/* Room Code Display */}
        <div>
          <p className="text-[11px] text-outline uppercase tracking-wider font-semibold">
            {lang === 'EN' ? 'Room Code' : '방 고유 코드'}
          </p>
          <p className="font-headline text-3xl font-extrabold text-primary tracking-widest mt-0.5">
            #{roomState?.roomCode}
          </p>
        </div>

        {/* Direct Link Preview */}
        <div className="w-full bg-surface-container-lowest/70 border border-surface-variant/40 rounded-xl p-2.5 text-left">
          <span className="text-[10px] text-outline uppercase font-semibold block mb-0.5">
            {lang === 'EN' ? 'Target Mobile URL' : '접속 URL'}
          </span>
          <p className="text-xs text-tertiary-fixed font-mono truncate select-all">{joinUrl}</p>
        </div>

        {/* Network IP Selector (If multiple networks exist) */}
        {availableIps.length > 1 && (
          <div className="w-full text-left">
            <label className="text-[10px] text-outline uppercase font-semibold block mb-1">
              {lang === 'EN' ? 'Select Wi-Fi Network IP' : 'Wi-Fi IP 선택'}
            </label>
            <select
              value={selectedIp}
              onChange={(e) => setSelectedIp(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container text-xs text-on-surface border border-surface-variant/60 focus:outline-none focus:border-primary"
            >
              {availableIps.map((item, idx) => (
                <option key={idx} value={item.ip}>
                  {item.name}: {item.ip}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Instruction */}
        <p className="text-[11px] text-on-surface-variant leading-relaxed">
          {lang === 'EN'
            ? 'Ensure your phone is connected to the same Wi-Fi network as this computer.'
            : '스마트폰이 이 컴퓨터와 동일한 Wi-Fi 공유기에 연결되어 있는지 확인하세요.'}
        </p>

        {/* Copy Link Button */}
        <button
          type="button"
          onClick={copyUrl}
          className="w-full py-2.5 rounded-xl bg-primary-container text-on-primary-container font-headline font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">link</span>
          <span>{lang === 'EN' ? 'Copy Direct Link' : '접속 링크 복사하기'}</span>
        </button>
      </div>
    </div>
  );
};
