let audioContext;
let ambientMusic;
let musicTrack;
let lastFrameTime = 0;

const levelMusic = [
  { bass: [74, 0, 111, 0], lead: [296, 370, 444, 370, 296, 222, 296, 370], color: "#59d6ff", filter: 1800, volume: 0.016 },
  { bass: [82, 123, 0, 164], lead: [329, 493, 411, 493, 658, 493, 411, 329], color: "#ff4e80", filter: 2100, volume: 0.015 },
  { bass: [69, 0, 103, 138], lead: [276, 345, 414, 552, 414, 345, 276, 207], color: "#c88dff", filter: 1700, volume: 0.014 },
  { bass: [92, 0, 138, 184], lead: [368, 552, 460, 690, 552, 460, 368, 276], color: "#8dff8a", filter: 2300, volume: 0.015 },
  { bass: [55, 110, 0, 165], lead: [330, 440, 550, 660, 880, 660, 550, 440], color: "#ffcf5a", filter: 2600, volume: 0.0165 },
];

const musicProfiles = [
  { volume: 0.17, rate: 0.96, start: 0 },
  { volume: 0.18, rate: 1.0, start: 18 },
  { volume: 0.17, rate: 1.04, start: 36 },
  { volume: 0.19, rate: 1.08, start: 54 },
  { volume: 0.2, rate: 1.12, start: 72 },
];

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
  preloadFinalVideo();
}

function preloadFinalVideo() {
  const video = ui.finalVideo;
  if (!video) return;
  video.src = assetUrls.finalVideo;
  video.poster = assetUrls.clear;
  video.preload = "auto";
  video.load();
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
  if (state.muted) return;
  if (ensureMusicTrack()) return;
  ensureSynthMusic();
}

function ensureMusicTrack() {
  if (typeof Audio === "undefined") return false;
  if (!musicTrack) {
    musicTrack = new Audio(assetUrls.music);
    musicTrack.loop = true;
    musicTrack.preload = "auto";
    musicTrack.failed = false;
    musicTrack.addEventListener("error", () => {
      musicTrack.failed = true;
      ensureSynthMusic();
    });
  }
  if (musicTrack.failed) return false;
  if (ambientMusic) stopSynthMusic(0.08);

  const profile = musicProfiles[state.levelIndex % musicProfiles.length];
  musicTrack.volume = profile.volume;
  musicTrack.playbackRate = profile.rate;
  if (musicTrack.levelIndex !== state.levelIndex) {
    musicTrack.levelIndex = state.levelIndex;
    if (Number.isFinite(musicTrack.duration) && musicTrack.duration > profile.start + 5) {
      musicTrack.currentTime = profile.start;
    }
  }

  const playPromise = musicTrack.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      musicTrack.failed = true;
      ensureSynthMusic();
    });
  }
  return true;
}

function ensureSynthMusic() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ambientMusic && ambientMusic.levelIndex === state.levelIndex) return;
  if (ambientMusic) stopSynthMusic(0.08);

  const preset = levelMusic[state.levelIndex % levelMusic.length];
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(preset.volume, now + 0.4);
  gain.connect(audioContext.destination);

  const playStep = () => {
    if (!ambientMusic || ambientMusic.levelIndex !== state.levelIndex || state.muted) return;
    const beat = 0.24;
    const start = audioContext.currentTime + 0.02;
    preset.lead.forEach((frequency, index) => {
      playMusicNote(frequency, index % 2 ? "triangle" : "sine", start + index * beat, 0.1, 0.22, gain, preset.filter);
    });
    preset.bass.forEach((frequency, index) => {
      if (frequency > 0) playMusicNote(frequency, "triangle", start + index * beat * 2, 0.18, 0.34, gain, 620);
    });
  };

  ambientMusic = {
    levelIndex: state.levelIndex,
    gain,
    timer: setInterval(playStep, 1920),
  };
  playStep();
}

function stopAmbientMusic(fade = 0.12) {
  if (musicTrack) musicTrack.pause();
  stopSynthMusic(fade);
}

function stopSynthMusic(fade = 0.12) {
  if (!ambientMusic) return;
  const now = audioContext.currentTime;
  clearInterval(ambientMusic.timer);
  ambientMusic.gain.gain.setValueAtTime(ambientMusic.gain.gain.value, now);
  ambientMusic.gain.gain.exponentialRampToValueAtTime(0.001, now + fade);
  ambientMusic = null;
}

function playMusicNote(frequency, wave, start, duration, volume, destination, filterFrequency) {
  const oscillator = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, start);
  filter.type = "lowpass";
  filter.frequency.value = filterFrequency;
  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
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
