const canvas = document.getElementById("board");
const context = canvas.getContext("2d");
const scoreNode = document.getElementById("score");
const statusNode = document.getElementById("status");
const restartButton = document.getElementById("restart");

const gridSize = 25;
const cellSize = canvas.width / gridSize;

const directions = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }
};

let snake;
let direction;
let queuedDirection;
let food;
let score;
let loopId;
let started;

function randomFood() {
  while (true) {
    const candidate = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };

    const occupied = snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y);

    if (!occupied) {
      return candidate;
    }
  }
}

function updateStatus(message) {
  statusNode.textContent = message;
}

function updateScore() {
  scoreNode.textContent = String(score);
}

function resetGame() {
  snake = [
    { x: 12, y: 12 },
    { x: 11, y: 12 },
    { x: 10, y: 12 }
  ];
  direction = { x: 1, y: 0 };
  queuedDirection = direction;
  food = randomFood();
  score = 0;
  started = false;
  updateScore();
  updateStatus("按下方向键开始。");
  draw();
}

function endGame() {
  clearInterval(loopId);
  loopId = null;
  started = false;
  updateStatus("游戏结束，点击重新开始再来一局。");
}

function drawCell(x, y, color, radius = 6) {
  context.fillStyle = color;
  const px = x * cellSize;
  const py = y * cellSize;

  context.beginPath();
  context.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, radius);
  context.fill();
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  drawCell(food.x, food.y, "#8df1c1", 10);

  snake.forEach((segment, index) => {
    drawCell(segment.x, segment.y, index === 0 ? "#f7dd8d" : "#4fd1a5");
  });
}

function tick() {
  direction = queuedDirection;
  const head = snake[0];
  const nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y
  };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.x >= gridSize ||
    nextHead.y < 0 ||
    nextHead.y >= gridSize;

  const hitSelf = snake.some(
    (segment) => segment.x === nextHead.x && segment.y === nextHead.y
  );

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(nextHead);

  if (nextHead.x === food.x && nextHead.y === food.y) {
    score += 10;
    updateScore();
    updateStatus("吃到了，加速前进。");
    food = randomFood();
  } else {
    snake.pop();
  }

  draw();
}

function ensureLoop() {
  if (loopId) {
    return;
  }

  loopId = window.setInterval(tick, 120);
}

window.addEventListener("keydown", (event) => {
  const nextDirection = directions[event.key];

  if (!nextDirection) {
    return;
  }

  event.preventDefault();

  const isReverse =
    nextDirection.x === -direction.x && nextDirection.y === -direction.y;

  if (isReverse) {
    return;
  }

  queuedDirection = nextDirection;

  if (!started) {
    started = true;
    updateStatus("游戏进行中。");
    ensureLoop();
  }
});

restartButton.addEventListener("click", () => {
  clearInterval(loopId);
  loopId = null;
  resetGame();
});

resetGame();

