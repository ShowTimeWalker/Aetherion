const STORAGE_KEY = "aetherion-flappy-bird-best";
const PIPE_WIDTH = 78;
const PIPE_GAP = 180;
const PIPE_INTERVAL = 1.45;
const PIPE_SPEED = 170;
const GRAVITY = 980;
const FLAP_VELOCITY = -320;
const BIRD_X = 108;
const BIRD_RADIUS = 20;
const GROUND_HEIGHT = 110;

const canvas = document.getElementById("board");
const context = canvas.getContext("2d");
const scoreNode = document.getElementById("score");
const bestScoreNode = document.getElementById("best-score");
const statusNode = document.getElementById("status");
const restartButton = document.getElementById("restart");

let bird;
let pipes;
let score = 0;
let bestScore = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) ?? "0", 10) || 0;
let spawnTimer = 0;
let started = false;
let gameOver = false;
let lastTime = 0;
let hoverTime = 0;

function setStatus(message) {
  statusNode.textContent = message;
}

function updateScoreboard() {
  scoreNode.textContent = String(score);
  bestScoreNode.textContent = String(bestScore);
}

function resetGame() {
  bird = {
    x: BIRD_X,
    y: canvas.height * 0.38,
    baseY: canvas.height * 0.38,
    velocity: 0,
    rotation: 0
  };
  pipes = [];
  score = 0;
  spawnTimer = 0;
  started = false;
  gameOver = false;
  hoverTime = 0;
  setStatus("等待起飞，按空格或点击画布开始。");
  updateScoreboard();
  render();
}

function spawnPipe() {
  const margin = 110;
  const minGapY = margin + PIPE_GAP / 2;
  const maxGapY = canvas.height - GROUND_HEIGHT - margin - PIPE_GAP / 2;
  const gapY = minGapY + Math.random() * (maxGapY - minGapY);

  pipes.push({
    x: canvas.width + PIPE_WIDTH,
    gapY,
    passed: false
  });
}

function flap() {
  if (gameOver) {
    return;
  }

  if (!started) {
    started = true;
    setStatus("飞行中，保持节奏穿过管道。");
  }

  bird.velocity = FLAP_VELOCITY;
}

function endGame() {
  if (gameOver) {
    return;
  }

  gameOver = true;
  started = false;
  setStatus("撞上了，点击重新开始再来一局。");
}

function checkCollision(pipe) {
  const pipeLeft = pipe.x;
  const pipeRight = pipe.x + PIPE_WIDTH;
  const birdLeft = bird.x - BIRD_RADIUS;
  const birdRight = bird.x + BIRD_RADIUS;

  if (birdRight < pipeLeft || birdLeft > pipeRight) {
    return false;
  }

  const gapTop = pipe.gapY - PIPE_GAP / 2;
  const gapBottom = pipe.gapY + PIPE_GAP / 2;
  const birdTop = bird.y - BIRD_RADIUS;
  const birdBottom = bird.y + BIRD_RADIUS;

  return birdTop < gapTop || birdBottom > gapBottom;
}

function update(deltaSeconds) {
  if (gameOver) {
    render();
    return;
  }

  if (!started) {
    hoverTime += deltaSeconds;
    bird.y = bird.baseY + Math.sin(hoverTime * 4.2) * 8;
    bird.rotation = -0.12;
    render();
    return;
  }

  bird.velocity += GRAVITY * deltaSeconds;
  bird.y += bird.velocity * deltaSeconds;
  bird.rotation = Math.max(-0.55, Math.min(1.2, bird.velocity / 380));

  spawnTimer += deltaSeconds;

  if (spawnTimer >= PIPE_INTERVAL) {
    spawnTimer = 0;
    spawnPipe();
  }

  pipes.forEach((pipe) => {
    pipe.x -= PIPE_SPEED * deltaSeconds;

    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      score += 1;

      if (score > bestScore) {
        bestScore = score;
        window.localStorage.setItem(STORAGE_KEY, String(bestScore));
      }

      updateScoreboard();
      setStatus(`已穿过 ${score} 根管道。`);
    }

    if (checkCollision(pipe)) {
      endGame();
    }
  });

  pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -8);

  if (bird.y - BIRD_RADIUS <= 0 || bird.y + BIRD_RADIUS >= canvas.height - GROUND_HEIGHT) {
    endGame();
  }

  render();
}

function drawBackground() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  const skyGradient = context.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, "#a8e7ff");
  skyGradient.addColorStop(0.52, "#70c6ff");
  skyGradient.addColorStop(0.52, "#91de72");
  skyGradient.addColorStop(1, "#4fa955");
  context.fillStyle = skyGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255, 255, 255, 0.55)";
  [
    [80, 110, 34],
    [240, 150, 28],
    [356, 90, 26]
  ].forEach(([x, y, radius]) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.arc(x + radius * 0.9, y + 4, radius * 0.72, 0, Math.PI * 2);
    context.arc(x - radius * 0.8, y + 7, radius * 0.62, 0, Math.PI * 2);
    context.fill();
  });

  context.fillStyle = "#6db248";
  context.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
  context.fillStyle = "#84c75c";
  context.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, 22);
}

function drawPipe(pipe) {
  const gapTop = pipe.gapY - PIPE_GAP / 2;
  const gapBottom = pipe.gapY + PIPE_GAP / 2;

  context.fillStyle = "#4bbf53";
  context.strokeStyle = "#2b7d31";
  context.lineWidth = 4;

  const segments = [
    { x: pipe.x, y: 0, width: PIPE_WIDTH, height: gapTop },
    {
      x: pipe.x,
      y: gapBottom,
      width: PIPE_WIDTH,
      height: canvas.height - GROUND_HEIGHT - gapBottom
    }
  ];

  segments.forEach((segment) => {
    context.fillRect(segment.x, segment.y, segment.width, segment.height);
    context.strokeRect(segment.x, segment.y, segment.width, segment.height);

    const capY = segment.y === 0 ? segment.height - 22 : segment.y;
    context.fillRect(segment.x - 8, capY, segment.width + 16, 22);
    context.strokeRect(segment.x - 8, capY, segment.width + 16, 22);
  });
}

function drawBird() {
  context.save();
  context.translate(bird.x, bird.y);
  context.rotate(bird.rotation);

  context.fillStyle = "#ffd24a";
  context.beginPath();
  context.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ffb019";
  context.beginPath();
  context.ellipse(-4, 5, 11, 8, -0.3, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ff7c3b";
  context.beginPath();
  context.moveTo(BIRD_RADIUS - 3, -2);
  context.lineTo(BIRD_RADIUS + 15, 4);
  context.lineTo(BIRD_RADIUS - 3, 10);
  context.closePath();
  context.fill();

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(6, -7, 7, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#1f2a37";
  context.beginPath();
  context.arc(8, -7, 3, 0, Math.PI * 2);
  context.fill();

  context.restore();
}

function drawOverlay() {
  if (!started && !gameOver) {
    context.fillStyle = "rgba(15, 40, 66, 0.26)";
    context.fillRect(22, 24, canvas.width - 44, 94);
    context.fillStyle = "#ffffff";
    context.font = '700 34px "Palatino Linotype", "Times New Roman", serif';
    context.textAlign = "center";
    context.fillText("Tap To Fly", canvas.width / 2, 60);
    context.font = '500 18px "Trebuchet MS", "Microsoft YaHei UI", sans-serif';
    context.fillText("按空格或点击画布开始", canvas.width / 2, 92);
  }

  if (gameOver) {
    context.fillStyle = "rgba(8, 30, 50, 0.48)";
    context.fillRect(26, 188, canvas.width - 52, 152);
    context.fillStyle = "#ffffff";
    context.font = '700 40px "Palatino Linotype", "Times New Roman", serif';
    context.textAlign = "center";
    context.fillText("Game Over", canvas.width / 2, 240);
    context.font = '500 18px "Trebuchet MS", "Microsoft YaHei UI", sans-serif';
    context.fillText(`本局得分 ${score}`, canvas.width / 2, 276);
    context.fillText("点击重新开始继续挑战", canvas.width / 2, 308);
  }
}

function render() {
  drawBackground();
  pipes.forEach(drawPipe);
  drawBird();
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

function handlePointer(event) {
  event.preventDefault();
  flap();
}

window.addEventListener("keydown", (event) => {
  if (event.code !== "Space") {
    return;
  }

  event.preventDefault();
  flap();
});

canvas.addEventListener("pointerdown", handlePointer);
restartButton.addEventListener("click", resetGame);

updateScoreboard();
resetGame();
window.requestAnimationFrame(loop);
