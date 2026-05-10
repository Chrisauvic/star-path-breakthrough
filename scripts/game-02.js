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
  state.finalGateTimer = 0;
  state.result = null;
  state.hazards = [];
  state.mines = [];
  state.gates = [];
  state.missiles = [];
  state.cores = [];
  state.shards = [];
  state.powerups = [];
  state.particles = [];
  state.shield = 0;
  state.slowTime = 0;
  state.missileTimer = 0.2;
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
