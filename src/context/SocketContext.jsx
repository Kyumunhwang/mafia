import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useGame = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useGame must be used within a SocketProvider');
  }
  return context;
};

// Web Audio API Sound Synthesizer for SFX
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playGong() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }

  playAction() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playVictory() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.12);
      osc.stop(this.ctx.currentTime + idx * 0.12 + 0.3);
    });
  }
}

// Procedural Scenario-Themed BGM Synthesizer Engine
class ThemeBgmSynthesizer {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.currentTheme = null;
    this.isPlaying = false;
    this.timerId = null;
    this.volume = 0.28;
    this.stepIndex = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isPlaying = false;
  }

  // Play a single procedural note with ADSR envelope
  playTone(freq, duration, type = 'sine', gainVal = 0.15, filterFreq = 2000) {
    if (!this.ctx || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, now);

    // ADSR Envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(gainVal * 0.6, now + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  // Set and play procedural soundtrack for a specific scenario theme
  playTheme(themeName) {
    this.init();
    this.currentTheme = themeName || 'classic';
    this.stop();
    this.isPlaying = true;
    this.stepIndex = 0;

    // Theme Sequencers:
    if (this.currentTheme === 'classic') {
      // 1. Classic Noir: 75 BPM, Melancholic Jazz & Deep Walking Bass
      const bassNotes = [65.41, 77.78, 87.31, 98.00, 116.54, 98.00, 87.31, 77.78]; // C2, Eb2, F2, G2, Bb2...
      const pianoChords = [
        [196.00, 246.94, 293.66], // G3, B3, D4
        [174.61, 220.00, 261.63], // F3, A3, C4
        [164.81, 207.65, 246.94], // E3, G#3, B3
        [130.81, 164.81, 196.00]  // C3, E3, G3
      ];

      this.timerId = setInterval(() => {
        if (!this.isPlaying) return;
        const bassFreq = bassNotes[this.stepIndex % bassNotes.length];
        this.playTone(bassFreq, 0.45, 'triangle', 0.22, 500);

        if (this.stepIndex % 2 === 0) {
          const chord = pianoChords[Math.floor((this.stepIndex % 8) / 2)];
          chord.forEach(f => this.playTone(f, 0.75, 'sine', 0.08, 1200));
        }

        this.stepIndex = (this.stepIndex + 1) % 16;
      }, 420);

    } else if (this.currentTheme === 'school') {
      // 2. School Ghost Story: 55 BPM, Eerie Music Box / Celesta & Heartbeat
      const musicBoxNotes = [987.77, 1046.50, 830.61, 880.00, 622.25, 659.25, 783.99, 587.33]; // B5, C6, G#5, A5...
      const heartPulse = [55.00, 48.99]; // A1, G1

      this.timerId = setInterval(() => {
        if (!this.isPlaying) return;
        // Heartbeat sub-bass
        if (this.stepIndex % 4 === 0 || this.stepIndex % 4 === 1) {
          const beat = heartPulse[(this.stepIndex % 4 === 0) ? 0 : 1];
          this.playTone(beat, 0.35, 'triangle', 0.28, 180);
        }

        // Chilling music box chime
        if (this.stepIndex % 2 === 0) {
          const note = musicBoxNotes[Math.floor(this.stepIndex / 2) % musicBoxNotes.length];
          this.playTone(note, 0.8, 'sine', 0.12, 3500);
        }

        this.stepIndex = (this.stepIndex + 1) % 16;
      }, 550);

    } else if (this.currentTheme === 'space') {
      // 3. Spaceship Survival: 110 BPM, Cybernetic Synth Arpeggio & Pulse
      const synthArp = [146.83, 174.61, 220.00, 261.63, 293.66, 349.23, 261.63, 220.00]; // D3, F3, A3, C4...
      const droneNote = 73.42; // D2

      this.timerId = setInterval(() => {
        if (!this.isPlaying) return;
        const arp = synthArp[this.stepIndex % synthArp.length];
        this.playTone(arp, 0.2, 'sawtooth', 0.14, 1800);

        if (this.stepIndex % 8 === 0) {
          this.playTone(droneNote, 1.8, 'triangle', 0.26, 400);
        }

        this.stepIndex = (this.stepIndex + 1) % 16;
      }, 260);

    } else if (this.currentTheme === 'vampire') {
      // 4. Vampire Castle: 65 BPM, Gothic Pipe Organ & Blood Moon Bell
      const organNotes = [
        [146.83, 220.00, 293.66], // Dm (D3, A3, D4)
        [116.54, 174.61, 233.08], // Bb (Bb2, F3, Bb3)
        [98.00, 146.83, 196.00],  // Gm (G2, D3, G3)
        [110.00, 164.81, 220.00]  // A (A2, C#3, A3)
      ];
      const cathedralBell = 110.00; // A2 deep bell

      this.timerId = setInterval(() => {
        if (!this.isPlaying) return;
        const chordIndex = Math.floor(this.stepIndex / 4) % organNotes.length;
        const chord = organNotes[chordIndex];

        // Sustained pipe organ chords
        chord.forEach(freq => {
          this.playTone(freq, 1.2, 'sawtooth', 0.10, 850);
        });

        // Gothic bell toll every 8 steps
        if (this.stepIndex % 8 === 0) {
          this.playTone(cathedralBell, 2.2, 'sine', 0.25, 600);
        }

        this.stepIndex = (this.stepIndex + 1) % 16;
      }, 620);
    }
  }
}

export const sounds = new SoundEngine();
export const bgmEngine = new ThemeBgmSynthesizer();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [lang, setLang] = useState('EN');
  const [shieldActive, setShieldActive] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [serverInfo, setServerInfo] = useState({ localIp: 'localhost', clientPort: 3005, availableIps: [] });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [bgmVolume, setBgmVolumeState] = useState(0.28);
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);

  const prevPhaseRef = useRef(null);
  const currentThemeRef = useRef(null);

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 2500);
  };

  useEffect(() => {
    const backendUrl = window.location.port === '3005'
      ? `${window.location.protocol}//${window.location.hostname}:3006`
      : '/';

    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to Mafia server with id:', newSocket.id);
    });

    newSocket.on('room_state_update', (state) => {
      setRoomState(state);
    });

    newSocket.on('timer_tick', (timer) => {
      setRoomState(prev => prev ? { ...prev, timer: { ...prev.timer, ...timer } } : prev);
      if (timer.remainingSeconds <= 5 && timer.remainingSeconds > 0) {
        sounds.playTick();
      }
    });

    newSocket.on('new_chat_message', (msg) => {
      setRoomState(prev => {
        if (!prev) return prev;
        const exists = prev.chatMessages?.some(m => m.id === msg.id);
        if (exists) return prev;
        return {
          ...prev,
          chatMessages: [...(prev.chatMessages || []), msg]
        };
      });
      sounds.playTick();
    });

    newSocket.on('error_message', (msg) => {
      showToast(`⚠️ ${msg}`);
    });

    setSocket(newSocket);

    fetch(`${backendUrl}/api/info`)
      .then(res => res.json())
      .then(data => setServerInfo(data))
      .catch(() => {});

    return () => {
      bgmEngine.stop();
      newSocket.disconnect();
    };
  }, []);

  // Update Theme BGM dynamically whenever room theme changes
  useEffect(() => {
    const activeTheme = roomState?.theme || 'classic';
    if (bgmEnabled && (currentThemeRef.current !== activeTheme || !bgmEngine.isPlaying)) {
      bgmEngine.playTheme(activeTheme);
      currentThemeRef.current = activeTheme;
    }
  }, [roomState?.theme, bgmEnabled]);

  // Play atmospheric audio on phase transitions
  useEffect(() => {
    if (roomState && roomState.phase !== prevPhaseRef.current) {
      if (roomState.phase === 'NIGHT' || roomState.phase === 'DAY_DISCUSSION') {
        sounds.playGong();
      } else if (roomState.phase === 'GAME_OVER') {
        sounds.playVictory();
      }
      prevPhaseRef.current = roomState.phase;
    }
  }, [roomState?.phase]);

  const toggleSound = () => {
    sounds.init();
    const next = !soundEnabled;
    sounds.enabled = next;
    setSoundEnabled(next);
    showToast(next ? 'Sound FX Enabled' : 'Sound FX Muted');
  };

  const toggleBgm = () => {
    const next = !bgmEnabled;
    setBgmEnabled(next);
    if (next) {
      bgmEngine.playTheme(roomState?.theme || 'classic');
      showToast('BGM Music Started');
    } else {
      bgmEngine.stop();
      showToast('BGM Music Muted');
    }
  };

  const setBgmVolume = (val) => {
    setBgmVolumeState(val);
    bgmEngine.setVolume(val);
  };

  const toggleLang = () => {
    const next = lang === 'EN' ? 'KO' : 'EN';
    setLang(next);
    showToast(next === 'EN' ? 'Language: English' : '언어: 한국어');
  };

  const toggleShield = () => {
    const next = !shieldActive;
    setShieldActive(next);
    showToast(next ? 'Privacy Shield Activated' : 'Privacy Shield Deactivated');
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        roomState,
        lang,
        toggleLang,
        shieldActive,
        setShieldActive,
        toggleShield,
        toast,
        showToast,
        serverInfo,
        setServerInfo,
        soundEnabled,
        toggleSound,
        bgmEnabled,
        toggleBgm,
        bgmVolume,
        setBgmVolume,
        isSoundModalOpen,
        setIsSoundModalOpen
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
