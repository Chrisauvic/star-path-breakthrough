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

const context = {
  console,
  performance: { now: () => 1 },
  requestAnimationFrame() {},
  window: {
    AudioContext: function AudioContext() {
      return {
        currentTime: 0,
        createOscillator: () => ({ ...fakeAudioNode }),
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

vm.runInContext("prepareLevel(levels.length - 1); completeLevel(); state.clearTimer = 0; update(0.016, performance.now());", context);

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

console.log("Smoke test passed: boot, gameplay, clear animation, final stargate, and result scoring are valid.");
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

const context = {
  console,
  performance: { now: () => 1 },
  requestAnimationFrame() {},
  window: {
    AudioContext: function AudioContext() {
      return {
        currentTime: 0,
        createOscillator: () => ({ ...fakeAudioNode }),
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
};

context.window.webkitAudioContext = context.window.AudioContext;

vm.createContext(context);
vm.runInContext(fs.readFileSync("game.js", "utf8"), context, { filename: "game.js" });

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

console.log("Smoke test passed: boot, gameplay, clear animation, and result scoring are valid.");
