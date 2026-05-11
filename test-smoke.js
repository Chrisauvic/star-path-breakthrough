const fs = require("node:fs");
const vm = require("node:vm");

class ClassList {
  constructor(initial = "") {
    this.names = new Set(initial.split(/\s+/).filter(Boolean));
  }

  add(name) {
    this.names.add(name);
  }

  remove(name) {
    this.names.delete(name);
  }

  contains(name) {
    return this.names.has(name);
  }

  toggle(name, force) {
    if (force) this.add(name);
    else this.remove(name);
  }
}

function createElement(id, className = "") {
  return {
    id,
    textContent: "",
    style: {},
    classList: new ClassList(className),
    listeners: {},
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    removeEventListener(type) {
      delete this.listeners[type];
    },
    click() {
      if (this.listeners.click) this.listeners.click({ preventDefault() {} });
    },
  };
}

const ids = [
  "gameCanvas",
  "startScreen",
  "tutorialScreen",
  "levelScreen",
  "resultScreen",
  "gameOverScreen",
  "pauseScreen",
  "clearOverlay",
  "finalGateOverlay",
  "finalVideoOverlay",
  "finalVideo",
  "playFinalVideoButton",
  "skipFinalVideoButton",
  "clearText",
  "pulseButton",
  "soundButton",
  "pauseButton",
  "tutorialButton",
  "tutorialBackButton",
  "resumeButton",
  "restartButton",
  "hud",
  "hudLevel",
  "hudPoints",
  "hudScore",
  "hudGoal",
  "hudLives",
  "hudMaxLives",
  "hudCombo",
  "hudEnergy",
  "hudTime",
  "energyFill",
  "levelKicker",
  "levelTitle",
  "levelBrief",
  "briefGoal",
  "briefThreat",
  "resultTitle",
  "resultRank",
  "resultScore",
  "resultCombo",
  "resultLives",
  "resultTime",
  "resultComment",
  "nextButton",
  "startButton",
  "levelButton",
  "retryButton",
];

const elements = Object.fromEntries(ids.map((id) => [id, createElement(id)]));
elements.startScreen.classList = new ClassList("screen screen--active");
elements.tutorialScreen.classList = new ClassList("screen screen--briefing");
elements.levelScreen.classList = new ClassList("screen screen--briefing");
elements.resultScreen.classList = new ClassList("screen screen--result");
elements.gameOverScreen.classList = new ClassList("screen screen--briefing");
elements.pauseScreen.classList = new ClassList("screen screen--briefing");
elements.clearOverlay.classList = new ClassList("clear-overlay");
elements.finalGateOverlay.classList = new ClassList("final-gate-overlay");
elements.finalVideoOverlay.classList = new ClassList("final-video-overlay");
elements.finalVideo.canPlayType = () => "";
elements.finalVideo.play = () => Promise.resolve();
elements.finalVideo.pause = () => {};
elements.finalVideo.load = () => {};
elements.playFinalVideoButton.hidden = true;
elements.hud.classList = new ClassList("hud hud--hidden");
elements.pulseButton.classList = new ClassList("pulse-button pulse-button--hidden");
elements.pauseButton.classList = new ClassList("pause-button pause-button--hidden");
elements.soundButton.classList = new ClassList("sound-button");
elements.gameCanvas.width = 720;
elements.gameCanvas.height = 1280;
elements.gameCanvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 360, height: 640 });
elements.gameCanvas.setPointerCapture = () => {};
elements.gameCanvas.getContext = () =>
  new Proxy(
    {},
    {
      get(target, prop) {
        if (!(prop in target)) target[prop] = () => {};
        return target[prop];
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
    },
  );

const fakeAudioNode = {
  connect() {},
  start() {},
  stop() {},
  frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
  gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
};

const audioPlayLog = [];
const oscillatorLog = [];

function FakeAudio(src = "") {
  this.src = src;
  this.loop = false;
  this.preload = "";
  this.failed = false;
  this.levelIndex = undefined;
  this.currentTime = 0;
  this.duration = src.includes("explore") ? 80 : src.includes("boss") ? 40 : 6;
  this.volume = 1;
  this.playbackRate = 1;
  this.listeners = {};
}

FakeAudio.prototype.addEventListener = function addEventListener(type, handler) {
  this.listeners[type] = handler;
};
FakeAudio.prototype.load = function load() {
  if (this.listeners.loadedmetadata) this.listeners.loadedmetadata();
};
FakeAudio.prototype.play = function play() {
  audioPlayLog.push({ src: this.src, loop: this.loop, volume: this.volume, playbackRate: this.playbackRate, currentTime: this.currentTime });
  return Promise.resolve();
};
FakeAudio.prototype.pause = function pause() {};

const context = {
  console,
  performance: { now: () => 1 },
  requestAnimationFrame() {},
  setInterval() {
    return 1;
  },
  clearInterval() {},
  setTimeout(handler) {
    handler();
    return 1;
  },
  clearTimeout() {},
  window: {
    AudioContext: function AudioContext() {
      return {
        currentTime: 0,
        createOscillator: () => {
          const node = { ...fakeAudioNode, type: "" };
          node.start = () => oscillatorLog.push({ type: node.type });
          return node;
        },
        createGain: () => ({ ...fakeAudioNode }),
        createBiquadFilter: () => ({ ...fakeAudioNode }),
        destination: {},
      };
    },
    addEventListener() {},
  },
  document: {
    getElementById(id) {
      if (!elements[id]) throw new Error(`Missing fixture element: ${id}`);
      return elements[id];
    },
  },
  Audio: FakeAudio,
};

context.window.webkitAudioContext = context.window.AudioContext;

vm.createContext(context);
for (const file of [
  "scripts/game-01.js",
  "scripts/game-02.js",
  "scripts/game-03.js",
  "scripts/game-04.js",
  "scripts/game-05.js",
  "scripts/game-06.js",
  "scripts/game-07.js",
]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

if (!elements.startScreen.classList.contains("screen--active")) {
  throw new Error("Start screen should be active on boot.");
}

elements.startButton.click();

if (!elements.levelScreen.classList.contains("screen--active")) {
  throw new Error("Level screen should be active after starting.");
}

if (!elements.hud.classList.contains("hud--hidden")) {
  throw new Error("HUD should stay hidden during briefing.");
}

elements.levelButton.click();

if (elements.levelScreen.classList.contains("screen--active")) {
  throw new Error("Level screen should hide when gameplay starts.");
}

if (elements.pulseButton.classList.contains("pulse-button--hidden")) {
  throw new Error("Pulse button should be visible during gameplay.");
}

if (elements.hud.classList.contains("hud--hidden")) {
  throw new Error("HUD should be visible during gameplay.");
}

if (elements.pauseButton.classList.contains("pause-button--hidden")) {
  throw new Error("Pause button should be visible during gameplay.");
}

if (!audioPlayLog.some((entry) => entry.src.includes("level-1-simple-bgm.ogg") && entry.loop)) {
  throw new Error("Exploration background music should start immediately when level 1 starts.");
}

elements.pauseButton.click();

if (!elements.pauseScreen.classList.contains("screen--active")) {
  throw new Error("Pause screen should open from gameplay.");
}

elements.resumeButton.click();

if (elements.pauseScreen.classList.contains("screen--active")) {
  throw new Error("Pause screen should hide after resume.");
}

vm.runInContext("state.score = levels[state.levelIndex].goal - 1; collectCore({ x: 360, y: 360 });", context);

if (!elements.clearOverlay.classList.contains("clear-overlay--active")) {
  throw new Error("Clear animation overlay should appear after completing a level.");
}

if (!elements.hud.classList.contains("hud--hidden") || !elements.pulseButton.classList.contains("pulse-button--hidden")) {
  throw new Error("HUD and pulse button should hide during the clear animation.");
}

vm.runInContext("showResult();", context);

if (!elements.resultScreen.classList.contains("screen--active")) {
  throw new Error("Result screen should appear after the clear animation.");
}

if (!elements.resultRank.textContent) {
  throw new Error("Result rank should be populated.");
}

vm.runInContext("prepareLevel(levels.length - 1); startLevel();", context);

if (!audioPlayLog.some((entry) => entry.src.includes("level-5-last-stand.ogg") && entry.loop)) {
  throw new Error("Boss background music should start when the final level starts.");
}

vm.runInContext("prepareLevel(levels.length - 1); completeLevel(); state.clearTimer = 0; update(0.016, performance.now());", context);

if (!audioPlayLog.some((entry) => entry.src.includes("clear-winneris.ogg") && !entry.loop)) {
  throw new Error("Clear animation should play the reviewed sourced victory music cue.");
}

if (audioPlayLog.some((entry) => entry.src.includes("victory-sting.wav"))) {
  throw new Error("Generated victory WAV should not play during the clear animation because it can create a hum.");
}

if (!elements.finalGateOverlay.classList.contains("final-gate-overlay--active")) {
  throw new Error("Final stargate animation should open after clearing every level.");
}

vm.runInContext("state.finalGateTimer = 0; update(0.016, performance.now());", context);

if (elements.finalGateOverlay.classList.contains("final-gate-overlay--active")) {
  throw new Error("Final stargate animation should hide before the final result.");
}

if (!elements.resultScreen.classList.contains("screen--active")) {
  throw new Error("Result screen should appear after the final stargate animation.");
}

let finalVideoPlayCount = 0;
elements.finalVideo.canPlayType = () => "probably";
elements.finalVideo.play = () => {
  finalVideoPlayCount += 1;
  return Promise.resolve();
};
elements.finalVideo.pause = () => {};
elements.finalVideo.listeners = {};
elements.finalVideoOverlay.classList.remove("final-video-overlay--active");
elements.finalVideoOverlay.classList.remove("final-video-overlay--loading");

vm.runInContext("prepareLevel(levels.length - 1); completeLevel(); state.clearTimer = 0; update(0.016, performance.now());", context);
vm.runInContext("state.finalGateTimer = 0; update(0.016, performance.now());", context);

if (vm.runInContext("state.mode", context) !== "finalVideo") {
  throw new Error("Final clear should enter a dedicated finalVideo state.");
}

if (finalVideoPlayCount !== 1) {
  throw new Error("Final video should start exactly once when the final gate completes.");
}

if (!elements.finalVideoOverlay.classList.contains("final-video-overlay--loading")) {
  throw new Error("Final video should show a non-black loading overlay before the first frame.");
}

if (elements.finalVideo.style.visibility !== "hidden") {
  throw new Error("Final video element should stay hidden until the first playable frame to avoid black flashes.");
}

vm.runInContext("update(0.016, performance.now()); update(0.016, performance.now());", context);

if (finalVideoPlayCount !== 1) {
  throw new Error("Final video should not restart on later frames.");
}

if (!elements.finalVideo.listeners.playing) {
  throw new Error("Final video should listen for the first playable frame.");
}

elements.finalVideo.listeners.playing();

if (elements.finalVideo.style.visibility !== "visible") {
  throw new Error("Final video element should become visible when playback starts.");
}

if (!elements.finalVideoOverlay.classList.contains("final-video-overlay--active")) {
  throw new Error("Final video overlay should become active after playback starts.");
}

if (elements.finalVideoOverlay.classList.contains("final-video-overlay--loading")) {
  throw new Error("Final video loading state should clear after playback starts.");
}

if (!elements.finalVideo.listeners.ended) {
  throw new Error("Final video should listen for the ended event.");
}

elements.finalVideo.listeners.ended();

if (!elements.resultScreen.classList.contains("screen--active")) {
  throw new Error("Result screen should appear after the final video ends.");
}

console.log("Smoke test passed: boot, gameplay, clear animation, final video, final stargate, and result scoring are valid.");
