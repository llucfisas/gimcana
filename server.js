const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gimcana2026';

// ============================================================
//  🔑 CONTRASENYES PER EQUIP
// ============================================================
const TEAM_PASSWORDS = {
  1: '496', 2: '589', 3: '550', 4: '560', 5: '544',
  6: '605', 7: '529', 8: '494', 9: '567', 10: '594'
};

// ============================================================
//  🏷️ NOMS DELS EQUIPS
// ============================================================
const TEAM_NAMES = {
  1: 'Deboraste', 2: 'Maduritos', 3: 'Ibai Calavera', 4: 'Xungus', 5: 'Rufián Quiller',
  6: 'C. Kirk', 7: 'Perro Sanxe', 8: 'Mac Mec Mic', 9: 'Sneaky Golem', 10: 'Lopes <3 Flams'
};

// ============================================================
//  📋 CONFIGURACIÓ DE PROVES
//  ⚠️ L'enunciat (question) NO es mostra als participants,
//     només serveix de referència per l'admin.
//     Els participants troben l'enunciat físicament al lloc.
// ============================================================
const DEFAULT_CHALLENGES = {
  a: {
    name: 'Prova A — Binari',
    question: 'Descodificar de base 2 a base 10: 01001100, 101110, 01010101',
    answers: ['76 46 85', '76, 46, 85', '76,46,85', '76-46-85'],
    hint: ''
  },
  b: {
    name: 'Prova B — Pseudocodi',
    question: 'Quin número surt del codi pseudopython (n,i=0,0; while i<10: if i>2*n: n+=1; i+=1; print(n^3))',
    answers: ['125'],
    hint: ''
  },
  c: {
    name: 'Prova C — Matrius',
    question: 'Calcular -det de la matriu 2x2 [[13,10],[5,9]] i det de la 3x3 [[6,3,2],[4,5,1],[1,2,4]]',
    answers: ['67 69', '67, 69', '67,69', '67 i 69', '67-69'],
    hint: ''
  },
  d: {
    name: 'Prova D — Xifrat Cèsar',
    question: 'Decodificació Cèsar del missatge KNAJAPW amb clau 4',
    answers: ['oreneta', 'ORENETA'],
    hint: ''
  },
  e: {
    name: 'Prova E — Complexitat',
    question: 'Quina és la complexitat respecte a b de la funció recursiva potencia(a,b)?',
    answers: ['o(b)', 'O(b)', 'o(n)', 'O(n)'],
    hint: ''
  },
  f: {
    name: 'Prova F — Xarxes',
    question: 'Quantes adreces IP tens amb una màscara /26?',
    answers: ['62'],
    hint: ''
  },
  g: {
    name: 'Prova G — Probabilitat',
    question: '2 daus: primer parell, segon imparell. Probabilitat que la suma sigui 7?',
    answers: ['1/3', '0.33', '0,33', '33%'],
    hint: ''
  },
  h: {
    name: 'Prova H — Linux',
    question: 'Comanda de Linux per executar ordres amb permisos d\'administrador sense ser-ho',
    answers: ['sudo'],
    hint: ''
  },
  i: {
    name: 'Prova FINAL — Circuits',
    question: 'Calcular Rtotal dels dos circuits (sèrie i paral·lel). Escriure en fraccions si escau.',
    answers: ['14 20/3', '14, 20/3', '14,20/3', '14 i 20/3', '14-20/3'],
    hint: ''
  }
};

// ============================================================
//  🗺️ CAMINS DELS 10 EQUIPS (tots acaben amb 'i')
// ============================================================
const TEAM_PATHS = {
  1:  ['d', 'f', 'a', 'h', 'c', 'e', 'b', 'g', 'i'],
  2:  ['b', 'g', 'e', 'a', 'f', 'c', 'h', 'd', 'i'],
  3:  ['h', 'c', 'f', 'd', 'g', 'a', 'e', 'b', 'i'],
  4:  ['e', 'a', 'g', 'c', 'b', 'h', 'd', 'f', 'i'],
  5:  ['f', 'd', 'b', 'g', 'a', 'h', 'c', 'e', 'i'],
  6:  ['c', 'h', 'd', 'e', 'b', 'f', 'g', 'a', 'i'],
  7:  ['g', 'b', 'h', 'f', 'd', 'a', 'e', 'c', 'i'],
  8:  ['a', 'e', 'c', 'b', 'h', 'g', 'f', 'd', 'i'],
  9:  ['h', 'f', 'g', 'd', 'e', 'b', 'a', 'c', 'i'],
  10: ['g', 'a', 'd', 'h', 'f', 'c', 'b', 'e', 'i']
};

// ============================================================
//  STATE MANAGEMENT
// ============================================================
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'game-state.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const PHOTOS_DIR = path.join(__dirname, 'public', 'photos');
if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });

function normalizeAnswer(str) {
  return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function createFreshState() {
  const teams = {};
  for (let i = 1; i <= 10; i++) {
    teams[i] = {
      currentStep: 0,
      completedChallenges: [],
      completionTimes: [],
      finishedAt: null,
      wrongAttempts: 0,
      lastWrongAt: null
    };
  }
  return { started: false, startTime: null, teams };
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading state:', e);
  }
  return createFreshState();
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(gameState, null, 2));
  } catch (e) {
    console.error('Error saving state:', e);
  }
}

function loadConfig() {
  // Always start from code-defined challenges to avoid stale config.json
  const fresh = JSON.parse(JSON.stringify(DEFAULT_CHALLENGES));
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(fresh, null, 2));
  } catch (e) {
    console.error('Error writing config:', e);
  }
  return fresh;
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(challenges, null, 2));
  } catch (e) {
    console.error('Error saving config:', e);
  }
}

let gameState = loadState();
let challenges = loadConfig();

// ============================================================
//  RANKING CALCULATION
// ============================================================
function getRanking() {
  const ranking = [];
  for (let i = 1; i <= 10; i++) {
    const team = gameState.teams[i];
    const path = TEAM_PATHS[i];
    ranking.push({
      teamId: i,
      teamName: TEAM_NAMES[i],
      completedCount: team.completedChallenges.length,
      totalChallenges: 9,
      currentChallenge: team.currentStep < 9 ? path[team.currentStep] : null,
      finished: team.finishedAt !== null,
      finishedAt: team.finishedAt,
      elapsedMs: team.finishedAt
        ? team.finishedAt - gameState.startTime
        : gameState.startTime
          ? Date.now() - gameState.startTime
          : 0,
      wrongAttempts: team.wrongAttempts,
      path: path,
      completedChallenges: team.completedChallenges
    });
  }

  ranking.sort((a, b) => {
    if (a.finished && !b.finished) return -1;
    if (!a.finished && b.finished) return 1;
    if (a.finished && b.finished) return a.finishedAt - b.finishedAt;
    return b.completedCount - a.completedCount;
  });

  return ranking;
}

// ============================================================
//  EXPRESS SETUP
// ============================================================
app.use(express.json());
app.use(express.static('public'));

// Prevent browser caching on API routes
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Photo upload config
const storage = multer.diskStorage({
  destination: PHOTOS_DIR,
  filename: (req, file, cb) => {
    const challengeId = req.params.challengeId;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, challengeId + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ============================================================
//  API ROUTES
// ============================================================

// Team authentication
app.post('/api/team/auth', (req, res) => {
  const { teamId, password } = req.body;
  const id = parseInt(teamId);
  if (id < 1 || id > 10) return res.status(400).json({ error: 'Equip invàlid' });
  
  const normalizedInput = password?.toLowerCase().trim() || '';
  const normalizedPass = (TEAM_PASSWORDS[id] || '').toLowerCase().trim();
  
  if (normalizedInput === normalizedPass) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Contrasenya incorrecta' });
  }
});

// Get team state (NO question/hint sent — they find it at the location)
app.get('/api/team/:teamId', (req, res) => {
  const teamId = parseInt(req.params.teamId);
  if (teamId < 1 || teamId > 10) return res.status(400).json({ error: 'Equip invàlid' });

  const team = gameState.teams[teamId];
  const teamPath = TEAM_PATHS[teamId];
  const currentChallengeId = team.currentStep < 9 ? teamPath[team.currentStep] : null;
  const currentChallenge = currentChallengeId ? challenges[currentChallengeId] : null;

  // Check if a photo exists for current challenge
  let photoUrl = null;
  if (currentChallengeId) {
    const possibleExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    for (const ext of possibleExts) {
      if (fs.existsSync(path.join(PHOTOS_DIR, currentChallengeId + ext))) {
        photoUrl = `/photos/${currentChallengeId}${ext}`;
        break;
      }
    }
  }

  res.json({
    started: gameState.started,
    startTime: gameState.startTime,
    teamId,
    teamName: TEAM_NAMES[teamId],
    currentStep: team.currentStep,
    totalSteps: 9,
    currentChallengeId,
    challengeName: currentChallenge?.name || null,
    photoUrl,
    finished: team.finishedAt !== null,
    finishedAt: team.finishedAt,
    completedChallenges: team.completedChallenges,
    path: teamPath,
    wrongAttempts: team.wrongAttempts,
    lastWrongAt: team.lastWrongAt
  });
});

// Get all team names
app.get('/api/teams', (req, res) => {
  res.json({ teams: TEAM_NAMES });
});

// Submit answer
app.post('/api/answer', (req, res) => {
  const { teamId, answer } = req.body;
  if (!gameState.started) return res.status(400).json({ error: 'La gimcana encara no ha començat!' });

  const team = gameState.teams[teamId];
  if (team.finishedAt) return res.json({ correct: true, finished: true, message: 'Ja heu acabat!' });

  // Cooldown check (30 seconds after wrong answer)
  const COOLDOWN_MS = 30 * 1000;
  if (team.lastWrongAt && (Date.now() - team.lastWrongAt) < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - team.lastWrongAt)) / 1000);
    return res.json({ correct: false, cooldown: true, remainingSeconds: remaining, message: `Heu d'esperar ${remaining}s abans de tornar a intentar-ho.` });
  }

  const teamPath = TEAM_PATHS[teamId];
  const currentChallengeId = teamPath[team.currentStep];
  const challenge = challenges[currentChallengeId];

  const normalizedInput = normalizeAnswer(answer);
  const isCorrect = challenge.answers.some(a => normalizeAnswer(a) === normalizedInput);

  if (isCorrect) {
    team.completedChallenges.push(currentChallengeId);
    team.completionTimes.push(Date.now());
    team.currentStep++;
    team.lastWrongAt = null;

    if (team.currentStep >= 9) {
      team.finishedAt = Date.now();
    }

    saveState();
    io.emit('state-update', { ranking: getRanking(), gameState: { started: gameState.started, startTime: gameState.startTime } });

    // Find next photo URL
    let nextPhotoUrl = null;
    if (team.currentStep < 9) {
      const nextChallengeId = teamPath[team.currentStep];
      const possibleExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      for (const ext of possibleExts) {
        if (fs.existsSync(path.join(PHOTOS_DIR, nextChallengeId + ext))) {
          nextPhotoUrl = `/photos/${nextChallengeId}${ext}`;
          break;
        }
      }
    }

    return res.json({
      correct: true,
      finished: team.currentStep >= 9,
      nextStep: team.currentStep,
      nextChallengeId: team.currentStep < 9 ? teamPath[team.currentStep] : null,
      nextPhotoUrl,
      message: team.currentStep >= 9
        ? '🎉 HEU COMPLETAT LA GIMCANA!'
        : '✅ Correcte! Aneu a la següent localització!'
    });
  } else {
    team.wrongAttempts++;
    team.lastWrongAt = Date.now();
    saveState();
    return res.json({
      correct: false,
      cooldown: true,
      remainingSeconds: 30,
      message: 'Resposta incorrecta! Heu d\'esperar 30 segons.'
    });
  }
});

// ============================================================
//  ADMIN ROUTES
// ============================================================

// Admin auth
app.post('/api/admin/auth', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Contrasenya incorrecta' });
  }
});

// Get full state (admin)
app.get('/api/admin/state', (req, res) => {
  res.json({
    gameState: { started: gameState.started, startTime: gameState.startTime },
    ranking: getRanking(),
    challenges,
    teamPaths: TEAM_PATHS,
    teamNames: TEAM_NAMES
  });
});

// Start game
app.post('/api/admin/start', (req, res) => {
  if (gameState.started) return res.status(400).json({ error: 'La gimcana ja ha començat!' });
  gameState.started = true;
  gameState.startTime = Date.now();
  saveState();
  io.emit('game-started', { startTime: gameState.startTime });
  io.emit('state-update', { ranking: getRanking(), gameState: { started: gameState.started, startTime: gameState.startTime } });
  res.json({ success: true, startTime: gameState.startTime });
});

// Reset game
app.post('/api/admin/reset', (req, res) => {
  gameState = createFreshState();
  saveState();
  io.emit('game-reset');
  io.emit('state-update', { ranking: getRanking(), gameState: { started: gameState.started, startTime: gameState.startTime } });
  res.json({ success: true });
});

// Update challenge (question/answers)
app.put('/api/admin/challenge/:challengeId', (req, res) => {
  const { challengeId } = req.params;
  if (!challenges[challengeId]) return res.status(404).json({ error: 'Prova no trobada' });

  const { question, answers, hint, name } = req.body;
  if (question) challenges[challengeId].question = question;
  if (answers) challenges[challengeId].answers = answers;
  if (hint !== undefined) challenges[challengeId].hint = hint;
  if (name) challenges[challengeId].name = name;
  saveConfig();

  res.json({ success: true, challenge: challenges[challengeId] });
});

// Upload photo for challenge
app.post('/api/admin/photo/:challengeId', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No s\'ha pujat cap foto' });
  const challengeId = req.params.challengeId;

  // Remove old photos with different extensions
  const possibleExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  for (const ext of possibleExts) {
    const oldPath = path.join(PHOTOS_DIR, challengeId + ext);
    if (oldPath !== req.file.path && fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  res.json({ success: true, photoUrl: `/photos/${req.file.filename}` });
});

// Get ranking
app.get('/api/ranking', (req, res) => {
  res.json({ ranking: getRanking(), started: gameState.started, startTime: gameState.startTime });
});

// ============================================================
//  SOCKET.IO
// ============================================================
io.on('connection', (socket) => {
  socket.emit('state-update', {
    ranking: getRanking(),
    gameState: { started: gameState.started, startTime: gameState.startTime }
  });
});

// ============================================================
//  START SERVER
// ============================================================
server.listen(PORT, () => {
  console.log(`\n🎮 Gimcana server running on port ${PORT}`);
  console.log(`   👥 Participants: http://localhost:${PORT}`);
  console.log(`   🔧 Admin panel:  http://localhost:${PORT}/admin.html`);
  console.log(`   🏆 Ranking:      http://localhost:${PORT}/ranking.html`);
  console.log(`   🔑 Admin pass:   ${ADMIN_PASSWORD}\n`);
});
