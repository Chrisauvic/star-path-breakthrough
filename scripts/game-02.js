let audioContext;
let musicTrack;
let musicScene;
let sceneCue;
const audioCache = {};
let lastFrameTime = 0;

const musicProfiles = [
  { volume: 0.29, rate: 1.0, start: 0 },
  { volume: 0.27, rate: 1.0, start: 0 },
  { volume: 0.25, rate: 1.0, start: 0 },
  { volume: 0.24, rate: 1.0, start: 0 },
  { volume: 0.42, rate: 1.0, start: 0 },
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
  preloadAudioAssets();
  preloadFinalVideo();
}

function preloadAudioAssets() {
  if (typeof Audio === "undefined") return;
  [...assetUrls.audio.levelTracks, assetUrls.audio.clear, assetUrls.audio.victory, assetUrls.audio.defeat].forEach((src) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audioCache[src] = audio;
    audio.load();
  });
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
  unlockAudio();

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const presets = {
    tap: [280, 420, 0.07, "triangle", 0.045],
    collect: [430, 720, 0.12, "sine", 0.075],
    shard: [520, 360, 0.09, "triangle", 0.05],
    pulse: [150, 680, 0.28, "triangle", 0.09],
    hit: [150, 62, 0.2, "triangle", 0.075],
    win: [520, 780, 0.16, "sine", 0.055],
  };
  const [from, to, duration, wave, volume] = presets[type] || presets.tap;

  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(from, now);
  oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
  filter.type = "lowpass";
  filter.frequency.value = type === "hit" ? 520 : 1450;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playClearCue() {
  if (state.muted) return;
  unlockAudio();
  const now = audioContext.currentTime;
  const notes = [440, 554, 659, 880];
  const master = audioContext.createGain();
  master.gain.setValueAtTime(0.001, now);
  master.gain.exponentialRampToValueAtTime(0.16, now + 0.04);
  master.gain.exponentialRampToValueAtTime(0.001, now + 1.05);
  master.connect(audioContext.destination);

  notes.forEach((frequency, index) => {
    const start = now + index * 0.13;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.42);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.46);
  });
}

function unlockAudio() {
  if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext && audioContext.state === "suspended" && audioContext.resume) {
    audioContext.resume();
  }
}

function ensureAmbientMusic() {
  if (state.muted) return;
  unlockAudio();
  stopSceneCue();
  ensureMusicTrack();
}

function ensureMusicTrack() {
  if (typeof Audio === "undefined") return false;
  const profile = musicProfiles[state.levelIndex % musicProfiles.length];
  const src = assetUrls.audio.levelTracks[state.levelIndex] || assetUrls.music;
  if (!musicTrack || musicScene !== src) {
    if (musicTrack) musicTrack.pause();
    musicTrack = new Audio(src);
    musicTrack.loop = true;
    musicTrack.preload = "auto";
    musicTrack.failed = false;
    musicScene = src;
    musicTrack.addEventListener("error", () => {
      musicTrack.failed = true;
    });
  }
  if (musicTrack.failed) return false;

  musicTrack.volume = profile.volume;
  musicTrack.playbackRate = profile.rate;
  if (musicTrack.levelIndex !== state.levelIndex) {
    musicTrack.levelIndex = state.levelIndex;
    musicTrack.currentTime = 0;
    if (Number.isFinite(musicTrack.duration) && musicTrack.duration > profile.start + 5) {
      musicTrack.currentTime = profile.start;
    } else {
      musicTrack.addEventListener(
        "loadedmetadata",
        () => {
          if (musicTrack && musicTrack.levelIndex === state.levelIndex && musicTrack.duration > profile.start + 5) {
            musicTrack.currentTime = profile.start;
          }
        },
        { once: true },
      );
    }
  }

  const playPromise = musicTrack.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      musicTrack.failed = true;
    });
  }
  return true;
}

function stopAmbientMusic() {
  if (musicTrack) musicTrack.pause();
}

function stopSceneCue() {
  if (!sceneCue) return;
  sceneCue.pause();
  sceneCue = null;
}

function playSceneCue(scene) {
  if (state.muted || typeof Audio === "undefined") return false;
  const src = assetUrls.audio[scene];
  if (!src) return false;
  unlockAudio();
  stopSceneCue();
  sceneCue = new Audio(src);
  sceneCue.loop = false;
  sceneCue.preload = "auto";
  sceneCue.currentTime = 0;
  sceneCue.volume = scene === "clear" ? 0.48 : scene === "victory" ? 0.42 : 0.32;
  const playPromise = sceneCue.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      sceneCue = null;
      if (scene === "victory") playTone("win");
      if (scene === "defeat") playTone("hit");
    });
  }
  return true;
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
