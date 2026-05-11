function drawClearingGate(time) {
  if (state.mode !== "clearing") return;
  const progress = 1 - Math.max(0, state.clearTimer) / 2.35;
  const level = levels[state.levelIndex];
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height * 0.34);
  ctx.strokeStyle = level.colors[2];
  ctx.shadowColor = level.colors[2];
  ctx.shadowBlur = 40;
  ctx.lineWidth = 10;
  for (let i = 0; i < 4; i += 1) {
    ctx.rotate(time * 0.001 + i);
    ctx.beginPath();
    ctx.ellipse(0, 0, 112 + i * 32 + progress * 70, 44 + i * 18, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function render(time) {
  const drawsGameWorld = state.mode === "playing" || state.mode === "clearing";
  if (!drawsGameWorld) {
    ctx.fillStyle = "#050814";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${state.flash * 0.24})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return;
  }

  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake * 18, (Math.random() - 0.5) * state.shake * 18);
  }
  drawBackground(time);
  drawClearingGate(time);
  drawCores();
  drawShards();
  drawPowerups();
  drawGates();
  drawMissiles();
  drawHazards();
  drawMines();
  drawParticles();
  drawPlayer(time);
  ctx.restore();

  if (state.mode === "playing" && state.energy >= 100) {
    ctx.save();
    ctx.globalAlpha = 0.2 + Math.sin(time * 0.01) * 0.08;
    ctx.strokeStyle = "#59d6ff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, 72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (state.shield > 0) {
    ctx.save();
    ctx.globalAlpha = 0.32 + Math.sin(time * 0.012) * 0.08;
    ctx.strokeStyle = "#59d6ff";
    ctx.shadowColor = "#59d6ff";
    ctx.shadowBlur = 24;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${state.flash * 0.36})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function loop(time) {
  const targetFps = state.mode === "playing" || state.mode === "clearing" ? 30 : 18;
  if (time - lastFrameTime < 1000 / targetFps) {
    requestAnimationFrame(loop);
    return;
  }
  lastFrameTime = time;
  const dt = Math.min(0.033, (time - state.lastTime) / 1000 || 0);
  state.lastTime = time;
  update(dt, time);
  render(time);
  requestAnimationFrame(loop);
}

function updateJoystick(event) {
  const rect = ui.joystick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const maxDistance = rect.width * 0.34;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const clamped = Math.min(maxDistance, distance);
  const angle = Math.atan2(dy, dx);
  const knobX = Math.cos(angle) * clamped;
  const knobY = Math.sin(angle) * clamped;
  const strength = maxDistance > 0 ? clamped / maxDistance : 0;
  state.joystickVector.x = Math.cos(angle) * strength;
  state.joystickVector.y = Math.sin(angle) * strength;
  ui.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
}

function resetJoystick() {
  state.joystickActive = false;
  state.joystickPointerId = null;
  state.joystickVector.x = 0;
  state.joystickVector.y = 0;
  ui.joystickKnob.style.transform = "translate(-50%, -50%)";
}

ui.joystick.addEventListener("pointerdown", (event) => {
  if (state.mode !== "playing") return;
  state.joystickActive = true;
  state.joystickPointerId = event.pointerId;
  ui.joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
});

ui.joystick.addEventListener("pointermove", (event) => {
  if (!state.joystickActive || state.joystickPointerId !== event.pointerId || state.mode !== "playing") return;
  updateJoystick(event);
});

ui.joystick.addEventListener("pointerup", resetJoystick);
ui.joystick.addEventListener("pointercancel", resetJoystick);

document.getElementById("startButton").addEventListener("click", () => {
  unlockAudio();
  playTone("tap");
  prepareLevel(0);
  setMode("level");
});

document.getElementById("levelButton").addEventListener("click", () => {
  unlockAudio();
  startLevel();
});
ui.tutorialButton.addEventListener("click", () => {
  unlockAudio();
  setMode("tutorial");
  playTone("tap");
});
ui.tutorialBackButton.addEventListener("click", () => {
  unlockAudio();
  setMode("start");
  playTone("tap");
});
ui.pulseButton.addEventListener("click", activatePulse);
ui.pauseButton.addEventListener("click", pauseGame);
ui.resumeButton.addEventListener("click", resumeGame);
ui.restartButton.addEventListener("click", () => {
  unlockAudio();
  prepareLevel(state.levelIndex);
  setMode("level");
  playTone("tap");
});
ui.soundButton.addEventListener("click", () => {
  unlockAudio();
  state.muted = !state.muted;
  ui.soundButton.classList.toggle("sound-button--muted", state.muted);
  ui.soundButton.textContent = state.muted ? "×" : "♪";
  if (state.muted) stopAmbientMusic();
  if (!state.muted) {
    ensureAmbientMusic();
    playTone("tap");
  }
});

ui.nextButton.addEventListener("click", () => {
  unlockAudio();
  const next = state.levelIndex + 1;
  prepareLevel(next >= levels.length ? 0 : next);
  setMode("level");
  playTone("tap");
});

ui.playFinalVideoButton.addEventListener("click", () => {
  if (!ui.finalVideo) return;
  ui.finalVideo.muted = false;
  ui.finalVideo.volume = 1;
  ui.playFinalVideoButton.hidden = true;
  ui.finalVideoOverlay.classList.add("final-video-overlay--loading");
  const playPromise = ui.finalVideo.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      ui.playFinalVideoButton.hidden = false;
      ui.finalVideoOverlay.classList.add("final-video-overlay--needs-tap");
    });
  }
});

ui.skipFinalVideoButton.addEventListener("click", () => {
  if (ui.finalVideo) ui.finalVideo.pause();
  ui.finalVideoOverlay.classList.remove("final-video-overlay--active");
  ui.finalVideoOverlay.classList.remove("final-video-overlay--needs-tap");
  showResult();
});

document.getElementById("retryButton").addEventListener("click", () => {
  unlockAudio();
  prepareLevel(state.levelIndex);
  setMode("level");
  playTone("tap");
});

window.addEventListener("resize", () => render(performance.now()));
window.addEventListener("contextmenu", (event) => event.preventDefault());

initBackdrop();
loadAssets();
prepareLevel(0);
showScreen("start");
requestAnimationFrame(loop);
