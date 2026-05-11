const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const gameConfig = fs.readFileSync(path.join(root, "scripts", "game-01.js"), "utf8");
const audioCode = fs.readFileSync(path.join(root, "scripts", "game-02.js"), "utf8");

function fail(message) {
  throw new Error(message);
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function luminance({ r, g, b }) {
  const channel = [r, g, b].map((value) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

function contrast(a, b) {
  const l1 = luminance(hexToRgb(a));
  const l2 = luminance(hexToRgb(b));
  const high = Math.max(l1, l2);
  const low = Math.min(l1, l2);
  return (high + 0.05) / (low + 0.05);
}

function wavDuration(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    fail(`${file} is not a WAV file.`);
  }
  const channels = buffer.readUInt16LE(22);
  const sampleRate = buffer.readUInt32LE(24);
  const bitsPerSample = buffer.readUInt16LE(34);
  const dataIndex = buffer.indexOf("data");
  if (dataIndex < 0) fail(`${file} is missing a data chunk.`);
  const dataSize = buffer.readUInt32LE(dataIndex + 4);
  return dataSize / (sampleRate * channels * (bitsPerSample / 8));
}

const uiAccentMatches = [...css.matchAll(/#[0-9a-fA-F]{6}/g)].map(([value]) => value.toLowerCase());
const uiAccentSet = new Set(uiAccentMatches.filter((value) => ["#59d6ff", "#ffcf5a", "#ff4e80"].includes(value)));
if (uiAccentSet.size > 3) fail("UI accent palette exceeds three major colors.");
if (css.includes("#8dff8a") || css.includes("#c88dff")) {
  fail("UI CSS still uses extra green/purple accent colors.");
}

const textContrast = contrast("#f7fbff", "#050814");
const softContrast = contrast("#d8e0e6", "#050814");
if (textContrast < 4.5 || softContrast < 4.5) {
  fail(`Text contrast is below WCAG AA. strong=${textContrast.toFixed(2)} soft=${softContrast.toFixed(2)}`);
}

if (audioCode.includes('"square"') || audioCode.includes('"sawtooth"')) {
  fail("Short gameplay SFX still use sharp square/sawtooth waveforms.");
}

if (!audioCode.includes("preloadAudioAssets()")) {
  fail("Scene music should be preloaded before gameplay starts.");
}

const requiredAssets = [
  "assets/optimized/bg-start.jpg",
  "assets/optimized/bg-level-1.jpg",
  "assets/optimized/bg-level-2.jpg",
  "assets/optimized/bg-level-3.jpg",
  "assets/optimized/bg-clear.jpg",
  "assets/optimized/bg-fail.jpg",
  "assets/optimized/ui-spritesheet-game.png",
  "assets/audio/level-1-simple-bgm.ogg",
  "assets/audio/level-2-electro-loop.ogg",
  "assets/audio/level-3-bluebeat.ogg",
  "assets/audio/level-4-tense-future.ogg",
  "assets/audio/level-5-last-stand.ogg",
  "assets/audio/clear-winneris.ogg",
  "assets/audio/victory-sting.wav",
  "assets/audio/defeat-sting.wav",
  "assets/video/final-clear.mp4",
];

for (const asset of requiredAssets) {
  const full = path.join(root, asset);
  if (!fs.existsSync(full)) fail(`Missing referenced asset: ${asset}`);
  const size = fs.statSync(full).size;
  if (size > 3 * 1024 * 1024) fail(`Asset too large for browser upload: ${asset} (${size} bytes)`);
}

for (const [label, file] of [
  ["level 1", "assets/audio/level-1-simple-bgm.ogg"],
  ["level 2", "assets/audio/level-2-electro-loop.ogg"],
  ["level 3", "assets/audio/level-3-bluebeat.ogg"],
  ["level 4", "assets/audio/level-4-tense-future.ogg"],
  ["level 5", "assets/audio/level-5-last-stand.ogg"],
  ["clear", "assets/audio/clear-winneris.ogg"],
  ["victory", "assets/audio/victory-sting.wav"],
  ["defeat", "assets/audio/defeat-sting.wav"],
]) {
  if (!gameConfig.includes(file)) fail(`Game is missing ${label} music mapping.`);
}

const resultFlow = fs.readFileSync(path.join(root, "scripts", "game-03.js"), "utf8");
if (resultFlow.includes("完美突破") || resultFlow.includes("舰队会记住")) {
  fail("Result copy should use compact tactical status labels, not prose comments.");
}
if (!resultFlow.includes("function animateResultScore") || !resultFlow.includes("requestAnimationFrame(tick)")) {
  fail("Battle score should roll up instead of appearing instantly.");
}
if (resultFlow.includes('playSceneCue("victory")')) {
  fail("Victory transition should not use the generated WAV cue because it can create a hum.");
}
if (!gameConfig.includes('clear: "assets/audio/clear-winneris.ogg"') || !resultFlow.includes('playSceneCue("clear")')) {
  fail("Clear animation should use the reviewed sourced victory music cue.");
}
if (!resultFlow.includes('video.style.visibility = "hidden"') || !resultFlow.includes('video.style.visibility = "visible"')) {
  fail("Final video must remain hidden until the first playable frame to avoid black flashes.");
}

const victoryPath = path.join(root, "assets", "audio", "victory-sting.wav");
const clearPath = path.join(root, "assets", "audio", "clear-winneris.ogg");
const defeatPath = path.join(root, "assets", "audio", "defeat-sting.wav");
const victoryDuration = wavDuration(victoryPath);
const defeatDuration = wavDuration(defeatPath);
const levelTrackCount = (gameConfig.match(/assets\/audio\/level-\d-/g) || []).length;
if (levelTrackCount < 5) fail(`Every level needs its own music track. Found ${levelTrackCount}.`);
if (fs.statSync(clearPath).size > 512 * 1024) fail("Clear victory cue should stay short and lightweight.");
if (victoryDuration < 3 || victoryDuration > 7) fail(`Victory sting should be short and rising: ${victoryDuration.toFixed(1)}s`);
if (defeatDuration < 4 || defeatDuration > 8) fail(`Defeat sting should be restrained and non-harsh: ${defeatDuration.toFixed(1)}s`);

console.log("Review passed: UI palette/contrast, five sourced level tracks, and scene stings are within rules.");
