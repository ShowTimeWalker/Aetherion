const STORAGE_KEY = "aetherion-jump-game-best";
const GRAVITY = 980;
const MAX_CHARGE_TIME = 1.2;
const MIN_JUMP_VELOCITY = 280;
const MAX_JUMP_VELOCITY = 680;
const JUMP_ANGLE = Math.PI / 4;
const PLATFORM_WIDTH = 80;
const PLATFORM_HEIGHT = 20;
const PLAYER_SIZE = 32;
const MIN_PLATFORM_DISTANCE = 120;
const MAX_PLATFORM_DISTANCE = 280;

const canvas = document.getElementById("board");
const context = canvas.getContext("2d");
const scoreNode = document.getElementById("score");
const bestScoreNode = document.getElementById("best-score");
const statusNode = document.getElementById("status");
const restartButton = document.getElementById("restart");

let player;
let platforms;
let currentPlatform;
let score = 0;
let bestScore = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) ?? "0", 10) || 0;
let isCharging = false;
let chargeTime = 0;
let isJumping = false;
let gameOver = false;
let lastTime = 0;
let particles = [];

function setStatus(message) {
  statusNode.textContent = message;
}

function updateScoreboard() {
  scoreNode.textContent = String(score);
  bestScoreNode.textContent = String(bestScore);
}

function createPlatform(x, y) {
  return {
    x: x,
    y: y,
    width: PLATFORM_WIDTH,
    height: PLATFORM_HEIGHT,
    color: getRandomPlatformColor()
  };
}

function getRandomPlatformColor() {
  const colors = [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
    "#e67e22"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function resetGame() {
  const firstPlatformX = canvas.width / 2 - PLATFORM_WIDTH / 2;
  const firstPlatformY = canvas.height - 100;

  currentPlatform = createPlatform(firstPlatformX, firstPlatformY);
  currentPlatform.color = "#e67e22";

  player = {
    x: currentPlatform.x + PLATFORM_WIDTH / 2,
    y: currentPlatform.y - PLAYER_SIZE / 2,
    vx: 0,
    vy: 0,
    rotation: 0,
    scale: 1
  };

  platforms = [currentPlatform];
  particles = [];
  score = 0;
  isCharging = false;
  chargeTime = 0;
  isJumping = false;
  gameOver = false;
  setStatus("准备开始，按住画布蓄力。");
  updateScoreboard();
  render();
}

function spawnPlatform() {
  const distance = MIN_PLATFORM_DISTANCE + Math.random() * (MAX_PLATFORM_DISTANCE - MIN_PLATFORM_DISTANCE);
  const direction = Math.random() > 0.5 ? 1 : -1;
  const newX = currentPlatform.x + direction * distance;
  const newY = currentPlatform.y - (50 + Math.random() * 80);

  const clampedX = Math.max(20, Math.min(canvas.width - PLATFORM_WIDTH - 20, newX));
  const clampedY = Math.max(100, Math.min(canvas.height - 150, newY));

  const newPlatform = createPlatform(clampedX, clampedY);
  platforms.push(newPlatform);

  while (platforms.length > 5) {
    platforms.shift();
  }

  return newPlatform;
}

function startCharge() {
  if (isJumping || gameOver) {
    return;
  }

  isCharging = true;
  chargeTime = 0;
  player.scale = 0.7;
  setStatus("蓄力中...");
}

function releaseCharge() {
  if (!isCharging || isJumping || gameOver) {
    return;
  }

  isCharging = false;
  isJumping = true;

  const chargeRatio = Math.min(chargeTime / MAX_CHARGE_TIME, 1);
  const velocityMagnitude = MIN_JUMP_VELOCITY + chargeRatio * (MAX_JUMP_VELOCITY - MIN_JUMP_VELOCITY);

  player.vx = velocityMagnitude * Math.cos(JUMP_ANGLE) * 0.7;
  player.vy = -velocityMagnitude * Math.sin(JUMP_ANGLE) * 1.8;

  player.scale = 1;
  setStatus("跳跃中...");

  createParticles(player.x, player.y + PLAYER_SIZE / 2, 10);
}

function createParticles(x, y, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 200,
      vy: Math.random() * -150,
      life: 1,
      color: getRandomPlatformColor()
    });
  }
}

function checkLanding() {
  if (player.vy <= 0) {
    return;
  }

  const playerBottom = player.y + PLAYER_SIZE / 2;

  for (let i = platforms.length - 1; i >= 0; i--) {
    const platform = platforms[i];

    if (
      playerBottom >= platform.y &&
      playerBottom <= platform.y + PLATFORM_HEIGHT &&
      player.x >= platform.x - PLAYER_SIZE / 2 &&
      player.x <= platform.x + PLATFORM_WIDTH + PLAYER_SIZE / 2
    ) {
      player.y = platform.y - PLAYER_SIZE / 2;
      player.vy = 0;
      player.vx = 0;
      player.rotation = 0;
      isJumping = false;

      if (platform !== currentPlatform) {
        score++;
        if (score > bestScore) {
          bestScore = score;
          window.localStorage.setItem(STORAGE_KEY, String(bestScore));
        }
        updateScoreboard();
        currentPlatform = platform;
        spawnPlatform();
        setStatus(`得分 ${score}，继续蓄力跳跃。`);
        createParticles(player.x, player.y + PLAYER_SIZE / 2, 5);
      } else {
        setStatus("继续蓄力跳跃。");
      }

      return true;
    }
  }

  return false;
}

function endGame() {
  if (gameOver) {
    return;
  }

  gameOver = true;
  isJumping = false;
  isCharging = false;
  setStatus("掉落了！点击重新开始再来一局。");
}

function update(deltaSeconds) {
  if (gameOver) {
    render();
    return;
  }

  if (isCharging && !isJumping) {
    chargeTime += deltaSeconds;
    const squish = 0.7 + Math.sin(chargeTime * 8) * 0.05;
    player.scale = squish;
  }

  if (isJumping) {
    player.vy += GRAVITY * deltaSeconds;
    player.x += player.vx * deltaSeconds;
    player.y += player.vy * deltaSeconds;
    player.rotation += deltaSeconds * 5;

    if (player.x < -PLAYER_SIZE || player.x > canvas.width + PLAYER_SIZE ||
        player.y > canvas.height + PLAYER_SIZE) {
      endGame();
      return;
    }

    if (!checkLanding() && player.vy > 0) {
      setStatus("注意落点...");
    }
  }

  particles.forEach((particle) => {
    particle.x += particle.vx * deltaSeconds;
    particle.y += particle.vy * deltaSeconds;
    particle.vy += GRAVITY * 0.5 * deltaSeconds;
    particle.life -= deltaSeconds * 2;
  });

  particles = particles.filter((particle) => particle.life > 0);

  render();
}

function drawBackground() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#b8d4e8");
  gradient.addColorStop(1, "#d4e4ed");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255, 255, 255, 0.3)";
  for (let i = 0; i < 5; i++) {
    const x = (i * 120 + 30) % canvas.width;
    const y = 50 + i * 100;
    context.beginPath();
    context.arc(x, y, 40, 0, Math.PI * 2);
    context.fill();
  }
}

function drawPlatform(platform, isActive) {
  context.save();

  context.fillStyle = platform.color;
  context.fillRect(platform.x, platform.y, platform.width, platform.height);

  context.fillStyle = "rgba(0, 0, 0, 0.2)";
  context.fillRect(platform.x, platform.y + platform.height, platform.width, 8);

  context.fillStyle = "rgba(255, 255, 255, 0.4)";
  context.fillRect(platform.x + 4, platform.y + 4, platform.width - 8, 4);

  context.strokeStyle = "rgba(0, 0, 0, 0.3)";
  context.lineWidth = 3;
  context.strokeRect(platform.x, platform.y, platform.width, platform.height);

  if (isActive) {
    context.fillStyle = "rgba(243, 156, 18, 0.3)";
    context.fillRect(platform.x - 4, platform.y - 4, platform.width + 8, platform.height + 8);
  }

  context.restore();
}

function drawPlayer() {
  context.save();
  context.translate(player.x, player.y);
  context.rotate(player.rotation);
  context.scale(player.scale, player.scale);

  context.fillStyle = "#e74c3c";
  context.beginPath();
  context.arc(0, 0, PLAYER_SIZE / 2, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(0, 0, 0, 0.2)";
  context.beginPath();
  context.arc(2, 2, PLAYER_SIZE / 2, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(-6, -6, 8, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#1a1a1a";
  context.beginPath();
  context.arc(-4, -4, 4, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(255, 255, 255, 0.3)";
  context.beginPath();
  context.arc(-10, -10, 4, 0, Math.PI * 2);
  context.fill();

  context.restore();
}

function drawChargeMeter() {
  if (!isCharging || isJumping) {
    return;
  }

  const chargeRatio = Math.min(chargeTime / MAX_CHARGE_TIME, 1);
  const meterWidth = 100;
  const meterHeight = 12;
  const meterX = player.x - meterWidth / 2;
  const meterY = player.y - PLAYER_SIZE - 20;

  context.fillStyle = "rgba(0, 0, 0, 0.5)";
  context.fillRect(meterX - 2, meterY - 2, meterWidth + 4, meterHeight + 4);

  context.fillStyle = "#ecf0f1";
  context.fillRect(meterX, meterY, meterWidth, meterHeight);

  const gradient = context.createLinearGradient(meterX, 0, meterX + meterWidth, 0);
  gradient.addColorStop(0, "#2ecc71");
  gradient.addColorStop(0.5, "#f39c12");
  gradient.addColorStop(1, "#e74c3c");
  context.fillStyle = gradient;
  context.fillRect(meterX, meterY, meterWidth * chargeRatio, meterHeight);

  context.strokeStyle = "#2c3e50";
  context.lineWidth = 2;
  context.strokeRect(meterX, meterY, meterWidth, meterHeight);
}

function drawParticles() {
  particles.forEach((particle) => {
    context.save();
    context.globalAlpha = particle.life;
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
    context.fill();
    context.restore();
  });
}

function drawOverlay() {
  if (!isCharging && !isJumping && !gameOver) {
    context.fillStyle = "rgba(44, 62, 80, 0.7)";
    context.fillRect(canvas.width / 2 - 120, 80, 240, 60);
    context.fillStyle = "#ffffff";
    context.font = 'bold 24px "Courier New", monospace';
    context.textAlign = "center";
    context.fillText("按住蓄力", canvas.width / 2, 118);
  }

  if (gameOver) {
    context.fillStyle = "rgba(44, 62, 80, 0.85)";
    context.fillRect(canvas.width / 2 - 140, canvas.height / 2 - 80, 280, 160);

    context.fillStyle = "#ffffff";
    context.font = 'bold 36px "Courier New", monospace';
    context.textAlign = "center";
    context.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 20);

    context.font = 'bold 20px "Courier New", monospace';
    context.fillText(`得分: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    context.font = '16px "Courier New", monospace';
    context.fillText("点击重新开始", canvas.width / 2, canvas.height / 2 + 50);
  }
}

function render() {
  drawBackground();
  platforms.forEach((platform) => drawPlatform(platform, platform === currentPlatform));
  drawPlayer();
  drawChargeMeter();
  drawParticles();
  drawOverlay();
}

function loop(timestamp) {
  if (!lastTime) {
    lastTime = timestamp;
  }

  const deltaSeconds = Math.min((timestamp - lastTime) / 1000, 0.032);
  lastTime = timestamp;
  update(deltaSeconds);
  window.requestAnimationFrame(loop);
}

function handlePointerDown(event) {
  event.preventDefault();
  startCharge();
}

function handlePointerUp(event) {
  event.preventDefault();
  releaseCharge();
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !event.repeat) {
    event.preventDefault();
    startCharge();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    releaseCharge();
  }
});

canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointerleave", handlePointerUp);
restartButton.addEventListener("click", resetGame);

updateScoreboard();
resetGame();
spawnPlatform();
window.requestAnimationFrame(loop);
