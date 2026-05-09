const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const screens = {
  start: document.getElementById("startScreen"),
  tutorial: document.getElementById("tutorialScreen"),
  level: document.getElementById("levelScreen"),
  result: document.getElementById("resultScreen"),
  gameOver: document.getElementById("gameOverScreen"),
  pause: document.getElementById("pauseScreen"),
};

const ui = {
  clearOverlay: document.getElementById("clearOverlay"),
  clearText: document.getElementById("clearText"),
  pulseButton: document.getElementById("pulseButton"),
  soundButton: document.getElementById("soundButton"),
  pauseButton: document.getElementById("pauseButton"),
  tutorialButton: document.getElementById("tutorialButton"),
  tutorialBackButton: document.getElementById("tutorialBackButton"),
  resumeButton: document.getElementById("resumeButton"),
  restartButton: document.getElementById("restartButton"),
  levelKicker: document.getElementById("levelKicker"),
  levelTitle: document.getElementById("levelTitle"),
  levelBrief: document.getElementById("levelBrief"),
  briefGoal: document.getElementById("briefGoal"),
  briefThreat: document.getElementById("briefThreat"),
  resultTitle: document.getElementById("resultTitle"),
  resultRank: document.getElementById("resultRank"),
  resultScore: document.getElementById("resultScore"),
  resultCombo: document.getElementById("resultCombo"),
  resultLives: document.getElementById("resultLives"),
  resultTime: document.getElementById("resultTime"),
  resultComment: document.getElementById("resultComment"),
  nextButton: document.getElementById("nextButton"),
};

const hud = {
  root: document.getElementById("hud"),
  level: document.getElementById("hudLevel"),
  score: document.getElementById("hudScore"),
  goal: document.getElementById("hudGoal"),
  lives: document.getElementById("hudLives"),
  maxLives: document.getElementById("hudMaxLives"),
  points: document.getElementById("hudPoints"),
  combo: document.getElementById("hudCombo"),
  energy: document.getElementById("hudEnergy"),
  energyFill: document.getElementById("energyFill"),
  time: document.getElementById("hudTime"),
};

const levels = [
  {
    name: "晨星航道",
    brief: "收集星核，穿过第一道巡航网。",
    goal: 8,
    timeLimit: 48,
    speed: 225,
    hazardRate: 1.05,
    mineRate: 0.12,
    gateRate: 0,
    coreRate: 0.9,
    shardRate: 0.36,
    powerRate: 0.16,
    colors: ["#59d6ff", "#ffcf5a", "#8dff8a"],
    threat: "低",
  },
  {
    name: "赤环裂谷",
    brief: "裂谷会抛出高速碎片，保持连击才能拿到高评分。",
    goal: 10,
    timeLimit: 52,
    speed: 285,
    hazardRate: 1.3,
    mineRate: 0.22,
    gateRate: 0.08,
    coreRate: 0.8,
    shardRate: 0.44,
    powerRate: 0.18,
    colors: ["#ff4e80", "#ffcf5a", "#59d6ff"],
    threat: "中",
  },
  {
    name: "冰蓝环带",
    brief: "激光门开始封锁跑道，找准缺口快速穿越。",
    goal: 12,
    timeLimit: 55,
    speed: 320,
    hazardRate: 1.45,
    mineRate: 0.32,
    gateRate: 0.16,
    coreRate: 0.74,
    shardRate: 0.5,
    powerRate: 0.2,
    colors: ["#c88dff", "#59d6ff", "#8dff8a"],
    threat: "中高",
  },
  {
    name: "暗潮矿阵",
    brief: "追踪雷会缓慢锁定你，护盾道具会非常关键。",
    goal: 14,
    timeLimit: 58,
    speed: 365,
    hazardRate: 1.62,
    mineRate: 0.46,
    gateRate: 0.2,
    coreRate: 0.7,
    shardRate: 0.54,
    powerRate: 0.2,
    colors: ["#ff4e80", "#8dff8a", "#ffcf5a"],
    threat: "高",
  },
  {
    name: "终点星门",
    brief: "最终星门火力密集，脉冲时机决定通关质量。",
    goal: 16,
    timeLimit: 62,
    speed: 410,
    hazardRate: 1.82,
    mineRate: 0.56,
    gateRate: 0.26,
    coreRate: 0.66,
    shardRate: 0.58,
    powerRate: 0.22,
    colors: ["#59d6ff", "#ffcf5a", "#c88dff"],
    threat: "极高",
  },
];

const assetUrls = {
  start: "assets/optimized/bg-start.jpg",
  fail: "assets/optimized/bg-fail.jpg",
  clear: "assets/optimized/bg-clear.jpg",
  sprites: "assets/optimized/ui-spritesheet.png",
  levelBackgrounds: [
    "assets/optimized/bg-level-1.jpg",
    "assets/optimized/bg-level-2.jpg",
    "assets/optimized/bg-level-3.jpg",
    "assets/optimized/bg-level-2.jpg",
    "assets/optimized/bg-level-3.jpg",
  ],
};

const sprites = {
  player: { x: 24, y: 23, w: 197, h: 225 },
  core: { x: 277, y: 30, w: 167, h: 165 },
  hazard: { x: 513, y: 28, w: 190, h: 167 },
  crystal: { x: 787, y: 25, w: 200, h: 195 },
  mine: { x: 28, y: 268, w: 203, h: 207 },
  gate: { x: 260, y: 263, w: 220, h: 220 },
  shield: { x: 56, y: 487, w: 123, h: 123 },
  heart: { x: 219, y: 499, w: 140, h: 110 },
  flareGold: { x: 53, y: 807, w: 113, h: 100 },
  flareBlue: { x: 220, y: 807, w: 113, h: 100 },
  blast: { x: 47, y: 933, w: 127, h: 87 },
};

const assets = { loaded: false, backgrounds: [], spritesheet: null };

const state = {
  mode: "start",
  levelIndex: 0,
  score: 0,
  lives: 3,
  combo: 0,
  bestCombo: 0,
  energy: 0,
  hits: 0,
  levelStartTime: 0,
  elapsed: 0,
  lastTime: 0,
  hazardTimer: 0,
  coreTimer: 0,
  shardTimer: 0,
  mineTimer: 0,
  gateTimer: 0,
  powerTimer: 0,
  timeRemaining: 0,
  shake: 0,
  flash: 0,
  clearTimer: 0,
  pointerActive: false,
  stars: [],
  hazards: [],
  mines: [],
  gates: [],
  cores: [],
  shards: [],
  powerups: [],
  particles: [],
  drones: [],
  result: null,
  player: { x: 360, y: 1060, radius: 34, targetX: 360, targetY: 1060, invulnerable: 0 },
  muted: false,
  shield: 0,
  slowTime: 0,
};

let audioContext;
let ambientMusic;
let lastFrameTime = 0;

function loadImage(src) {
  if (typeof Image === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function loadAssets() {
  Promise.all([loadImage(assetUrls.sprites), ...assetUrls.levelBackgrounds.map(loadImage)]).then(([spritesheet, ...backgrounds]) => {
    assets.spritesheet = spritesheet;
    assets.backgrounds = backgrounds;
    assets.loaded = true;
  });
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("screen--active"));
  if (screens[name]) screens[name].classList.add("screen--active");
  const isGameplay = state.mode === "playing";
  hud.root.classList.toggle("hud--hidden", !isGameplay);
  ui.pulseButton.classList.toggle("pulse-button--hidden", !isGameplay);
  ui.pauseButton.classList.toggle("pause-button--hidden", !isGameplay);
}

function initBackdrop() {
  state.stars = Array.from({ length: 72 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.9 + 0.45,
    speed: Math.random() * 52 + 22,
    alpha: Math.random() * 0.5 + 0.2,
  }));

  state.drones = Array.from({ length: 4 }, (_, index) => ({
    x: 90 + index * 150,
    y: 260 + Math.random() * 500,
    phase: Math.random() * Math.PI * 2,
  }));
}

function playTone(type) {
  if (state.muted) return;
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const presets = {
    tap: [360, 520, 0.08, "triangle", 0.08],
    collect: [620, 1080, 0.13, "sine", 0.12],
    shard: [760, 520, 0.1, "square", 0.08],
    pulse: [180, 1260, 0.32, "sawtooth", 0.14],
    hit: [170, 70, 0.22, "sawtooth", 0.1],
    win: [420, 980, 0.55, "triangle", 0.14],
  };
  const [from, to, duration, wave, volume] = presets[type] || presets.tap;

  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(from, now);
  oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
  filter.type = "lowpass";
  filter.frequency.value = type === "hit" ? 700 : 2600;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function ensureAmbientMusic() {
  if (state.muted || ambientMusic) return;
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  const base = audioContext.createOscillator();
  const shimmer = audioContext.createOscillator();
  const gain = audioContext.createGain();
  base.type = "sine";
  shimmer.type = "triangle";
  base.frequency.value = 74;
  shimmer.frequency.value = 148;
  gain.gain.value = 0.018;
  base.connect(gain);
  shimmer.connect(gain);
  gain.connect(audioContext.destination);
  base.start();
  shimmer.start();
  ambientMusic = { base, shimmer, gain };
}

function stopAmbientMusic() {
  if (!ambientMusic) return;
  ambientMusic.gain.gain.setValueAtTime(ambientMusic.gain.gain.value, audioContext.currentTime);
  ambientMusic.gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);
  ambientMusic.base.stop(audioContext.currentTime + 0.14);
  ambientMusic.shimmer.stop(audioContext.currentTime + 0.14);
  ambientMusic = null;
}

function updateHud() {
  const level = levels[state.levelIndex];
  hud.level.textContent = String(state.levelIndex + 1);
  hud.score.textContent = String(state.score);
  hud.goal.textContent = String(level.goal);
  hud.lives.textContent = String(state.lives);
  hud.maxLives.textContent = "3";
  hud.points.textContent = String(state.score * 100 + state.bestCombo * 35);
  hud.combo.textContent = String(state.combo);
  hud.energy.textContent = `${Math.floor(state.energy)}%`;
  hud.time.textContent = String(Math.max(0, Math.ceil(state.timeRemaining)));
  hud.energyFill.style.width = `${Math.min(100, state.energy)}%`;
  ui.pulseButton.classList.toggle("pulse-button--charging", state.energy < 100);
}

function prepareLevel(index) {
  const level = levels[index];
  state.levelIndex = index;
  state.score = 0;
  state.lives = 3;
  state.combo = 0;
  state.bestCombo = 0;
  state.energy = 24;
  state.hits = 0;
  state.elapsed = 0;
  state.timeRemaining = level.timeLimit;
  state.hazardTimer = 0.2;
  state.coreTimer = 0.1;
  state.shardTimer = 1.1;
  state.mineTimer = 1.8;
  state.gateTimer = 3.2;
  state.powerTimer = 2.4;
  state.shake = 0;
  state.flash = 0;
  state.clearTimer = 0;
  state.result = null;
  state.hazards = [];
  state.mines = [];
  state.gates = [];
  state.cores = [];
  state.shards = [];
  state.powerups = [];
  state.particles = [];
  state.shield = 0;
  state.slowTime = 0;
  state.player.x = 360;
  state.player.y = 1060;
  state.player.targetX = 360;
  state.player.targetY = 1060;
  state.player.invulnerable = 1.2;
  ui.levelKicker.textContent = `第 ${index + 1} 关`;
  ui.levelTitle.textContent = level.name;
  ui.levelBrief.textContent = level.brief;
  ui.briefGoal.textContent = String(level.goal);
  ui.briefThreat.textContent = level.threat;
  ui.clearText.textContent = `${level.name} 星门正在展开`;
  updateHud();
}

function startLevel() {
  state.mode = "playing";
  state.lastTime = performance.now();
  state.levelStartTime = state.lastTime;
  showScreen(null);
  ensureAmbientMusic();
  playTone("tap");
}

function pauseGame() {
  if (state.mode !== "playing") return;
  state.mode = "pause";
  showScreen("pause");
  playTone("tap");
}

function resumeGame() {
  if (state.mode !== "pause") return;
  state.mode = "playing";
  state.lastTime = performance.now();
  showScreen(null);
  playTone("tap");
}

function spawnHazard() {
  const level = levels[state.levelIndex];
  const size = Math.random() * 25 + 28;
  state.hazards.push({
    x: size + Math.random() * (canvas.width - size * 2),
    y: -size,
    radius: size,
    speed: level.speed + Math.random() * 115,
    drift: (Math.random() - 0.5) * 75,
    spin: Math.random() * Math.PI,
    sides: Math.random() > 0.45 ? 9 : 5,
  });
}

function spawnCore() {
  state.cores.push({
    x: 30 + Math.random() * (canvas.width - 60),
    y: -32,
    radius: 19,
    speed: 150 + Math.random() * 78,
    pulse: Math.random() * Math.PI * 2,
  });
}

function spawnShard() {
  state.shards.push({
    x: 28 + Math.random() * (canvas.width - 56),
    y: -22,
    radius: 13,
    speed: 210 + Math.random() * 120,
    pulse: Math.random() * Math.PI * 2,
  });
}

function spawnMine() {
  const level = levels[state.levelIndex];
  state.mines.push({
    x: 42 + Math.random() * (canvas.width - 84),
    y: -42,
    radius: 25,
    speed: level.speed * 0.72 + Math.random() * 55,
    pulse: Math.random() * Math.PI * 2,
    lock: 0,
  });
}

function spawnGate() {
  const level = levels[state.levelIndex];
  const gap = 180 - Math.min(55, state.levelIndex * 12);
  const gapX = 110 + Math.random() * (canvas.width - 220);
  state.gates.push({
    x: gapX,
    y: -90,
    gap,
    height: 38,
    speed: level.speed * 0.62,
    pulse: 0,
  });
}

function spawnPowerup() {
  const types = ["shield", "time", "charge"];
  const type = types[Math.floor(Math.random() * types.length)];
  state.powerups.push({
    type,
    x: 34 + Math.random() * (canvas.width - 68),
    y: -34,
    radius: 18,
    speed: 155 + Math.random() * 55,
    pulse: Math.random() * Math.PI * 2,
  });
}

function burst(x, y, color, count = 14, spread = 190) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * spread + 65;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: Math.random() * 0.35 + 0.35,
      maxLife: 0.7,
      color,
      radius: Math.random() * 4 + 2,
    });
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function drawSprite(name, x, y, width, height, rotation = 0, alpha = 1) {
  const sprite = sprites[name];
  if (!assets.spritesheet || !sprite) return false;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha *= alpha;
  ctx.drawImage(assets.spritesheet, sprite.x, sprite.y, sprite.w, sprite.h, -width / 2, -height / 2, width, height);
  ctx.restore();
  return true;
}

function setMode(mode) {
  state.mode = mode;
  showScreen(mode);
}

function gradeFor(points) {
  if (points >= 1500) return ["S", "完美突破，舰队会记住这条航线。"];
  if (points >= 1150) return ["A", "高质量通关，节奏和路线都很稳。"];
  if (points >= 850) return ["B", "任务完成，仍有提升空间。"];
  return ["C", "星门已打开，但护盾损耗偏高。"];
}

function calculateResult() {
  const time = Math.max(1, state.elapsed);
  const level = levels[state.levelIndex];
  const base = state.score * 100;
  const comboBonus = state.bestCombo * 35;
  const shieldBonus = state.lives * 140;
  const speedBonus = Math.max(0, Math.round((42 - time) * 12));
  const hitPenalty = state.hits * 120;
  const total = Math.max(0, base + comboBonus + shieldBonus + speedBonus - hitPenalty);
  const [rank, comment] = gradeFor(total);
  return {
    levelName: level.name,
    total,
    rank,
    comment,
    bestCombo: state.bestCombo,
    lives: state.lives,
    time,
  };
}

function showResult() {
  state.result = calculateResult();
  ui.resultTitle.textContent = `${state.result.levelName} 完成`;
  ui.resultRank.textContent = state.result.rank;
  ui.resultScore.textContent = String(state.result.total);
  ui.resultCombo.textContent = String(state.result.bestCombo);
  ui.resultLives.textContent = String(state.result.lives);
  ui.resultTime.textContent = `${state.result.time.toFixed(1)}s`;
  ui.resultComment.textContent = state.result.comment;
  ui.nextButton.textContent = state.levelIndex === levels.length - 1 ? "再战一轮" : "下一关";
  ui.clearOverlay.classList.remove("clear-overlay--active");
  setMode("result");
}

function completeLevel() {
  state.mode = "clearing";
  state.clearTimer = 2.35;
  state.flash = 1;
  state.energy = Math.min(100, state.energy + 20);
  state.hazards = [];
  state.mines = [];
  state.gates = [];
  state.cores = [];
  state.shards = [];
  state.powerups = [];
  burst(state.player.x, state.player.y, "#8dff8a", 58, 280);
  ui.clearOverlay.classList.add("clear-overlay--active");
  showScreen(null);
  updateHud();
  playTone("win");
}

function gameOver() {
  state.mode = "gameOver";
  state.combo = 0;
  state.flash = 0.8;
  showScreen("gameOver");
  playTone("hit");
}

function collectCore(core) {
  state.score += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.energy = Math.min(100, state.energy + 12);
  burst(core.x, core.y, "#ffcf5a", 18);
  playTone("collect");
  updateHud();
  if (state.score >= levels[state.levelIndex].goal) completeLevel();
}

function collectShard(shard) {
  state.combo += 2;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.energy = Math.min(100, state.energy + 18);
  burst(shard.x, shard.y, "#8dff8a", 12);
  playTone("shard");
  updateHud();
}

function collectPowerup(powerup) {
  if (powerup.type === "shield") {
    state.shield = 8;
    burst(powerup.x, powerup.y, "#59d6ff", 22);
  } else if (powerup.type === "time") {
    state.timeRemaining = Math.min(levels[state.levelIndex].timeLimit, state.timeRemaining + 8);
    state.slowTime = 4;
    burst(powerup.x, powerup.y, "#c88dff", 22);
  } else {
    state.energy = Math.min(100, state.energy + 38);
    burst(powerup.x, powerup.y, "#8dff8a", 22);
  }
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  playTone("collect");
  updateHud();
}

function takeHit() {
  if (state.player.invulnerable > 0 || state.mode !== "playing") return;
  if (state.shield > 0) {
    state.shield = 0;
    state.player.invulnerable = 0.75;
    state.shake = 0.45;
    state.flash = 0.35;
    burst(state.player.x, state.player.y, "#59d6ff", 34, 250);
    playTone("pulse");
    updateHud();
    return;
  }
  state.lives -= 1;
  state.hits += 1;
  state.combo = 0;
  state.energy = Math.min(100, state.energy + 8);
  state.player.invulnerable = 1.15;
  state.shake = 1;
  state.flash = 0.5;
  burst(state.player.x, state.player.y, "#ff4e80", 28);
  playTone("hit");
  updateHud();
  if (state.lives <= 0) gameOver();
}

function activatePulse() {
  if (state.mode !== "playing" || state.energy < 100) return;
  state.energy = 0;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.flash = 0.65;
  state.shake = 0.7;
  state.hazards.forEach((hazard) => burst(hazard.x, hazard.y, "#59d6ff", 10));
  state.mines.forEach((mine) => burst(mine.x, mine.y, "#59d6ff", 10));
  state.hazards = [];
  state.mines = [];
  state.gates = [];
  burst(state.player.x, state.player.y, "#59d6ff", 44, 320);
  playTone("pulse");
  updateHud();
}

function updateBackdrop(dt) {
  state.stars.forEach((star) => {
    star.y += star.speed * dt;
    if (star.y > canvas.height) {
      star.y = -8;
      star.x = Math.random() * canvas.width;
    }
  });

  state.drones.forEach((drone) => {
    drone.phase += dt;
    drone.y += Math.sin(drone.phase) * 8 * dt;
  });

  state.particles = state.particles.filter((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 120 * dt;
    particle.life -= dt;
    return particle.life > 0;
  });
}

function update(dt, time) {
  const level = levels[state.levelIndex];
  const player = state.player;
  updateBackdrop(dt);
  state.shake = Math.max(0, state.shake - dt * 7);
  state.flash = Math.max(0, state.flash - dt * 2.3);
  state.shield = Math.max(0, state.shield - dt);
  state.slowTime = Math.max(0, state.slowTime - dt);

  if (state.mode === "clearing") {
    state.clearTimer -= dt;
    player.y += (canvas.height * 0.35 - player.y) * Math.min(1, dt * 3.5);
    player.x += (canvas.width / 2 - player.x) * Math.min(1, dt * 3.5);
    if (state.clearTimer <= 0) showResult();
    return;
  }

  if (state.mode !== "playing") return;

  state.elapsed = (time - state.levelStartTime) / 1000;
  const timeScale = state.slowTime > 0 ? 0.55 : 1;
  const motionDt = dt * timeScale;
  state.timeRemaining -= dt;
  if (state.timeRemaining <= 0) {
    gameOver();
    updateHud();
    return;
  }
  state.hazardTimer -= dt;
  state.coreTimer -= dt;
  state.shardTimer -= dt;
  state.mineTimer -= dt;
  state.gateTimer -= dt;
  state.powerTimer -= dt;
  player.invulnerable = Math.max(0, player.invulnerable - dt);

  if (state.hazardTimer <= 0) {
    spawnHazard();
    state.hazardTimer = 1 / level.hazardRate;
  }

  if (state.coreTimer <= 0) {
    spawnCore();
    state.coreTimer = 1 / level.coreRate;
  }

  if (state.shardTimer <= 0) {
    spawnShard();
    state.shardTimer = 1 / level.shardRate;
  }

  if (level.mineRate > 0 && state.mineTimer <= 0) {
    spawnMine();
    state.mineTimer = 1 / level.mineRate;
  }

  if (level.gateRate > 0 && state.gateTimer <= 0) {
    spawnGate();
    state.gateTimer = 1 / level.gateRate;
  }

  if (state.powerTimer <= 0) {
    spawnPowerup();
    state.powerTimer = 1 / level.powerRate;
  }

  player.x += (player.targetX - player.x) * Math.min(1, dt * 12);
  player.y += (player.targetY - player.y) * Math.min(1, dt * 12);
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(178, Math.min(canvas.height - player.radius, player.y));

  state.hazards = state.hazards.filter((hazard) => {
    hazard.y += hazard.speed * motionDt;
    hazard.x += hazard.drift * motionDt;
    hazard.spin += motionDt * 3;
    if (hazard.x < hazard.radius || hazard.x > canvas.width - hazard.radius) hazard.drift *= -1;
    if (distance(player, hazard) < player.radius + hazard.radius * 0.72) {
      takeHit();
      return false;
    }
    return hazard.y < canvas.height + hazard.radius;
  });

  state.cores = state.cores.filter((core) => {
    core.y += core.speed * motionDt;
    core.pulse += dt * 5;
    if (distance(player, core) < player.radius + core.radius) {
      collectCore(core);
      return false;
    }
    return core.y < canvas.height + core.radius;
  });

  state.shards = state.shards.filter((shard) => {
    shard.y += shard.speed * motionDt;
    shard.pulse += dt * 7;
    if (distance(player, shard) < player.radius + shard.radius) {
      collectShard(shard);
      return false;
    }
    return shard.y < canvas.height + shard.radius;
  });

  state.mines = state.mines.filter((mine) => {
    mine.lock += dt;
    mine.pulse += dt * 5;
    mine.y += mine.speed * motionDt;
    mine.x += Math.sign(player.x - mine.x) * Math.min(80, Math.abs(player.x - mine.x)) * 0.55 * motionDt;
    if (distance(player, mine) < player.radius + mine.radius * 0.8) {
      takeHit();
      return false;
    }
    return mine.y < canvas.height + mine.radius;
  });

  state.gates = state.gates.filter((gate) => {
    gate.y += gate.speed * motionDt;
    gate.pulse += dt * 5;
    const inVertical = Math.abs(player.y - gate.y) < player.radius + gate.height;
    const outsideGap = player.x < gate.x - gate.gap / 2 + player.radius || player.x > gate.x + gate.gap / 2 - player.radius;
    if (inVertical && outsideGap) takeHit();
    return gate.y < canvas.height + gate.height;
  });

  state.powerups = state.powerups.filter((powerup) => {
    powerup.y += powerup.speed * motionDt;
    powerup.pulse += dt * 6;
    if (distance(player, powerup) < player.radius + powerup.radius) {
      collectPowerup(powerup);
      return false;
    }
    return powerup.y < canvas.height + powerup.radius;
  });

  updateHud();
}

function drawBackground(time) {
  const level = levels[state.levelIndex];
  const background = assets.backgrounds[state.levelIndex % assets.backgrounds.length];
  if (background) {
    const scale = Math.max(canvas.width / background.width, canvas.height / background.height);
    const width = background.width * scale;
    const height = background.height * scale;
    const drift = state.mode === "playing" ? (time * 0.018) % 36 : Math.sin(time * 0.0004) * 10;
    ctx.drawImage(background, (canvas.width - width) / 2, (canvas.height - height) / 2 + drift, width, height);
    ctx.fillStyle = "rgba(5, 8, 20, 0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#050814");
    gradient.addColorStop(0.46, "#101b33");
    gradient.addColorStop(1, "#091a20");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  ctx.globalAlpha = 0.24;
  for (let i = 0; i < 8; i += 1) {
    const x = 55 + i * 88 + Math.sin(time * 0.001 + i) * 22;
    ctx.strokeStyle = i % 2 ? level.colors[1] : level.colors[0];
    ctx.lineWidth = i % 2 ? 1.2 : 2;
    ctx.beginPath();
    ctx.moveTo(x, -60);
    ctx.bezierCurveTo(x - 95, 330, x + 130, 760, x - 8, 1340);
    ctx.stroke();
  }
  ctx.restore();

  state.stars.forEach((star) => {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#f7fbff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  if (state.mode === "playing" || state.mode === "clearing" || state.mode === "gameOver") {
    drawStarPath(time);
  }

  ctx.save();
  ctx.globalAlpha = 0.12;
  state.drones.forEach((drone, index) => {
    ctx.strokeStyle = level.colors[index % level.colors.length];
    ctx.beginPath();
    ctx.arc(drone.x + Math.sin(drone.phase) * 30, drone.y, 52, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}

function drawStarPath(time) {
  const level = levels[state.levelIndex];
  const horizon = canvas.height * 0.24;
  const bottom = canvas.height + 40;
  const center = canvas.width / 2;
  const pathGradient = ctx.createLinearGradient(0, horizon, 0, bottom);
  pathGradient.addColorStop(0, "rgba(40, 63, 86, 0.08)");
  pathGradient.addColorStop(0.55, "rgba(64, 79, 95, 0.24)");
  pathGradient.addColorStop(1, "rgba(111, 125, 130, 0.4)");

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(center - 70, horizon);
  ctx.lineTo(center + 70, horizon);
  ctx.lineTo(canvas.width + 84, bottom);
  ctx.lineTo(-84, bottom);
  ctx.closePath();
  ctx.fillStyle = pathGradient;
  ctx.fill();

  ctx.globalAlpha = 0.75;
  for (let i = -3; i <= 3; i += 1) {
    const near = center + i * 92;
    const far = center + i * 18;
    ctx.strokeStyle = i === 0 ? level.colors[1] : level.colors[0];
    ctx.lineWidth = i === 0 ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(far, horizon);
    ctx.lineTo(near, bottom);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.46;
  ctx.strokeStyle = "rgba(247, 251, 255, 0.48)";
  for (let j = 0; j < 12; j += 1) {
    const y = ((time * 0.13 + j * 116) % (bottom - horizon)) + horizon;
    const t = (y - horizon) / (bottom - horizon);
    const half = 70 + t * 420;
    ctx.beginPath();
    ctx.moveTo(center - half, y);
    ctx.lineTo(center + half, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer(time) {
  const player = state.player;
  const flicker = player.invulnerable > 0 && Math.floor(time / 90) % 2 === 0;
  if (flicker) ctx.globalAlpha = 0.48;

  if (drawSprite("player", player.x, player.y - 12, 148, 170, 0, 1)) {
    ctx.save();
    ctx.globalAlpha = 0.58;
    const trail = ctx.createLinearGradient(player.x, player.y + 36, player.x, player.y + 170);
    trail.addColorStop(0, "#f7fbff");
    trail.addColorStop(0.25, "#ffcf5a");
    trail.addColorStop(0.68, "#ff4e80");
    trail.addColorStop(1, "rgba(89, 214, 255, 0)");
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.moveTo(player.x - 32, player.y + 38);
    ctx.quadraticCurveTo(player.x, player.y + 155 + Math.sin(time * 0.01) * 10, player.x + 32, player.y + 38);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
    return;
  }

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.shadowColor = "#59d6ff";
  ctx.shadowBlur = 34;
  ctx.fillStyle = "#f7fbff";
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.lineTo(41, 34);
  ctx.quadraticCurveTo(0, 19, -41, 34);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#1d4f82";
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(-46, 18);
  ctx.lineTo(-82, 50);
  ctx.lineTo(-34, 42);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(46, 18);
  ctx.lineTo(82, 50);
  ctx.lineTo(34, 42);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#59d6ff";
  ctx.beginPath();
  ctx.arc(0, -5, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#8dff8a";
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.86;
  ctx.beginPath();
  ctx.arc(0, -5, 24 + Math.sin(time * 0.012) * 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffcf5a";
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(-16, 34);
  ctx.lineTo(0, 94 + Math.sin(time * 0.018) * 14);
  ctx.lineTo(16, 34);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.42;
  const trail = ctx.createLinearGradient(0, 34, 0, 180);
  trail.addColorStop(0, "#f7fbff");
  trail.addColorStop(0.25, "#ffcf5a");
  trail.addColorStop(0.65, "#ff4e80");
  trail.addColorStop(1, "rgba(89, 214, 255, 0)");
  ctx.fillStyle = trail;
  ctx.beginPath();
  ctx.moveTo(-28, 38);
  ctx.quadraticCurveTo(0, 134 + Math.sin(time * 0.01) * 10, 28, 38);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawHazards() {
  state.hazards.forEach((hazard) => {
    if (drawSprite("hazard", hazard.x, hazard.y, hazard.radius * 2.15, hazard.radius * 1.9, hazard.spin)) return;
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.rotate(hazard.spin);
    ctx.fillStyle = "#ff4e80";
    ctx.shadowColor = "#ff4e80";
    ctx.shadowBlur = 22;
    ctx.beginPath();
    for (let i = 0; i < hazard.sides; i += 1) {
      const angle = (i / hazard.sides) * Math.PI * 2;
      const radius = i % 2 ? hazard.radius * 0.62 : hazard.radius;
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });
}

function drawCores() {
  state.cores.forEach((core) => {
    const pulse = Math.sin(core.pulse) * 4;
    if (drawSprite("core", core.x, core.y, 62 + pulse, 62 + pulse, core.pulse * 0.25)) return;
    ctx.save();
    ctx.translate(core.x, core.y);
    ctx.shadowColor = "#ffcf5a";
    ctx.shadowBlur = 28;
    ctx.fillStyle = "#ffcf5a";
    ctx.beginPath();
    ctx.arc(0, 0, core.radius + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff8d8";
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawShards() {
  state.shards.forEach((shard) => {
    const pulse = Math.sin(shard.pulse) * 3;
    if (drawSprite("crystal", shard.x, shard.y, 52 + pulse, 58 + pulse, shard.pulse * 0.2)) return;
    ctx.save();
    ctx.translate(shard.x, shard.y);
    ctx.rotate(shard.pulse);
    ctx.shadowColor = "#8dff8a";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#8dff8a";
    ctx.beginPath();
    ctx.moveTo(0, -shard.radius - pulse);
    ctx.lineTo(shard.radius + pulse, 0);
    ctx.lineTo(0, shard.radius + pulse);
    ctx.lineTo(-shard.radius - pulse, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function drawMines() {
  state.mines.forEach((mine) => {
    const pulse = Math.sin(mine.pulse) * 5;
    if (drawSprite("mine", mine.x, mine.y, 74 + pulse, 74 + pulse, mine.pulse * 0.35)) return;
    ctx.save();
    ctx.translate(mine.x, mine.y);
    ctx.rotate(mine.pulse * 0.4);
    ctx.shadowColor = "#ffcf5a";
    ctx.shadowBlur = 28;
    ctx.strokeStyle = "#ffcf5a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, mine.radius + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#ff4e80";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 16, Math.sin(angle) * 16);
      ctx.lineTo(Math.cos(angle) * (28 + pulse), Math.sin(angle) * (28 + pulse));
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawGates() {
  state.gates.forEach((gate) => {
    const glow = 0.5 + Math.sin(gate.pulse) * 0.18;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.shadowColor = "#c88dff";
    ctx.shadowBlur = 26;
    ctx.strokeStyle = `rgba(200, 141, 255, ${glow})`;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, gate.y);
    ctx.lineTo(gate.x - gate.gap / 2, gate.y);
    ctx.moveTo(gate.x + gate.gap / 2, gate.y);
    ctx.lineTo(canvas.width, gate.y);
    ctx.stroke();
    ctx.fillStyle = "rgba(247, 251, 255, 0.8)";
    ctx.fillRect(gate.x - gate.gap / 2 - 8, gate.y - 12, 16, 24);
    ctx.fillRect(gate.x + gate.gap / 2 - 8, gate.y - 12, 16, 24);
    ctx.restore();
    drawSprite("gate", gate.x, gate.y, gate.gap * 0.55, gate.gap * 0.55, gate.pulse * 0.18, 0.42);
  });
}

function drawPowerups() {
  const colors = {
    shield: "#59d6ff",
    time: "#c88dff",
    charge: "#8dff8a",
  };
  state.powerups.forEach((powerup) => {
    const color = colors[powerup.type];
    const pulse = Math.sin(powerup.pulse) * 4;
    const spriteName = powerup.type === "shield" ? "shield" : powerup.type === "time" ? "heart" : "crystal";
    if (drawSprite(spriteName, powerup.x, powerup.y, 56 + pulse, 56 + pulse, powerup.pulse * 0.25)) return;
    ctx.save();
    ctx.translate(powerup.x, powerup.y);
    ctx.rotate(powerup.pulse * 0.5);
    ctx.shadowColor = color;
    ctx.shadowBlur = 26;
    ctx.fillStyle = color;
    ctx.beginPath();
    if (powerup.type === "shield") {
      ctx.arc(0, 0, powerup.radius + pulse, 0, Math.PI * 2);
    } else if (powerup.type === "time") {
      ctx.rect(-powerup.radius, -powerup.radius, (powerup.radius + pulse) * 2, (powerup.radius + pulse) * 2);
    } else {
      ctx.moveTo(0, -powerup.radius - pulse);
      ctx.lineTo(powerup.radius + pulse, 0);
      ctx.lineTo(0, powerup.radius + pulse);
      ctx.lineTo(-powerup.radius - pulse, 0);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function drawParticles() {
  state.particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawClearingGate(time) {
  if (state.mode !== "clearing") return;
  const progress = 1 - Math.max(0, state.clearTimer) / 2.35;
  const level = levels[state.levelIndex];
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height * 0.34);
  ctx.strokeStyle = level.colors[2];
  ctx.shadowColor = level.colors[2];
  ctx.shadowBlur = 40;
  ctx.lineWidth = 10;
  for (let i = 0; i < 4; i += 1) {
    ctx.rotate(time * 0.001 + i);
    ctx.beginPath();
    ctx.ellipse(0, 0, 112 + i * 32 + progress * 70, 44 + i * 18, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function render(time) {
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake * 18, (Math.random() - 0.5) * state.shake * 18);
  }
  drawBackground(time);
  drawClearingGate(time);
  drawCores();
  drawShards();
  drawPowerups();
  drawGates();
  drawHazards();
  drawMines();
  drawParticles();
  if (state.mode === "playing" || state.mode === "clearing") {
    drawPlayer(time);
  }
  ctx.restore();

  if (state.mode === "playing" && state.energy >= 100) {
    ctx.save();
    ctx.globalAlpha = 0.2 + Math.sin(time * 0.01) * 0.08;
    ctx.strokeStyle = "#59d6ff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, 72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if ((state.mode === "playing" || state.mode === "clearing") && state.shield > 0) {
    ctx.save();
    ctx.globalAlpha = 0.32 + Math.sin(time * 0.012) * 0.08;
    ctx.strokeStyle = "#59d6ff";
    ctx.shadowColor = "#59d6ff";
    ctx.shadowBlur = 24;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${state.flash * 0.36})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function loop(time) {
  const targetFps = state.mode === "playing" || state.mode === "clearing" ? 30 : 18;
  if (time - lastFrameTime < 1000 / targetFps) {
    requestAnimationFrame(loop);
    return;
  }
  lastFrameTime = time;
  const dt = Math.min(0.033, (time - state.lastTime) / 1000 || 0);
  state.lastTime = time;
  update(dt, time);
  render(time);
  requestAnimationFrame(loop);
}

function pointerToCanvas(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

canvas.addEventListener("pointerdown", (event) => {
  if (state.mode !== "playing") return;
  state.pointerActive = true;
  canvas.setPointerCapture(event.pointerId);
  const point = pointerToCanvas(event);
  state.player.targetX = point.x;
  state.player.targetY = point.y;
});

canvas.addEventListener("pointermove", (event) => {
  if (!state.pointerActive || state.mode !== "playing") return;
  const point = pointerToCanvas(event);
  state.player.targetX = point.x;
  state.player.targetY = point.y;
});

canvas.addEventListener("pointerup", () => {
  state.pointerActive = false;
});

canvas.addEventListener("pointercancel", () => {
  state.pointerActive = false;
});

document.getElementById("startButton").addEventListener("click", () => {
  playTone("tap");
  prepareLevel(0);
  setMode("level");
});

document.getElementById("levelButton").addEventListener("click", startLevel);
ui.tutorialButton.addEventListener("click", () => {
  setMode("tutorial");
  playTone("tap");
});
ui.tutorialBackButton.addEventListener("click", () => {
  setMode("start");
  playTone("tap");
});
ui.pulseButton.addEventListener("click", activatePulse);
ui.pauseButton.addEventListener("click", pauseGame);
ui.resumeButton.addEventListener("click", resumeGame);
ui.restartButton.addEventListener("click", () => {
  prepareLevel(state.levelIndex);
  setMode("level");
  playTone("tap");
});
ui.soundButton.addEventListener("click", () => {
  state.muted = !state.muted;
  ui.soundButton.classList.toggle("sound-button--muted", state.muted);
  ui.soundButton.textContent = state.muted ? "×" : "♪";
  if (state.muted) stopAmbientMusic();
  if (!state.muted) {
    ensureAmbientMusic();
    playTone("tap");
  }
});

ui.nextButton.addEventListener("click", () => {
  const next = state.levelIndex + 1;
  prepareLevel(next >= levels.length ? 0 : next);
  setMode("level");
  playTone("tap");
});

document.getElementById("retryButton").addEventListener("click", () => {
  prepareLevel(state.levelIndex);
  setMode("level");
  playTone("tap");
});

window.addEventListener("resize", () => render(performance.now()));
window.addEventListener("contextmenu", (event) => event.preventDefault());

initBackdrop();
loadAssets();
prepareLevel(0);
showScreen("start");
requestAnimationFrame(loop);
