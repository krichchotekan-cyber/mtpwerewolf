// server.js - Werewolf Game Backend Server (Updated)
const express = require('express');
const http = require('http');
const path = require('path'); // ⭐ ต้องเพิ่ม: สำหรับจัดการพาธไฟล์
const { Server } = require('socket.io');
const cors = require('cors');

// ⭐ กำหนด PORT ที่ยืดหยุ่นสำหรับ Local และ Production (Render)
const PORT = process.env.PORT || 3001; 

const app = express();
const server = http.createServer(app);

// 1. ตั้งค่า CORS สำหรับ HTTP (Express)
// หากคุณมี Frontend แยกต่างหาก และ Backend มี API
// การใช้ cors() ทั่วไปอาจจะพอ แต่ควรระบุ origin ให้ชัดเจนขึ้น
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // ใช้ตัวแปร ENV หรืออนุญาตทั้งหมด (ไม่แนะนำสำหรับ Production จริง)
    methods: ["GET", "POST"]
}));
app.use(express.json());

// 2. ⭐ ตั้งค่า Static Files (สำหรับ Frontend)
// ชี้ให้ Express Serve ไฟล์ในโฟลเดอร์ frontend
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));

// 3. ⭐ ตั้งค่า Route หลัก (index.html)
// เมื่อเข้าสู่ URL หลัก ให้ส่งไฟล์ index.html กลับไป
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// 4. ตั้งค่า Socket.IO (สำหรับ Real-time)
// CORS ของ Socket.IO ควรใช้การตั้งค่าเดียวกับ Express เพื่อความสอดคล้องกัน
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*', // ใช้ตัวแปร ENV เดียวกัน
    methods: ["GET", "POST"]
  }
});

// ⭐ 5. เริ่ม Server ด้วย PORT ที่กำหนด
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Game State Storage
const rooms = new Map();
const players = new Map();

// Role Definitions
const roles = [
  { name: 'ชาวบ้าน', nameEn: 'Villager', team: 'villager', icon: '👨‍🌾', abilities: [] },
  { name: 'เทพยากร', nameEn: 'Seer', team: 'villager', icon: '🔮', abilities: ['investigate'] },
  { name: 'บอดี้การ์ด', nameEn: 'Bodyguard', team: 'villager', icon: '🛡️', abilities: ['protect'] },
  { name: 'แม่มด', nameEn: 'Witch', team: 'villager', icon: '🧙‍♀️', abilities: ['heal', 'poison'] },
  { name: 'จอมเวท', nameEn: 'Wizard', team: 'villager', icon: '🧙‍♂️', abilities: ['seal'] },
  { name: 'นายพราน', nameEn: 'Hunter', team: 'villager', icon: '🏹', abilities: ['revenge_kill'] },
  { name: 'โสเภณี', nameEn: 'Prostitute', team: 'villager', icon: '💋', abilities: ['block_and_protect'] },
  { name: 'มนุษย์หมาป่า', nameEn: 'Werewolf', team: 'werewolf', icon: '🐺', abilities: ['kill', 'know_werewolves'] },
  { name: 'ลูกหมาป่า', nameEn: 'Wolf Cub', team: 'werewolf', icon: '🐶', abilities: ['kill', 'double_kill_revenge', 'know_werewolves'] },
  { name: 'นางเงือก', nameEn: 'Mermaid', team: 'werewolf', icon: '🧜‍♀️', abilities: ['silence', 'know_werewolves'] },
  { name: 'ผู้รับใช้', nameEn: 'Minion', team: 'werewolf', icon: '👤', abilities: ['know_werewolves'] },
  { name: 'ป้าขี้เมา', nameEn: 'Village Drunk', team: 'neutral', icon: '🍺', abilities: ['win_when_voted'] }
];

const roleDistributions = {
  5: [{ nameEn: 'Seer', count: 1 }, { nameEn: 'Villager', count: 2 }, { nameEn: 'Werewolf', count: 1 } ,{ nameEn: 'Bodyguard', count: 1 }],
  6: [{ nameEn: 'Seer', count: 1 }, { nameEn: 'Bodyguard', count: 1 }, { nameEn: 'Villager', count: 2 }, { nameEn: 'Werewolf', count: 2 }],
  7: [{ nameEn: 'Seer', count: 1 }, { nameEn: 'Bodyguard', count: 1 }, { nameEn: 'Villager', count: 3 }, { nameEn: 'Werewolf', count: 2 }],
  8: [{ nameEn: 'Seer', count: 1 }, { nameEn: 'Bodyguard', count: 1 }, { nameEn: 'Hunter', count: 1 }, { nameEn: 'Villager', count: 2 }, { nameEn: 'Werewolf', count: 2 }, { nameEn: 'Minion', count: 1 }],
  9: [{ nameEn: 'Seer', count: 1 }, { nameEn: 'Bodyguard', count: 1 }, { nameEn: 'Hunter', count: 1 }, { nameEn: 'Villager', count: 3 }, { nameEn: 'Werewolf', count: 2 }, { nameEn: 'Minion', count: 1 }],
  10: [{ nameEn: 'Seer', count: 1 }, { nameEn: 'Bodyguard', count: 1 }, { nameEn: 'Hunter', count: 1 }, { nameEn: 'Witch', count: 1 }, { nameEn: 'Villager', count: 3 }, { nameEn: 'Werewolf', count: 2 }, { nameEn: 'Minion', count: 1 }],
  11: [{ nameEn: 'Seer', count: 1 }, { nameEn: 'Bodyguard', count: 1 }, { nameEn: 'Hunter', count: 1 }, { nameEn: 'Witch', count: 1 }, { nameEn: 'Villager', count: 3 }, { nameEn: 'Werewolf', count: 2 }, { nameEn: 'Wolf Cub', count: 1 }, { nameEn: 'Minion', count: 1 }],
  12: [{ nameEn: 'Seer', count: 1 }, { nameEn: 'Bodyguard', count: 1 }, { nameEn: 'Hunter', count: 1 }, { nameEn: 'Witch', count: 1 }, { nameEn: 'Wizard', count: 1 }, { nameEn: 'Villager', count: 2 }, { nameEn: 'Werewolf', count: 2 }, { nameEn: 'Wolf Cub', count: 1 }, { nameEn: 'Minion', count: 1 }, { nameEn: 'Village Drunk', count: 1 }]
};

// Phase timers (in milliseconds)
const PHASE_DURATIONS = {
  night: 90000,      // 90 seconds
  day: 180000,       // 180 seconds (3 minutes)
  voting: 60000      // 60 seconds
};

// Auto phase timers
const phaseTimers = new Map();
const phaseCountdowns = new Map();

// Utility Functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function assignRoles(room) {
  const playerCount = room.players.length;
  const distribution = roleDistributions[playerCount];
  
  if (!distribution) return false;
  
  const rolePool = [];
  distribution.forEach(roleInfo => {
    const role = roles.find(r => r.nameEn === roleInfo.nameEn);
    for (let i = 0; i < roleInfo.count; i++) {
      rolePool.push(role);
    }
  });
  
  const shuffledRoles = shuffleArray(rolePool);
  
  room.players.forEach((player, index) => {
    player.role = shuffledRoles[index];
    player.isAlive = true;
    player.status = {
      silenced: false,
      sealed: false,
      prostituteBusy: false
    };
  });
  
  // Initialize witch potions
  room.witchState = {
    healUsed: false,
    poisonUsed: false
  };
  
  // Initialize wizard state
  room.wizardUsed = false;
  
  // Initialize bodyguard state
  room.lastProtected = null;
  
  // Initialize wolf cub state
  room.wolfCubKilled = false;
  
  return true;
}

function getRoomData(room, playerId = null) {
  return {
    id: room.id,
    name: room.name,
    host: room.host,
    hostNickname: room.hostNickname,
    maxPlayers: room.maxPlayers,
    hasPassword: !!room.password,
    playerCount: room.players.length,
    players: room.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      isReady: p.isReady,
      isAlive: p.isAlive,
      isHost: p.id === room.host,
      role: room.gameStarted ? p.role : null,
      status: p.status || {}
    })),
    status: room.status,
    gameStarted: room.gameStarted,
    phase: room.phase,
    dayNumber: room.dayNumber
  };
}

function getPlayerRole(room, playerId) {
  const player = room.players.find(p => p.id === playerId);
  if (!player || !player.role) return null;
  
  const roleData = {
    ...player.role,
    werewolves: []
  };
  
  if (player.role.abilities.includes('know_werewolves')) {
    roleData.werewolves = room.players
      .filter(p => p.role.team === 'werewolf' && p.id !== playerId && p.role.nameEn !== 'Minion')
      .map(p => ({ id: p.id, nickname: p.nickname }));
  }
  
  return roleData;
}

function broadcastToRoom(roomId, event, data) {
  io.to(roomId).emit(event, data);
}
function checkGameEnd(room) {
  const alivePlayers = room.players.filter(p => p.isAlive);
  const aliveWerewolves = alivePlayers.filter(p => p.role.team === 'werewolf').length;
  const aliveVillagers = alivePlayers.filter(p => p.role.team === 'villager').length;
  
  if (aliveWerewolves === 0) {
    return { ended: true, winner: 'villager', message: '🎉 ฝ่ายชาวบ้านชนะ!' };
  }
  
  if (aliveWerewolves >= aliveVillagers) {
    return { ended: true, winner: 'werewolf', message: '🐺 ฝ่ายหมาป่าชนะ!' };
  }
  
  return { ended: false };
}

function processNightActions(room) {
  let victims = [];
  let protected = [];
  const results = [];
  
  // Step 1: Prostitute blocks and protects
  const prostituteAction = Object.values(room.nightActions).find(action => action.action === 'distract');
  if (prostituteAction) {
    protected.push(prostituteAction.target);
    const target = room.players.find(p => p.id === prostituteAction.target);
    if (target) {
      target.status.prostituteBusy = true;
    }
  }
  
  // Step 2: Bodyguard protect
  const bodyguardAction = Object.values(room.nightActions).find(action => action.action === 'protect');
  if (bodyguardAction) {
    protected.push(bodyguardAction.target);
    room.lastProtected = bodyguardAction.target;
  }
  
  // Step 3: Werewolf kill
  const werewolfActions = Object.values(room.nightActions).filter(action => action.action === 'kill');
  if (werewolfActions.length > 0) {
    const votes = {};
    werewolfActions.forEach(action => {
      votes[action.target] = (votes[action.target] || 0) + 1;
    });
    
    let maxVotes = 0;
    Object.entries(votes).forEach(([playerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        victims = [playerId];
      }
    });
    
    // Wolf Cub effect: double kill
    if (room.wolfCubKilled && victims.length > 0) {
      // Allow second kill from werewolf actions
      const secondKillAction = Object.values(room.nightActions).find(action => action.action === 'kill_second');
      if (secondKillAction) {
        victims.push(secondKillAction.target);
      }
    }
  }
  
  // Step 4: Witch actions
  const witchHealAction = Object.values(room.nightActions).find(action => action.action === 'witch_heal');
  if (witchHealAction) {
    protected.push(witchHealAction.target);
    room.witchState.healUsed = true;
  }
  
  const witchPoisonAction = Object.values(room.nightActions).find(action => action.action === 'witch_poison');
  if (witchPoisonAction) {
    victims.push(witchPoisonAction.target);
    room.witchState.poisonUsed = true;
  }
  
  // Step 5: Seer investigate
  const seerAction = Object.values(room.nightActions).find(action => action.action === 'investigate');
  if (seerAction) {
    const target = room.players.find(p => p.id === seerAction.target);
    if (target) {
      results.push({
        type: 'investigate',
        actor: seerAction.actor,
        target: seerAction.target,
        isWerewolf: target.role.team === 'werewolf'
      });
    }
  }
  
  // Step 6: Mermaid silence
  const mermaidAction = Object.values(room.nightActions).find(action => action.action === 'silence');
  if (mermaidAction) {
    const target = room.players.find(p => p.id === mermaidAction.target);
    if (target) {
      target.status.silenced = true;
    }
  }
  
  // Step 7: Wizard seal (for next night)
  const wizardAction = Object.values(room.nightActions).find(action => action.action === 'seal');
  if (wizardAction) {
    const target = room.players.find(p => p.id === wizardAction.target);
    if (target) {
      // Seal will be applied next night
      room.sealedNextNight = wizardAction.target;
      room.wizardUsed = true;
    }
  }
  
  // Step 8: Process deaths
  const actualDeaths = victims.filter(victimId => !protected.includes(victimId));
  
  actualDeaths.forEach(victimId => {
    const victimPlayer = room.players.find(p => p.id === victimId);
    if (victimPlayer && victimPlayer.isAlive) {
      victimPlayer.isAlive = false;
      results.push({
        type: 'death',
        playerId: victimId,
        nickname: victimPlayer.nickname,
        role: victimPlayer.role
      });
    }
  });
  
  // Check for protection
  if (victims.some(v => protected.includes(v))) {
    results.push({ type: 'protected' });
  }
  
  // Clear night actions
  room.nightActions = {};
  
  return results;
}

function startPhaseTimer(roomId, phase, duration) {
  clearPhaseTimer(roomId);
  
  const endTime = Date.now() + duration;
  
  // Start countdown interval
  const countdownInterval = setInterval(() => {
    const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    broadcastToRoom(roomId, 'timerUpdate', { remaining, phase });
    
    // เมื่อเฟสกลางวันผ่านไปครึ่งหนึ่ง ให้เข้าเฟสโหวต
    const room = rooms.get(roomId);
    if (phase === 'day' && remaining === Math.floor(duration/2000) && room) {
      room.phase = 'voting';
      room.votes = {};
      broadcastToRoom(roomId, 'phaseChange', {
        phase: 'voting',
        dayNumber: room.dayNumber,
        duration: PHASE_DURATIONS.voting / 1000
      });
      
      // เริ่ม timer ใหม่สำหรับเฟสโหวต
      clearPhaseTimer(roomId);
      startPhaseTimer(roomId, 'voting', PHASE_DURATIONS.voting);
      return; // ออกจาก interval เดิม
    }
    
    if (remaining <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);
  
  phaseCountdowns.set(roomId, countdownInterval);
  
  // Main phase timer
  const timer = setTimeout(() => {
    const room = rooms.get(roomId);
    if (!room) return;
    
    if (phase === 'night') {
      endNightPhase(roomId);
    } else if (phase === 'day') {
      endDayPhase(roomId);
    } else if (phase === 'voting') {
      endVotingPhase(roomId);
    }
  }, duration);
  
  phaseTimers.set(roomId, timer);
}

function endNightPhase(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.phase !== 'night') return;
  
  const results = processNightActions(room);
  
  // Send results to players
  results.forEach(result => {
    if (result.type === 'investigate') {
      io.to(result.actor).emit('investigateResult', {
        target: result.target,
        isWerewolf: result.isWerewolf
      });
    } else if (result.type === 'death') {
      broadcastToRoom(roomId, 'playerDied', {
        playerId: result.playerId,
        nickname: result.nickname,
        role: result.role
      });
      
      // Check for Hunter revenge
      if (result.role.nameEn === 'Hunter') {
        room.hunterRevenge = result.playerId;
      }
    } else if (result.type === 'protected') {
      broadcastToRoom(roomId, 'playerProtected');
    }
  });
  
  // Apply sealed status for next night
  if (room.sealedNextNight) {
    const target = room.players.find(p => p.id === room.sealedNextNight);
    if (target) {
      target.status.sealed = true;
    }
    room.sealedNextNight = null;
  }
  
  // Check game end
  const gameEnd = checkGameEnd(room);
  if (gameEnd.ended) {
    room.phase = 'ended';
    broadcastToRoom(roomId, 'gameEnded', gameEnd);
    clearPhaseTimer(roomId);
    return;
  }
  
  // Move to day phase
  room.phase = 'day';
  broadcastToRoom(roomId, 'phaseChange', {
    phase: 'day',
    dayNumber: room.dayNumber,
    duration: PHASE_DURATIONS.day / 1000
  });
  broadcastToRoom(roomId, 'roomUpdate', getRoomData(room));
  
  startPhaseTimer(roomId, 'day', PHASE_DURATIONS.day);
}

function endDayPhase(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.phase !== 'day') return;
  // At the end of the day, process voting and eliminate the player with the most votes
  processVoting(room, roomId);
}

function endVotingPhase(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.phase !== 'voting') return;
  
  processVoting(room, roomId);
}

function processVoting(room, roomId) {
  let maxVotes = 0;
  let votedOut = null;
  const alivePlayers = room.players.filter(p => p.isAlive);
  const totalAlive = alivePlayers.length;
  let totalVotes = 0;
  Object.entries(room.votes).forEach(([playerId, voters]) => {
    totalVotes += voters.length;
    if (voters.length > maxVotes) {
      maxVotes = voters.length;
      votedOut = playerId;
    }
  });
  // Require more than half of alive players to vote for voting to be valid
  if (totalVotes <= totalAlive / 2) {
    broadcastToRoom(roomId, 'voteVoid', {
      message: 'ไม่มีเสียงข้างมาก การโหวตเป็นโมฆะ ไม่มีใครถูกโหวตออก'
    });
  } else if (votedOut) {
    const votedPlayer = room.players.find(p => p.id === votedOut);
    if (votedPlayer) {
      votedPlayer.isAlive = false;
      broadcastToRoom(roomId, 'playerVotedOut', {
        playerId: votedOut,
        nickname: votedPlayer.nickname,
        role: votedPlayer.role,
        votes: maxVotes
      });
      // Check for Wolf Cub
      if (votedPlayer.role.nameEn === 'Wolf Cub') {
        room.wolfCubKilled = true;
        broadcastToRoom(roomId, 'wolfCubKilled', {
          message: 'ลูกหมาป่าถูกฆ่า! หมาป่าจะฆ่าได้ 2 คนในคืนถัดไป'
        });
      }
      // Check for Village Drunk win
      if (votedPlayer.role.nameEn === 'Village Drunk') {
        room.phase = 'ended';
        broadcastToRoom(roomId, 'gameEnded', {
          ended: true,
          winner: 'neutral',
          message: '🍺 ป้าขี้เมาชนะ! ถูกโหวตออกตามเป้าหมาย'
        });
        clearPhaseTimer(roomId);
        return;
      }
      // Check for Hunter revenge
      if (votedPlayer.role.nameEn === 'Hunter') {
        room.hunterRevenge = votedOut;
        broadcastToRoom(roomId, 'hunterRevenge', {
          hunterId: votedOut,
          message: 'นายพรานสามารถเลือกยิงคนหนึ่งก่อนตาย'
        });
        // Wait for hunter action before continuing
        return;
      }
    }
  }
  // Check game end
  const gameEnd = checkGameEnd(room);
  if (gameEnd.ended) {
    room.phase = 'ended';
    broadcastToRoom(roomId, 'gameEnded', gameEnd);
    clearPhaseTimer(roomId);
    return;
  }
  // Clear statuses
  room.players.forEach(p => {
    p.status.silenced = false;
    p.status.prostituteBusy = false;
    p.status.sealed = false;
  });
  // Move to next night
  room.dayNumber++;
  room.phase = 'night';
  room.votes = {};
  broadcastToRoom(roomId, 'phaseChange', {
    phase: 'night',
    dayNumber: room.dayNumber,
    duration: PHASE_DURATIONS.night / 1000
  });
  broadcastToRoom(roomId, 'roomUpdate', getRoomData(room));
  startPhaseTimer(roomId, 'night', PHASE_DURATIONS.night);
}

function clearPhaseTimer(roomId) {
  if (phaseTimers.has(roomId)) {
    clearTimeout(phaseTimers.get(roomId));
    phaseTimers.delete(roomId);
  }
  
  if (phaseCountdowns.has(roomId)) {
    clearInterval(phaseCountdowns.get(roomId));
    phaseCountdowns.delete(roomId);
  }
}

// Socket.io Event Handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('setNickname', (nickname, callback) => {
    players.set(socket.id, {
      id: socket.id,
      nickname: nickname,
      roomId: null
    });
    callback({ success: true });
  });
  
  socket.on('getRooms', (callback) => {
    const roomsList = Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      hostNickname: room.hostNickname,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      hasPassword: !!room.password,
      gameStarted: room.gameStarted,
      status: room.status
    }));
    callback(roomsList);
  });
  
  socket.on('createRoom', ({ name, maxPlayers, password }, callback) => {
    const player = players.get(socket.id);
    if (!player) {
      return callback({ success: false, error: 'กรุณาตั้งชื่อเล่นก่อน' });
    }
    
    const roomId = generateId();
    const room = {
      id: roomId,
      name: name,
      host: socket.id,
      hostNickname: player.nickname,
      maxPlayers: maxPlayers,
      password: password,
      players: [{
        id: socket.id,
        nickname: player.nickname,
        isReady: true,
        role: null,
        isAlive: true,
        status: {}
      }],
      status: 'waiting',
      gameStarted: false,
      phase: 'lobby',
      dayNumber: 0,
      nightActions: {},
      votes: {},
      gameLog: [],
      witchState: { healUsed: false, poisonUsed: false },
      wizardUsed: false,
      lastProtected: null,
      wolfCubKilled: false,
      sealedNextNight: null,
      hunterRevenge: null
    };
    
    rooms.set(roomId, room);
    player.roomId = roomId;
    
    socket.join(roomId);
    
    callback({ success: true, room: getRoomData(room) });
    io.emit('roomsUpdate');
  });
  
  socket.on('joinRoom', ({ roomId, password }, callback) => {
    const player = players.get(socket.id);
    const room = rooms.get(roomId);
    
    if (!player) {
      return callback({ success: false, error: 'กรุณาตั้งชื่อเล่นก่อน' });
    }
    
    if (!room) {
      return callback({ success: false, error: 'ไม่พบห้องนี้' });
    }
    
    if (room.gameStarted) {
      return callback({ success: false, error: 'เกมเริ่มแล้ว' });
    }
    
    if (room.players.length >= room.maxPlayers) {
      return callback({ success: false, error: 'ห้องเต็มแล้ว' });
    }
    
    if (room.password && room.password !== password) {
      return callback({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' });
    }
    
    room.players.push({
      id: socket.id,
      nickname: player.nickname,
      isReady: false,
      role: null,
      isAlive: true,
      status: {}
    });
    
    player.roomId = roomId;
    socket.join(roomId);
    
    callback({ success: true, room: getRoomData(room) });
    broadcastToRoom(roomId, 'roomUpdate', getRoomData(room));
    broadcastToRoom(roomId, 'playerJoined', { nickname: player.nickname });
    io.emit('roomsUpdate');
  });
  
  socket.on('leaveRoom', (callback) => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      return callback({ success: false });
    }
    
    const room = rooms.get(player.roomId);
    if (!room) {
      return callback({ success: false });
    }
    
    clearPhaseTimer(player.roomId);
    
    if (room.host === socket.id) {
      rooms.delete(player.roomId);
      broadcastToRoom(player.roomId, 'roomClosed');
      io.in(player.roomId).socketsLeave(player.roomId);
    } else {
      room.players = room.players.filter(p => p.id !== socket.id);
      broadcastToRoom(player.roomId, 'roomUpdate', getRoomData(room));
      broadcastToRoom(player.roomId, 'playerLeft', { nickname: player.nickname });
      socket.leave(player.roomId);
    }
    
    player.roomId = null;
    callback({ success: true });
    io.emit('roomsUpdate');
  });
  
  socket.on('toggleReady', (callback) => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      return callback({ success: false });
    }
    
    const room = rooms.get(player.roomId);
    if (!room) {
      return callback({ success: false });
    }
    
    const roomPlayer = room.players.find(p => p.id === socket.id);
    if (roomPlayer && roomPlayer.id !== room.host) {
      roomPlayer.isReady = !roomPlayer.isReady;
      callback({ success: true, isReady: roomPlayer.isReady });
      broadcastToRoom(player.roomId, 'roomUpdate', getRoomData(room));
    } else {
      callback({ success: false });
    }
  });
  
  socket.on('startGame', (callback) => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      return callback({ success: false, error: 'ไม่พบห้อง' });
    }
    
    const room = rooms.get(player.roomId);
    if (!room || room.host !== socket.id) {
      return callback({ success: false, error: 'คุณไม่ใช่เจ้าของห้อง' });
    }
    
    if (room.players.length < 5) {
      return callback({ success: false, error: 'ต้องมีผู้เล่นอย่างน้อย 5 คน' });
    }
    
    const allReady = room.players.every(p => p.isReady);
    if (!allReady) {
      return callback({ success: false, error: 'ผู้เล่นยังไม่พร้อมครบ' });
    }
    
    if (!assignRoles(room)) {
      return callback({ success: false, error: 'ไม่สามารถแจกบทบาทได้' });
    }
    
    room.gameStarted = true;
    room.phase = 'day';
    room.dayNumber = 1;
    room.status = 'playing';

    room.players.forEach(p => {
      io.to(p.id).emit('roleAssigned', getPlayerRole(room, p.id));
    });

    callback({ success: true });
    broadcastToRoom(player.roomId, 'gameStarted', {
      room: getRoomData(room),
      duration: PHASE_DURATIONS.day / 1000 // เริ่มที่กลางวัน
    });

    setTimeout(() => {
      broadcastToRoom(player.roomId, 'phaseChange', {
        phase: 'day',
        dayNumber: room.dayNumber,
        duration: PHASE_DURATIONS.day / 1000
      });
      startPhaseTimer(player.roomId, 'day', PHASE_DURATIONS.day);
    }, 5000);

    io.emit('roomsUpdate');
  });
  
  socket.on('nightAction', ({ target, action }, callback) => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      return callback({ success: false });
    }
    
    const room = rooms.get(player.roomId);
    if (!room || room.phase !== 'night') {
      return callback({ success: false });
    }
    
    const roomPlayer = room.players.find(p => p.id === socket.id);
    if (!roomPlayer || !roomPlayer.isAlive || !roomPlayer.role) {
      return callback({ success: false });
    }
    
    // Check if player is sealed
    if (roomPlayer.status.sealed) {
      return callback({ success: false, error: 'คุณถูกปิดผนึก ไม่สามารถใช้ความสามารถได้' });
    }
    
    // Check if player is busy with prostitute
    if (roomPlayer.status.prostituteBusy) {
      return callback({ success: false, error: 'คุณไม่ว่างในคืนนี้' });
    }
    
    const actionType = action || determineActionType(roomPlayer.role);
    
    // Store action
    if (!room.nightActions[socket.id]) {
      room.nightActions[socket.id] = {
        actor: socket.id,
        action: actionType,
        target: target
      };
    }
    
    callback({ success: true });
  });
  
  socket.on('witchAction', ({ action, target }, callback) => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      return callback({ success: false });
    }
    
    const room = rooms.get(player.roomId);
    if (!room || room.phase !== 'night') {
      return callback({ success: false });
    }
    
    const roomPlayer = room.players.find(p => p.id === socket.id);
    if (!roomPlayer || !roomPlayer.isAlive || roomPlayer.role.nameEn !== 'Witch') {
      return callback({ success: false });
    }
    
    if (action === 'heal' && room.witchState.healUsed) {
      return callback({ success: false, error: 'ใช้ยาชุบชีวิตไปแล้ว' });
    }
    
    if (action === 'poison' && room.witchState.poisonUsed) {
      return callback({ success: false, error: 'ใช้ยาพิษไปแล้ว' });
    }
    
    room.nightActions[socket.id] = {
      actor: socket.id,
      action: action === 'heal' ? 'witch_heal' : 'witch_poison',
      target: target
    };
    
    callback({ success: true });
  });
  
  socket.on('hunterRevenge', ({ target }, callback) => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      return callback({ success: false });
    }
    
    const room = rooms.get(player.roomId);
    if (!room || room.hunterRevenge !== socket.id) {
      return callback({ success: false });
    }
    
    const targetPlayer = room.players.find(p => p.id === target);
    if (!targetPlayer || !targetPlayer.isAlive) {
      return callback({ success: false });
    }
    
    targetPlayer.isAlive = false;
    room.hunterRevenge = null;
    
    broadcastToRoom(player.roomId, 'hunterKilled', {
      playerId: target,
      nickname: targetPlayer.nickname,
      role: targetPlayer.role
    });
    
    callback({ success: true });
    
    // Continue game after hunter revenge
    setTimeout(() => {
      const gameEnd = checkGameEnd(room);
      if (gameEnd.ended) {
        room.phase = 'ended';
        broadcastToRoom(player.roomId, 'gameEnded', gameEnd);
        clearPhaseTimer(player.roomId);
      } else {
        // Continue to next phase based on when hunter died
        if (room.phase === 'voting') {
          // Clear statuses and move to night
          room.players.forEach(p => {
            p.status.silenced = false;
            p.status.prostituteBusy = false;
            p.status.sealed = false;
          });
          
          room.dayNumber++;
          room.phase = 'night';
          room.votes = {};
          
          broadcastToRoom(player.roomId, 'phaseChange', {
            phase: 'night',
            dayNumber: room.dayNumber,
            duration: PHASE_DURATIONS.night / 1000
          });
          broadcastToRoom(player.roomId, 'roomUpdate', getRoomData(room));
          startPhaseTimer(player.roomId, 'night', PHASE_DURATIONS.night);
        }
      }
    }, 2000);
  });
  
  socket.on('vote', ({ target }, callback) => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) {
      return callback({ success: false });
    }
    
    const room = rooms.get(player.roomId);
    if (!room || room.phase !== 'voting') { // แก้จาก 'day' เป็น 'voting'
      return callback({ success: false, error: 'ยังไม่ถึงเวลาโหวต' });
    }
    
    const roomPlayer = room.players.find(p => p.id === socket.id);
    if (!roomPlayer || !roomPlayer.isAlive) {
      return callback({ success: false });
    }
    
    // Check if already voted
    const alreadyVoted = Object.values(room.votes).some(voters => voters.includes(socket.id));
    if (alreadyVoted) {
      return callback({ success: false, error: 'คุณโหวตไปแล้ว' });
    }
    
    // Check if target is alive
    const targetPlayer = room.players.find(p => p.id === target);
    if (!targetPlayer || !targetPlayer.isAlive) {
      return callback({ success: false, error: 'ไม่สามารถโหวตผู้เล่นนี้ได้' });
    }
    
    if (!room.votes[target]) {
      room.votes[target] = [];
    }
    room.votes[target].push(socket.id);
    
    callback({ success: true });
    broadcastToRoom(player.roomId, 'voteUpdate', {
      votes: room.votes,
      totalVoted: Object.values(room.votes).flat().length,
      totalPlayers: room.players.filter(p => p.isAlive).length
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const player = players.get(socket.id);
    if (player && player.roomId) {
      const room = rooms.get(player.roomId);
      if (room) {
        clearPhaseTimer(player.roomId);
        
        if (room.host === socket.id) {
          rooms.delete(player.roomId);
          broadcastToRoom(player.roomId, 'roomClosed');
        } else {
          room.players = room.players.filter(p => p.id !== socket.id);
          broadcastToRoom(player.roomId, 'roomUpdate', getRoomData(room));
          broadcastToRoom(player.roomId, 'playerLeft', { nickname: player.nickname });
        }
        io.emit('roomsUpdate');
      }
    }
    
    players.delete(socket.id);
  });
});

function determineActionType(role) {
  if (role.abilities.includes('kill')) return 'kill';
  if (role.abilities.includes('investigate')) return 'investigate';
  if (role.abilities.includes('protect')) return 'protect';
  if (role.abilities.includes('block_and_protect')) return 'distract';
  if (role.abilities.includes('silence')) return 'silence';
  if (role.abilities.includes('seal')) return 'seal';
  return 'none';
}

app.get('/', (req, res) => {
  res.json({ 
    message: 'Werewolf Game Server',
    rooms: rooms.size,
    players: players.size,
    phaseDurations: {
      night: PHASE_DURATIONS.night / 1000 + 's',
      day: PHASE_DURATIONS.day / 1000 + 's',
      voting: PHASE_DURATIONS.voting / 1000 + 's'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🐺 Werewolf Game Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready for connections`);
  console.log(`⏱️  Phase Durations:`);
  console.log(`   - Night: ${PHASE_DURATIONS.night / 1000}s`);
  console.log(`   - Day: ${PHASE_DURATIONS.day / 1000}s`);
  console.log(`   - Voting: ${PHASE_DURATIONS.voting / 1000}s`);
});

