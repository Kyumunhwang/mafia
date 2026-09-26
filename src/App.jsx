import React, { useState } from 'react';
import { useGame } from './context/SocketContext';
import { Header } from './components/Header';
import { JoinView } from './components/JoinView';
import { LobbyView } from './components/LobbyView';
import { NightPhaseView } from './components/NightPhaseView';
import { DayDiscussionView } from './components/DayDiscussionView';
import { DayVotingView } from './components/DayVotingView';
import { DefenseVoteView } from './components/DefenseVoteView';
import { ExecutionResultView } from './components/ExecutionResultView';
import { GameOverView } from './components/GameOverView';
import { RulesModal } from './components/RulesModal';
import { QRModal } from './components/QRModal';
import { SoundModal } from './components/SoundModal';
import { PrivacyShieldOverlay } from './components/PrivacyShieldOverlay';

export const App = () => {
  const { roomState, toast } = useGame();
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isSoundOpen, setIsSoundOpen] = useState(false);

  const renderCurrentView = () => {
    if (!roomState) {
      return <JoinView onOpenRules={() => setIsRulesOpen(true)} />;
    }

    switch (roomState.phase) {
      case 'LOBBY':
        return (
          <LobbyView
            onOpenQR={() => setIsQROpen(true)}
            onOpenRules={() => setIsRulesOpen(true)}
          />
        );
      case 'NIGHT':
        return <NightPhaseView />;
      case 'DAY_DISCUSSION':
        return <DayDiscussionView />;
      case 'DAY_VOTING':
        return <DayVotingView />;
      case 'DEFENSE_VOTE':
        return <DefenseVoteView />;
      case 'EXECUTION_RESULT':
        return <ExecutionResultView />;
      case 'GAME_OVER':
        return <GameOverView />;
      default:
        return (
          <LobbyView
            onOpenQR={() => setIsQROpen(true)}
            onOpenRules={() => setIsRulesOpen(true)}
          />
        );
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* Universal Header */}
      <Header
        onOpenQR={() => setIsQROpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenSound={() => setIsSoundOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col pt-16 relative w-full">
        {renderCurrentView()}
      </main>

      {/* Global Modals & Overlays */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <QRModal isOpen={isQROpen} onClose={() => setIsQROpen(false)} />
      <SoundModal isOpen={isSoundOpen} onClose={() => setIsSoundOpen(false)} />
      <PrivacyShieldOverlay />

      {/* Toast Notification Container */}
      <div
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${
          toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <div className="bg-surface-container-highest/95 border border-surface-variant/60 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
          <span className="font-headline font-semibold text-xs text-on-surface">{toast.message}</span>
        </div>
      </div>
    </div>
  );
};
export default App;
