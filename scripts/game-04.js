function gameOver() {
  state.mode = "gameOver";
  state.combo = 0;
  state.flash = 0.8;
  stopAmbientMusic(0.18);
  playSceneCue("defeat");
  showScreen("gameOver");
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

function destroyThreat(threat, color = "#ffcf5a") {
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.energy = Math.min(100, state.energy + 6);
  burst(threat.x, threat.y, color, 20, 260);
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
  state.missiles = [];
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
    if (state.clearTimer <= 0) {
      if (state.levelIndex === levels.length - 1) {
        openFinalStargate();
      } else {
        showResult();
      }
    }
    return;
  }

  if (state.mode === "finalGate") {
    state.finalGateTimer -= dt;
    if (state.finalGateTimer <= 0) showFinalResult();
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
  state.missileTimer -= dt;
  player.invulnerable = Math.max(0, player.invulnerable - dt);

  if (state.missileTimer <= 0) {
    fireMissile();
    state.missileTimer = Math.max(0.22, 0.44 - state.levelIndex * 0.025);
  }

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

  const joystickSpeed = 520 + state.levelIndex * 18;
  player.x += state.joystickVector.x * joystickSpeed * dt;
  player.y += state.joystickVector.y * joystickSpeed * dt;
  player.targetX = player.x;
  player.targetY = player.y;
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

  state.missiles = state.missiles.filter((missile) => {
    missile.x += missile.vx * dt;
    missile.y += missile.vy * dt;
    missile.life -= dt;
    missile.pulse += dt * 12;
    return missile.life > 0 && missile.y > -40;
  });

  const removeHazards = new Set();
  const removeMines = new Set();
  const removeMissiles = new Set();

  state.missiles.forEach((missile, missileIndex) => {
    state.hazards.forEach((hazard, hazardIndex) => {
      if (!removeHazards.has(hazardIndex) && distance(missile, hazard) < missile.radius + hazard.radius * 0.82) {
        removeHazards.add(hazardIndex);
        removeMissiles.add(missileIndex);
        destroyThreat(hazard, "#ffcf5a");
      }
    });

    state.mines.forEach((mine, mineIndex) => {
      if (!removeMines.has(mineIndex) && distance(missile, mine) < missile.radius + mine.radius * 0.86) {
        removeMines.add(mineIndex);
        removeMissiles.add(missileIndex);
        destroyThreat(mine, "#59d6ff");
      }
    });
  });

  if (removeHazards.size > 0) {
    state.hazards = state.hazards.filter((_, index) => !removeHazards.has(index));
  }
  if (removeMines.size > 0) {
    state.mines = state.mines.filter((_, index) => !removeMines.has(index));
  }
  if (removeMissiles.size > 0) {
    state.missiles = state.missiles.filter((_, index) => !removeMissiles.has(index));
  }

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
