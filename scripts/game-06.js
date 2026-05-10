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

function drawMissiles() {
  state.missiles.forEach((missile) => {
    const glow = 0.55 + Math.sin(missile.pulse) * 0.18;
    ctx.save();
    ctx.translate(missile.x, missile.y);
    ctx.shadowColor = "#ffcf5a";
    ctx.shadowBlur = 24;
    ctx.fillStyle = `rgba(255, 207, 90, ${0.8 + glow * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(8, 8);
    ctx.quadraticCurveTo(0, 16, -8, 8);
    ctx.closePath();
    ctx.fill();

    const trail = ctx.createLinearGradient(0, 6, 0, 42);
    trail.addColorStop(0, "rgba(247, 251, 255, 0.85)");
    trail.addColorStop(0.35, "rgba(255, 207, 90, 0.6)");
    trail.addColorStop(1, "rgba(255, 78, 128, 0)");
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.moveTo(-5, 6);
    ctx.quadraticCurveTo(0, 42, 5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}
