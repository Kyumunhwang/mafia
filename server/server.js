import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 3006;
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Robust Local IPv4 Address Detection (Exclude Virtual Switches & APIPA)
function getNetworkIpAddresses() {
  const interfaces = os.networkInterfaces();
  const validIps = [];

  for (const [name, ifaceList] of Object.entries(interfaces)) {
    // Filter out Hyper-V, WSL, VirtualBox, VMware, and Loopback adapters
    const lowerName = name.toLowerCase();
    const isVirtual = lowerName.includes('vethernet') ||
                      lowerName.includes('virtual') ||
                      lowerName.includes('wsl') ||
                      lowerName.includes('vmware') ||
                      lowerName.includes('loopback') ||
                      lowerName.includes('pseudo');

    for (const iface of ifaceList || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Exclude APIPA (169.254.x.x) and virtual networks
        if (!iface.address.startsWith('169.254.') && !iface.address.startsWith('127.')) {
          const priority = (!isVirtual && (lowerName.includes('wi-fi') || lowerName.includes('wlan') || lowerName.includes('ethernet'))) ? 1 : 2;
          validIps.push({
            name,
            address: iface.address,
            isVirtual,
            priority
          });
        }
      }
    }
  }

  // Sort by priority (physical Wi-Fi/Ethernet first)
  validIps.sort((a, b) => a.priority - b.priority);

  const bestIp = validIps.length > 0 ? validIps[0].address : 'localhost';
  return { bestIp, validIps };
}

const { bestIp, validIps } = getNetworkIpAddresses();
console.log(`[Network] Detected Primary LAN IP: ${bestIp}`);

// Info endpoint for client QR generation
app.get('/api/info', (req, res) => {
  const { bestIp, validIps } = getNetworkIpAddresses();
  res.json({
    localIp: bestIp,
    availableIps: validIps.map(v => ({ name: v.name, ip: v.address })),
    clientPort: 3005,
    serverPort: PORT
  });
});

// Rooms storage in-memory + local JSON backup
const rooms = new Map();
const DATA_FILE = path.join(process.cwd(), 'server', 'rooms_backup.json');

function saveRoomsBackup() {
  try {
    const backupData = [];
    for (const [code, room] of rooms.entries()) {
      backupData.push({
        roomCode: code,
        theme: room.theme,
        phase: room.phase,
        dayCount: room.dayCount,
        playersCount: room.players.length
      });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(backupData, null, 2));
  } catch (err) {
    console.error('Failed to save rooms backup:', err.message);
  }
}

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(code));
  return code;
}

function allocateRoles(playerCount) {
  let mafiaCount = 1;
  let copCount = 1;
  let docCount = 1;

  if (playerCount >= 7) mafiaCount = 2;
  if (playerCount >= 10) mafiaCount = 3;
  if (playerCount >= 13) mafiaCount = 4;

  const citizenCount = playerCount - (mafiaCount + copCount + docCount);
  const pool = [];

  for (let i = 0; i < mafiaCount; i++) pool.push('MAFIA');
  for (let i = 0; i < copCount; i++) pool.push('POLICE');
  for (let i = 0; i < docCount; i++) pool.push('DOCTOR');
  for (let i = 0; i < citizenCount; i++) pool.push('CITIZEN');

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool;
}

function evaluateVictory(room) {
  const living = room.players.filter(p => p.isAlive);
  const mafiaLiving = living.filter(p => p.role === 'MAFIA').length;
  const citizenLiving = living.filter(p => p.role !== 'MAFIA').length;

  if (mafiaLiving === 0) {
    return 'CITIZENS';
  }
  if (mafiaLiving >= citizenLiving) {
    return 'MAFIA';
  }
  return null;
}

function broadcastRoomState(room) {
  if (!room) return;

  for (const player of room.players) {
    if (player.isBot) continue;

    const socket = io.sockets.sockets.get(player.id);
    if (!socket) continue;

    const isGameOver = room.phase === 'GAME_OVER';
    const isSelfMafia = player.role === 'MAFIA';

    const sanitizedPlayers = room.players.map(p => {
      const isSelf = p.id === player.id;
      const canSeeMafia = isSelfMafia && p.role === 'MAFIA';
      const isDeadAndRevealed = !p.isAlive && room.phase !== 'NIGHT';

      return {
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        isHost: p.isHost,
        isAlive: p.isAlive,
        isBot: !!p.isBot,
        ready: p.ready,
        votedFor: room.phase === 'DAY_VOTING' || room.phase === 'DEFENSE_VOTE' ? p.votedFor : null,
        role: isGameOver || isSelf || canSeeMafia || isDeadAndRevealed ? p.role : null
      };
    });

    let privateInspection = null;
    if (player.role === 'POLICE' && room.nightActions.policeInspectTarget) {
      const target = room.players.find(p => p.id === room.nightActions.policeInspectTarget);
      if (target) {
        privateInspection = {
          targetId: target.id,
          targetNickname: target.nickname,
          isMafia: target.role === 'MAFIA'
        };
      }
    }

    const clientPayload = {
      roomCode: room.roomCode,
      theme: room.theme,
      phase: room.phase,
      dayCount: room.dayCount,
      hostId: room.hostId,
      myPlayerId: player.id,
      myRole: player.role,
      players: sanitizedPlayers,
      timer: {
        remainingSeconds: room.timer.remainingSeconds,
        totalSeconds: room.timer.totalSeconds,
        isActive: room.timer.isActive
      },
      lastVictim: room.lastVictim,
      executionCandidate: room.executionCandidate,
      defenseVotes: room.defenseVotes,
      winner: room.winner,
      privateInspection,
      chatMessages: room.chatMessages || [],
      defenseSpeech: room.defenseSpeech || null
    };

    socket.emit('room_state_update', clientPayload);
  }
}

function stopRoomTimer(room) {
  if (room.timer.intervalId) {
    clearInterval(room.timer.intervalId);
    room.timer.intervalId = null;
  }
  room.timer.isActive = false;
}

function startRoomTimer(room, seconds, onExpire) {
  stopRoomTimer(room);
  room.timer.remainingSeconds = seconds;
  room.timer.totalSeconds = seconds;
  room.timer.isActive = true;

  broadcastRoomState(room);

  room.timer.intervalId = setInterval(() => {
    room.timer.remainingSeconds -= 1;

    if (room.timer.remainingSeconds <= 0) {
      stopRoomTimer(room);
      onExpire();
    } else {
      io.to(room.roomCode).emit('timer_tick', {
        remainingSeconds: room.timer.remainingSeconds,
        totalSeconds: room.timer.totalSeconds
      });
    }
  }, 1000);
}

// Push a chat message and broadcast in real-time
function broadcastChatMessage(room, messageObj) {
  if (!room.chatMessages) room.chatMessages = [];
  room.chatMessages.push(messageObj);
  // Keep last 60 messages
  if (room.chatMessages.length > 60) {
    room.chatMessages.shift();
  }
  io.to(room.roomCode).emit('new_chat_message', messageObj);
}

// Stop bot discussion interval
function stopBotDiscussionLoop(room) {
  if (room.botDiscussionInterval) {
    clearInterval(room.botDiscussionInterval);
    room.botDiscussionInterval = null;
  }
}

// Contextual Chained Dialogue Bank per Scenario
const DIALOGUE_TEMPLATES = {
  classic: {
    accuse: [
      "@{target}, why are you sweating? You avoided answering about your alibi last night!",
      "@{target} was whispering with someone right before dawn. That's pure Mafia behavior.",
      "Look at @{target}'s voting record! They never point at real suspects.",
      "@{target}, you've been way too quiet. The real detectives always speak up!"
    ],
    defend: [
      "I'm an innocent citizen! Stop framing me, @{target}!",
      "I was at home all night listening for footsteps. Don't waste your vote on me!",
      "If you execute me, the city will lose a vital citizen vote. Think carefully!",
      "@{target} is clearly trying to deflect attention away from themselves!"
    ],
    agree: [
      "I agree with @{target}. Their suspicion makes a lot of sense.",
      "@{target} is right on the money. We should focus our votes there.",
      "Finally someone said it! @{target}'s logic is rock solid."
    ],
    clue: [
      "The gunshot came from the alley near the bank. Who was positioned there?",
      "The Detective should reveal any guilty findings if they found a Mafia last night!",
      "We need to eliminate at least one Mafia today or the numbers will overwhelm us."
    ]
  },
  school: {
    accuse: [
      "@{target}, I saw you near the 4th floor music room right at midnight!",
      "Why does @{target} have chalk on their uniform? The curse writing was just updated!",
      "@{target} is acting really weird today. Are you possessed by the urban legend?",
      "Check @{target}'s locker! I bet the cursed talisman is hidden inside!"
    ],
    defend: [
      "I was studying in the classroom with my headphones on! Leave me alone, @{target}!",
      "I am just a normal student! If you expel me, the delinquent wins!",
      "Don't fall for @{target}'s rumors! I'm completely innocent!",
      "Why are you picking on me, @{target}? Look at the real delinquents!"
    ],
    agree: [
      "I heard rumors about that too! @{target}'s point is really convincing.",
      "Exactly! @{target} saw the same thing I noticed during lunch break.",
      "Let's back up @{target}. We can't let another student get hurt."
    ],
    clue: [
      "Has anyone seen the School Nurse? We need to know who was healed!",
      "The Head Prefect should inspect the loudest person in the room.",
      "If we don't vote out the delinquent today, the ghost will take another student tonight!"
    ]
  },
  space: {
    accuse: [
      "@{target}'s bio-signature fluctuated right when the oxygen valves ruptured!",
      "Why were you near the escape pod airlock at 0200 hours, @{target}?",
      "@{target} isn't doing any repair tasks. That's classic alien saboteur behavior!",
      "Scan @{target}! I saw strange green bioluminescence on their visor!"
    ],
    defend: [
      "I was rebooting the secondary reactor in Sector 4! Stop accusing me, @{target}!",
      "My vitals are 100% human! If you eject me into the void, you lose an engineer!",
      "@{target} is trying to trigger a premature airlock purge on an innocent crewmate!",
      "Check my task logs! I fixed three wiring conduits while you just stood there!"
    ],
    agree: [
      "Telemetry logs back up @{target}'s observation. That sector was sealed off.",
      "I second @{target}'s proposal. We cannot risk the ship's reactor integrity.",
      "Sensors confirm what @{target} just said. We have a solid lead."
    ],
    clue: [
      "Did the Ship Marshal scan anyone last night? Transmit the bio-report!",
      "The medical cryo-pods are offline. We have only one chance to eject the alien today!",
      "Keep an eye on anyone who votes at the very last second."
    ]
  },
  vampire: {
    accuse: [
      "@{target} has no reflection in the silver goblets! Look at them!",
      "I smell sulfur and fresh blood on @{target}'s crimson cloak.",
      "@{target}, why are you flinching every time the holy sunlight touches the stained glass?",
      "The vampire lord is hiding behind courteous smiles. @{target} is our prime suspect!"
    ],
    defend: [
      "I hold the sacred rosary in my hand! I am a devout villager, @{target}!",
      "If you burn me at the stake, the vampire coven will feast unopposed tonight!",
      "@{target} speaks with the silver tongue of a demon. Do not be deceived!",
      "I prayed in the chapel all through the darkest hours. My blood is pure!"
    ],
    agree: [
      "The holy signs favor @{target}'s judgment. Cleanse the fiend!",
      "I witnessed the same dark omen @{target} speaks of.",
      "Stand with @{target}! The stake awaits the guilty."
    ],
    clue: [
      "Did the Vampire Hunter brand a vampire with the silver cross last night?",
      "The White Mage shielded someone from the bite. The dawn proves our faith.",
      "Before the blood moon rises again, the lord of the night must burn!"
    ]
  }
};

// Generate Chained Bot Response
function generateBotDialogue(room, speakerBot) {
  const theme = room.theme || 'classic';
  const templates = DIALOGUE_TEMPLATES[theme] || DIALOGUE_TEMPLATES.classic;
  const livingPlayers = room.players.filter(p => p.isAlive);

  // Find recent message to chain dialogue
  const lastMsg = room.chatMessages && room.chatMessages.length > 0
    ? room.chatMessages[room.chatMessages.length - 1]
    : null;

  let text = '';
  const eligibleTargets = livingPlayers.filter(p => p.id !== speakerBot.id);
  if (eligibleTargets.length === 0) return;

  // Decide dialogue action type
  const roll = Math.random();

  if (lastMsg && lastMsg.sender !== speakerBot.nickname && roll < 0.45) {
    // Reply or retaliate to the last speaker!
    if (roll < 0.25) {
      // Counter-accuse or defend against last speaker
      const pool = templates.defend;
      text = pool[Math.floor(Math.random() * pool.length)].replace('@{target}', lastMsg.sender);
    } else {
      // Agree with last speaker and target someone else
      const randomOther = eligibleTargets.find(p => p.nickname !== lastMsg.sender) || eligibleTargets[0];
      const pool = templates.agree;
      text = `${pool[Math.floor(Math.random() * pool.length)].replace('@{target}', lastMsg.sender)} @${randomOther.nickname} seems suspicious!`;
    }
  } else if (roll < 0.8) {
    // Accuse a random living player (prioritize human players for engagement)
    const humanTarget = eligibleTargets.find(p => !p.isBot);
    const target = (humanTarget && Math.random() < 0.6)
      ? humanTarget
      : eligibleTargets[Math.floor(Math.random() * eligibleTargets.length)];

    const pool = templates.accuse;
    text = pool[Math.floor(Math.random() * pool.length)].replace('@{target}', target.nickname);
  } else {
    // Share a scenario investigation clue
    const pool = templates.clue;
    text = pool[Math.floor(Math.random() * pool.length)];
  }

  const messageObj = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderId: speakerBot.id,
    sender: speakerBot.nickname,
    avatar: speakerBot.avatar,
    isBot: true,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };

  broadcastChatMessage(room, messageObj);
}

// Start continuous discussion loop with natural chaining
function startBotDiscussionLoop(room) {
  stopBotDiscussionLoop(room);

  // Send initial dawn announcement message
  setTimeout(() => {
    if (room.phase !== 'DAY_DISCUSSION') return;
    const livingBots = room.players.filter(p => p.isBot && p.isAlive);
    if (livingBots.length === 0) return;
    const starter = livingBots[Math.floor(Math.random() * livingBots.length)];

    let starterText = "Dawn has arrived! Let's analyze who was eliminated and find the culprits.";
    if (room.lastVictim) {
      starterText = room.lastVictim.saved
        ? `Incredible! ${room.lastVictim.nickname} was saved by the doctor's protection!`
        : `Tragic... ${room.lastVictim.nickname} was murdered. Who could have done this?`;
    }

    broadcastChatMessage(room, {
      id: `msg_${Date.now()}`,
      senderId: starter.id,
      sender: starter.nickname,
      avatar: starter.avatar,
      isBot: true,
      text: starterText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
  }, 1000);

  // Continuous chat interval: every 3.5 to 5.5 seconds
  room.botDiscussionInterval = setInterval(() => {
    if (room.phase !== 'DAY_DISCUSSION') {
      stopBotDiscussionLoop(room);
      return;
    }

    const livingBots = room.players.filter(p => p.isBot && p.isAlive);
    if (livingBots.length === 0) return;

    // Pick a bot who didn't speak last
    const lastMsg = room.chatMessages && room.chatMessages.length > 0
      ? room.chatMessages[room.chatMessages.length - 1]
      : null;

    const availableBots = livingBots.filter(b => !lastMsg || b.nickname !== lastMsg.sender);
    const speakerBot = availableBots.length > 0
      ? availableBots[Math.floor(Math.random() * availableBots.length)]
      : livingBots[Math.floor(Math.random() * livingBots.length)];

    generateBotDialogue(room, speakerBot);
  }, 4200);
}

// Check if all living humans and bots have acted
function checkNightCompletion(room) {
  const livingHumans = room.players.filter(p => !p.isBot && p.isAlive);
  const activeRolesToAct = livingHumans.filter(p => p.role === 'MAFIA' || p.role === 'POLICE' || p.role === 'DOCTOR');
  const allHumansActed = activeRolesToAct.every(p => p.nightTarget !== null);

  if (allHumansActed) {
    setTimeout(() => {
      if (room.phase === 'NIGHT') {
        resolveNightActions(room);
      }
    }, 1200);
  }
}

// Bot AI Engine for Night Actions
function triggerBotNightActions(room) {
  const livingBots = room.players.filter(p => p.isBot && p.isAlive);
  const livingPlayers = room.players.filter(p => p.isAlive);

  livingBots.forEach(bot => {
    setTimeout(() => {
      if (room.phase !== 'NIGHT' || !bot.isAlive) return;

      if (bot.role === 'MAFIA') {
        const targets = livingPlayers.filter(p => p.role !== 'MAFIA');
        if (targets.length > 0) {
          const chosen = targets[Math.floor(Math.random() * targets.length)];
          room.nightActions.mafiaTarget = chosen.id;
          bot.nightTarget = chosen.id;
        }
      } else if (bot.role === 'DOCTOR') {
        if (livingPlayers.length > 0) {
          const chosen = livingPlayers[Math.floor(Math.random() * livingPlayers.length)];
          room.nightActions.doctorTarget = chosen.id;
          bot.nightTarget = chosen.id;
        }
      } else if (bot.role === 'POLICE') {
        const targets = livingPlayers.filter(p => p.id !== bot.id);
        if (targets.length > 0) {
          const chosen = targets[Math.floor(Math.random() * targets.length)];
          room.nightActions.policeInspectTarget = chosen.id;
          bot.nightTarget = chosen.id;
        }
      }

      checkNightCompletion(room);
    }, Math.floor(800 + Math.random() * 1500));
  });
}

// Bot AI Day Voting
function triggerBotDayVoting(room) {
  const livingBots = room.players.filter(p => p.isBot && p.isAlive);
  const livingPlayers = room.players.filter(p => p.isAlive);

  livingBots.forEach((bot, index) => {
    setTimeout(() => {
      if (room.phase !== 'DAY_VOTING' || !bot.isAlive) return;

      const eligible = livingPlayers.filter(p => p.id !== bot.id);
      if (eligible.length > 0) {
        let targets = eligible;
        if (bot.role === 'MAFIA') {
          const nonMafia = eligible.filter(p => p.role !== 'MAFIA');
          if (nonMafia.length > 0) targets = nonMafia;
        }
        const chosen = targets[Math.floor(Math.random() * targets.length)];
        bot.votedFor = chosen.id;
      }

      broadcastRoomState(room);

      const allVoted = livingPlayers.every(p => p.votedFor !== null);
      if (allVoted) {
        resolveDayVotes(room);
      }
    }, (index + 1) * 1200);
  });
}

// Bot AI Defense Trial Verdict
function triggerBotDefenseVotes(room) {
  const candidateId = room.executionCandidate?.id;
  const eligibleBotJurors = room.players.filter(p => p.isBot && p.isAlive && p.id !== candidateId);

  eligibleBotJurors.forEach((bot, index) => {
    setTimeout(() => {
      if (room.phase !== 'DEFENSE_VOTE' || !bot.isAlive) return;

      bot.defenseVote = Math.random() < 0.65 ? 'guilty' : 'innocent';

      let guilty = 0;
      let innocent = 0;
      room.players.filter(p => p.isAlive && p.id !== candidateId).forEach(p => {
        if (p.defenseVote === 'guilty') guilty++;
        if (p.defenseVote === 'innocent') innocent++;
      });
      room.defenseVotes = { guilty, innocent };

      broadcastRoomState(room);

      const allJurors = room.players.filter(p => p.isAlive && p.id !== candidateId);
      const allDone = allJurors.every(p => p.defenseVote !== null);
      if (allDone) {
        resolveDefenseVotes(room);
      }
    }, (index + 1) * 1000);
  });
}

// Phase transitions
function transitionToNight(room) {
  stopRoomTimer(room);
  stopBotDiscussionLoop(room);
  room.phase = 'NIGHT';
  room.nightActions = {
    mafiaTarget: null,
    doctorTarget: null,
    policeInspectTarget: null
  };
  room.players.forEach(p => {
    p.votedFor = null;
    p.nightTarget = null;
  });

  startRoomTimer(room, 40, () => {
    resolveNightActions(room);
  });

  broadcastRoomState(room);
  triggerBotNightActions(room);
}

function resolveNightActions(room) {
  stopRoomTimer(room);
  stopBotDiscussionLoop(room);
  const targetId = room.nightActions.mafiaTarget;
  const docTargetId = room.nightActions.doctorTarget;

  let victim = null;
  if (targetId) {
    const target = room.players.find(p => p.id === targetId && p.isAlive);
    if (target) {
      if (targetId === docTargetId) {
        victim = {
          id: target.id,
          nickname: target.nickname,
          saved: true
        };
      } else {
        target.isAlive = false;
        victim = {
          id: target.id,
          nickname: target.nickname,
          saved: false,
          role: target.role
        };
      }
    }
  }

  room.lastVictim = victim;
  room.dayCount += 1;

  const win = evaluateVictory(room);
  if (win) {
    room.phase = 'GAME_OVER';
    room.winner = win;
    broadcastRoomState(room);
    return;
  }

  transitionToDay(room);
}

function transitionToDay(room) {
  room.phase = 'DAY_DISCUSSION';
  room.chatMessages = []; // Fresh discussion log per day

  startRoomTimer(room, 90, () => {
    transitionToVoting(room);
  });
  broadcastRoomState(room);

  // Start living bot debate loop
  startBotDiscussionLoop(room);
}

function transitionToVoting(room) {
  stopRoomTimer(room);
  stopBotDiscussionLoop(room);
  room.phase = 'DAY_VOTING';
  room.players.forEach(p => { p.votedFor = null; });

  startRoomTimer(room, 45, () => {
    resolveDayVotes(room);
  });
  broadcastRoomState(room);
  triggerBotDayVoting(room);
}

function resolveDayVotes(room) {
  stopRoomTimer(room);
  const voteCounts = {};
  room.players.filter(p => p.isAlive).forEach(p => {
    if (p.votedFor) {
      voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
    }
  });

  let topCandidateId = null;
  let maxVotes = 0;
  let isTie = false;

  for (const [candidateId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      topCandidateId = candidateId;
      isTie = false;
    } else if (count === maxVotes && maxVotes > 0) {
      isTie = true;
    }
  }

  if (!topCandidateId || isTie || maxVotes < 2) {
    room.executionCandidate = null;
    room.phase = 'EXECUTION_RESULT';
    room.lastExecuted = null;
    broadcastRoomState(room);

    setTimeout(() => {
      transitionToNight(room);
    }, 4000);
    return;
  }

  const candidate = room.players.find(p => p.id === topCandidateId);
  room.executionCandidate = {
    id: candidate.id,
    nickname: candidate.nickname,
    role: candidate.role,
    votes: maxVotes
  };
  room.defenseVotes = { guilty: 0, innocent: 0 };
  room.defenseSpeech = null;
  room.players.forEach(p => { p.defenseVote = null; });

  room.phase = 'DEFENSE_VOTE';
  startRoomTimer(room, 30, () => {
    resolveDefenseVotes(room);
  });
  broadcastRoomState(room);

  // If candidate is a bot, trigger their desperate defense speech after 1.5s
  if (candidate.isBot) {
    setTimeout(() => {
      if (room.phase !== 'DEFENSE_VOTE') return;
      const theme = room.theme || 'classic';
      const defensePool = {
        classic: [
          "I am an innocent citizen! The real Mafia is trying to frame me to secure victory!",
          "Check my record! I've been helping the investigation since day one!",
          "If you execute me today, the city loses another good citizen. Vote Innocent!"
        ],
        school: [
          "I swear I'm not the delinquent behind the curse! Don't expel me!",
          "The real delinquent is hiding among the accusers! Look at who voted for me!",
          "I was in study hall all night! Please vote Innocent!"
        ],
        space: [
          "My bio-readings are 100% human! The alien saboteur is manipulating the votes!",
          "Ejecting me will leave the ship without an engineer! Vote Innocent!",
          "I have completed all my maintenance tasks! Don't open the airlock!"
        ],
        vampire: [
          "I carry the holy rosary! I have never tasted mortal blood!",
          "The vampire lord is laughing in the shadows while you condemn an innocent soul!",
          "Spare me from the stake! My faith and humanity are pure!"
        ]
      };
      const texts = defensePool[theme] || defensePool.classic;
      const chosenText = texts[Math.floor(Math.random() * texts.length)];
      room.defenseSpeech = chosenText;

      broadcastChatMessage(room, {
        id: `defense_${Date.now()}`,
        senderId: candidate.id,
        sender: candidate.nickname,
        avatar: candidate.avatar,
        isBot: true,
        text: chosenText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      broadcastRoomState(room);
    }, 1500);
  }

  triggerBotDefenseVotes(room);
}

function resolveDefenseVotes(room) {
  stopRoomTimer(room);
  const { guilty, innocent } = room.defenseVotes;
  const candidate = room.players.find(p => p.id === room.executionCandidate?.id);

  if (guilty > innocent && candidate) {
    candidate.isAlive = false;
    room.lastExecuted = {
      id: candidate.id,
      nickname: candidate.nickname,
      role: candidate.role,
      executed: true
    };
  } else {
    room.lastExecuted = {
      id: candidate?.id,
      nickname: candidate?.nickname,
      executed: false
    };
  }

  room.phase = 'EXECUTION_RESULT';
  broadcastRoomState(room);

  const win = evaluateVictory(room);
  if (win) {
    setTimeout(() => {
      room.phase = 'GAME_OVER';
      room.winner = win;
      broadcastRoomState(room);
    }, 4500);
    return;
  }

  setTimeout(() => {
    transitionToNight(room);
  }, 4500);
}

const BOT_NAMES = ['Alpha', 'Nova', 'Echo', 'Viper', 'Shadow', 'Phoenix', 'Raven', 'Titan', 'Ghost', 'Oracle'];
const BOT_AVATARS = ['🤖', '🦊', '🐺', '🦁', '🐯', '🦅', '🦉', '🦇', '👻', '🎩'];

// Socket IO Event Handling
io.on('connection', (socket) => {
  let currentRoomCode = null;

  // Create Room
  socket.on('create_room', ({ nickname, avatar, theme }) => {
    const roomCode = generateRoomCode();
    const newRoom = {
      roomCode,
      hostId: socket.id,
      theme: theme || 'classic',
      phase: 'LOBBY',
      dayCount: 1,
      timer: {
        remainingSeconds: 0,
        totalSeconds: 0,
        isActive: false,
        intervalId: null
      },
      players: [
        {
          id: socket.id,
          nickname: nickname || 'Host Player',
          avatar: avatar || '👑',
          isHost: true,
          isAlive: true,
          ready: true,
          isBot: false,
          role: null,
          votedFor: null,
          nightTarget: null
        }
      ],
      nightActions: {
        mafiaTarget: null,
        doctorTarget: null,
        policeInspectTarget: null
      },
      lastVictim: null,
      executionCandidate: null,
      defenseVotes: { guilty: 0, innocent: 0 },
      winner: null,
      chatMessages: [],
      botDiscussionInterval: null
    };

    rooms.set(roomCode, newRoom);
    currentRoomCode = roomCode;
    socket.join(roomCode);
    saveRoomsBackup();

    broadcastRoomState(newRoom);
  });

  // Join Room
  socket.on('join_room', ({ roomCode, nickname, avatar }) => {
    const code = (roomCode || '').trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('error_message', 'Room not found. Please verify the 4-digit code.');
      return;
    }

    if (room.phase !== 'LOBBY') {
      socket.emit('error_message', 'Game is already in progress in this room.');
      return;
    }

    if (room.players.length >= 15) {
      socket.emit('error_message', 'Room is full (max 15 players).');
      return;
    }

    const newPlayer = {
      id: socket.id,
      nickname: nickname || `Player ${room.players.length + 1}`,
      avatar: avatar || '🎭',
      isHost: false,
      isAlive: true,
      ready: false,
      isBot: false,
      role: null,
      votedFor: null,
      nightTarget: null
    };

    room.players.push(newPlayer);
    currentRoomCode = code;
    socket.join(code);
    saveRoomsBackup();

    broadcastRoomState(room);
  });

  // Add Bot
  socket.on('add_bot', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'LOBBY') return;

    if (room.players.length >= 15) {
      socket.emit('error_message', 'Maximum 15 players reached.');
      return;
    }

    const botIndex = room.players.filter(p => p.isBot).length;
    const name = `Bot ${BOT_NAMES[botIndex % BOT_NAMES.length]} 🤖`;
    const avatar = BOT_AVATARS[botIndex % BOT_AVATARS.length];
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    room.players.push({
      id: botId,
      nickname: name,
      avatar,
      isHost: false,
      isAlive: true,
      ready: true,
      isBot: true,
      role: null,
      votedFor: null,
      nightTarget: null
    });

    broadcastRoomState(room);
  });

  // Remove Bot
  socket.on('remove_bot', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'LOBBY') return;

    const botIndex = room.players.findLastIndex(p => p.isBot);
    if (botIndex !== -1) {
      room.players.splice(botIndex, 1);
      broadcastRoomState(room);
    }
  });

  // Fill Bots to 5
  socket.on('fill_bots', ({ targetCount = 5 } = {}) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'LOBBY') return;

    while (room.players.length < targetCount && room.players.length < 15) {
      const botIndex = room.players.filter(p => p.isBot).length;
      const name = `Bot ${BOT_NAMES[botIndex % BOT_NAMES.length]} 🤖`;
      const avatar = BOT_AVATARS[botIndex % BOT_AVATARS.length];
      const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      room.players.push({
        id: botId,
        nickname: name,
        avatar,
        isHost: false,
        isAlive: true,
        ready: true,
        isBot: true,
        role: null,
        votedFor: null,
        nightTarget: null
      });
    }

    broadcastRoomState(room);
  });

  // User Sent Chat Message (During Discussion or Trial)
  socket.on('send_chat', ({ text }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || (room.phase !== 'DAY_DISCUSSION' && room.phase !== 'DEFENSE_VOTE')) return;

    const player = room.players.find(p => p.id === socket.id && p.isAlive);
    if (!player) return;

    const cleanText = (text || '').trim();
    if (!cleanText) return;

    // If player is the accused candidate in trial, mark as official defense speech
    const isAccused = room.phase === 'DEFENSE_VOTE' && room.executionCandidate?.id === player.id;
    if (isAccused) {
      room.defenseSpeech = cleanText;
    }

    const msgObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: player.id,
      sender: player.nickname,
      avatar: player.avatar,
      isBot: false,
      isAccused,
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    broadcastChatMessage(room, msgObj);
    if (isAccused) {
      broadcastRoomState(room);
    }

    // Prompt a bot to respond / chain back to the human player within 1.5 - 2.5 seconds
    const livingBots = room.players.filter(p => p.isBot && p.isAlive);
    if (livingBots.length > 0) {
      setTimeout(() => {
        if (room.phase === 'DAY_DISCUSSION') {
          const responder = livingBots[Math.floor(Math.random() * livingBots.length)];
          generateBotDialogue(room, responder);
        } else if (room.phase === 'DEFENSE_VOTE' && isAccused) {
          // Bot reacts to the player's defense plea
          const responder = livingBots.find(b => b.id !== player.id);
          if (responder) {
            const reactionPool = [
              "That plea sounds genuine... Should we spare them?",
              "Don't let them deceive you! Vote according to the clues!",
              "I'm torn, but we have to make a choice."
            ];
            const reaction = reactionPool[Math.floor(Math.random() * reactionPool.length)];
            broadcastChatMessage(room, {
              id: `react_${Date.now()}`,
              senderId: responder.id,
              sender: responder.nickname,
              avatar: responder.avatar,
              isBot: true,
              text: reaction,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            });
          }
        }
      }, Math.floor(1500 + Math.random() * 1200));
    }
  });

  // Select Scenario Theme
  socket.on('select_scenario', ({ theme }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'LOBBY') return;
    room.theme = theme;
    broadcastRoomState(room);
  });

  // Toggle Ready
  socket.on('toggle_ready', () => {
    const room = rooms.get(currentRoomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player && !player.isHost) {
      player.ready = !player.ready;
      broadcastRoomState(room);
    }
  });

  // Start Game
  socket.on('start_game', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'LOBBY') return;

    if (room.players.length < 5) {
      socket.emit('error_message', 'Minimum 5 players required to start.');
      return;
    }

    const roles = allocateRoles(room.players.length);
    room.players.forEach((p, index) => {
      p.role = roles[index];
      p.isAlive = true;
      p.ready = true;
    });

    room.dayCount = 1;
    room.lastVictim = null;
    room.winner = null;
    room.chatMessages = [];

    transitionToNight(room);
  });

  // Night Action
  socket.on('night_action', ({ targetId }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.phase !== 'NIGHT') return;

    const player = room.players.find(p => p.id === socket.id && p.isAlive);
    if (!player) return;

    player.nightTarget = targetId;

    if (player.role === 'MAFIA') {
      room.nightActions.mafiaTarget = targetId;
    } else if (player.role === 'DOCTOR') {
      room.nightActions.doctorTarget = targetId;
    } else if (player.role === 'POLICE') {
      room.nightActions.policeInspectTarget = targetId;
    }

    broadcastRoomState(room);
    checkNightCompletion(room);
  });

  // Day Suspect Voting
  socket.on('cast_day_vote', ({ targetId }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.phase !== 'DAY_VOTING') return;

    const player = room.players.find(p => p.id === socket.id && p.isAlive);
    if (!player) return;

    player.votedFor = targetId;
    broadcastRoomState(room);

    const living = room.players.filter(p => p.isAlive);
    const allVoted = living.every(p => p.votedFor !== null);
    if (allVoted) {
      resolveDayVotes(room);
    }
  });

  // Defense Verdict Vote
  socket.on('cast_defense_vote', ({ vote }) => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.phase !== 'DEFENSE_VOTE') return;

    const player = room.players.find(p => p.id === socket.id && p.isAlive);
    if (!player || player.id === room.executionCandidate?.id) return;

    player.defenseVote = vote;

    let guilty = 0;
    let innocent = 0;
    room.players.filter(p => p.isAlive && p.id !== room.executionCandidate?.id).forEach(p => {
      if (p.defenseVote === 'guilty') guilty++;
      if (p.defenseVote === 'innocent') innocent++;
    });

    room.defenseVotes = { guilty, innocent };
    broadcastRoomState(room);

    const eligibleJurors = room.players.filter(p => p.isAlive && p.id !== room.executionCandidate?.id);
    const allJurorsVoted = eligibleJurors.every(p => p.defenseVote !== null);
    if (allJurorsVoted) {
      resolveDefenseVotes(room);
    }
  });

  // Host Skip Discussion
  socket.on('skip_discussion', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'DAY_DISCUSSION') return;
    transitionToVoting(room);
  });

  // Reset to Lobby
  socket.on('reset_to_lobby', () => {
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id) return;

    room.phase = 'LOBBY';
    room.dayCount = 1;
    room.winner = null;
    room.lastVictim = null;
    room.executionCandidate = null;
    room.chatMessages = [];
    stopBotDiscussionLoop(room);
    stopRoomTimer(room);

    room.players.forEach(p => {
      p.role = null;
      p.isAlive = true;
      p.votedFor = null;
      p.nightTarget = null;
      p.ready = p.isHost || p.isBot;
    });

    broadcastRoomState(room);
  });

  // Disconnection
  socket.on('disconnect', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    if (room.phase === 'LOBBY') {
      room.players = room.players.filter(p => p.id !== socket.id);
      const humanPlayers = room.players.filter(p => !p.isBot);
      if (humanPlayers.length === 0) {
        stopBotDiscussionLoop(room);
        stopRoomTimer(room);
        rooms.delete(currentRoomCode);
      } else if (room.hostId === socket.id) {
        room.hostId = humanPlayers[0].id;
        humanPlayers[0].isHost = true;
        humanPlayers[0].ready = true;
        broadcastRoomState(room);
      } else {
        broadcastRoomState(room);
      }
    } else {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.disconnected = true;
        broadcastRoomState(room);
      }
    }
    saveRoomsBackup();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Mafia Server] Running on http://localhost:${PORT}`);
  console.log(`[Mafia Server] Primary LAN IP: http://${bestIp}:${PORT}`);
});
