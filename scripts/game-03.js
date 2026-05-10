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

function fireMissile() {
  const player = state.player;
  state.missiles.push({
    x: player.x,
    y: player.y - 70,
    vx: 0,
    vy: -760,
    radius: 8,
    life: 1.25,
    pulse: 0,
  });
  playTone("shard");
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
  ui.finalGateOverlay.classList.remove("final-gate-overlay--active");
  setMode("result");
}

function openFinalStargate() {
  state.mode = "finalGate";
  state.finalGateTimer = 4.6;
  state.flash = 1;
  ui.clearOverlay.classList.remove("clear-overlay--active");
  ui.finalGateOverlay.classList.add("final-gate-overlay--active");
  showScreen(null);
  playTone("win");
}

function completeLevel() {
  state.mode = "clearing";
  state.clearTimer = 2.35;
  state.flash = 1;
  state.energy = Math.min(100, state.energy + 20);
  state.hazards = [];
  state.mines = [];
  state.gates = [];
  state.missiles = [];
  state.cores = [];
  state.shards = [];
  state.powerups = [];
  burst(state.player.x, state.player.y, "#8dff8a", 58, 280);
  ui.clearOverlay.classList.add("clear-overlay--active");
  showScreen(null);
  updateHud();
  playTone("win");
}
