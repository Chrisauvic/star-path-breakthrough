function drawBackground(time) {
  const level = levels[state.levelIndex];
  const background = assets.backgrounds[state.levelIndex % assets.backgrounds.length];
  if (background) {
    const scale = Math.max(canvas.width / background.width, canvas.height / background.height);
    const width = background.width * scale;
    const height = background.height * scale;
    const playDrift = state.mode === "playing" || state.mode === "clearing";
    const driftY = playDrift ? Math.sin(time * 0.00018) * 18 : Math.sin(time * 0.00012) * 9;
    const driftX = playDrift ? Math.sin(time * 0.00011) * 8 : Math.sin(time * 0.00009) * 5;
    const drawWidth = width * 1.06;
    const drawHeight = height * 1.06;
    ctx.drawImage(background, (canvas.width - drawWidth) / 2 + driftX, (canvas.height - drawHeight) / 2 + driftY, drawWidth, drawHeight);
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
  const horizon = -canvas.height * 0.1;
  const visualHorizon = canvas.height * 0.08;
  const bottom = canvas.height + 100;
  const center = canvas.width / 2;
  const pathGradient = ctx.createLinearGradient(0, visualHorizon, 0, bottom);
  pathGradient.addColorStop(0, "rgba(40, 63, 86, 0)");
  pathGradient.addColorStop(0.38, "rgba(64, 79, 95, 0.08)");
  pathGradient.addColorStop(1, "rgba(111, 125, 130, 0.22)");

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(center - 28, visualHorizon);
  ctx.lineTo(center + 28, visualHorizon);
  ctx.lineTo(canvas.width + 150, bottom);
  ctx.lineTo(-150, bottom);
  ctx.closePath();
  ctx.fillStyle = pathGradient;
  ctx.fill();

  for (let i = -5; i <= 5; i += 1) {
    const laneRatio = i / 5;
    const near = center + laneRatio * 520;
    const far = center + laneRatio * 18;
    const gradient = ctx.createLinearGradient(far, visualHorizon, near, bottom);
    gradient.addColorStop(0, "rgba(89, 214, 255, 0)");
    gradient.addColorStop(0.28, i === 0 ? "rgba(255, 207, 90, 0.3)" : "rgba(89, 214, 255, 0.22)");
    gradient.addColorStop(1, i === 0 ? "rgba(255, 207, 90, 0.58)" : "rgba(89, 214, 255, 0.42)");
    ctx.globalAlpha = i === 0 ? 0.72 : 0.56;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = i === 0 ? 2.2 : 1.15;
    ctx.beginPath();
    ctx.moveTo(far, visualHorizon);
    ctx.bezierCurveTo(
      center + laneRatio * 58,
      canvas.height * 0.36,
      center + laneRatio * 210,
      canvas.height * 0.7,
      near,
      bottom,
    );
    ctx.stroke();
  }

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "rgba(247, 251, 255, 0.28)";
  for (let j = 0; j < 7; j += 1) {
    const y = ((time * 0.07 + j * 190) % (bottom - visualHorizon)) + visualHorizon;
    const t = (y - visualHorizon) / (bottom - visualHorizon);
    const half = 28 + t * 520;
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

  if (drawSprite("player", player.x, player.y - 10, 140, 158, 0, 1)) {
    ctx.save();
    ctx.globalAlpha = 0.58;
    const flameX = player.x;
    const flameTop = player.y + 44;
    const trail = ctx.createLinearGradient(flameX, flameTop, flameX, player.y + 160);
    trail.addColorStop(0, "#f7fbff");
    trail.addColorStop(0.25, "#ffcf5a");
    trail.addColorStop(0.68, "#ff4e80");
    trail.addColorStop(1, "rgba(89, 214, 255, 0)");
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.moveTo(flameX - 21, flameTop);
    ctx.quadraticCurveTo(flameX, player.y + 148 + Math.sin(time * 0.01) * 9, flameX + 21, flameTop);
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
