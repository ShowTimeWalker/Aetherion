const GRID_SIZE = 4;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;
const STORAGE_KEY = "aetherion-2048-best";
const SWIPE_THRESHOLD = 24;

const boardNode = document.getElementById("board");
const scoreNode = document.getElementById("score");
const bestScoreNode = document.getElementById("best-score");
const statusNode = document.getElementById("status");
const restartButton = document.getElementById("restart");

const tiles = [];

let board = Array(CELL_COUNT).fill(0);
let score = 0;
let bestScore = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) ?? "0", 10) || 0;
let hasWon = false;
let isGameOver = false;
let touchStartX = 0;
let touchStartY = 0;

function indexFor(row, col) {
  return row * GRID_SIZE + col;
}

function setStatus(message) {
  statusNode.textContent = message;
}

function updateScoreboard() {
  scoreNode.textContent = String(score);
  bestScoreNode.textContent = String(bestScore);
}

function getEmptyIndices() {
  return board.reduce((indices, value, index) => {
    if (value === 0) {
      indices.push(index);
    }

    return indices;
  }, []);
}

function spawnTile() {
  const emptyIndices = getEmptyIndices();

  if (emptyIndices.length === 0) {
    return false;
  }

  const targetIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  board[targetIndex] = Math.random() < 0.9 ? 2 : 4;
  return true;
}

function buildBoard() {
  for (let index = 0; index < CELL_COUNT; index += 1) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.setAttribute("role", "gridcell");
    boardNode.append(tile);
    tiles.push(tile);
  }
}

function tileClassFor(value) {
  if (value <= 0) {
    return "tile";
  }

  if (value > 2048) {
    return "tile tile--filled tile--super";
  }

  return `tile tile--filled tile--${value}`;
}

function render() {
  board.forEach((value, index) => {
    const tile = tiles[index];
    tile.className = tileClassFor(value);
    tile.textContent = value > 0 ? String(value) : "";
    tile.setAttribute("aria-label", value > 0 ? `数字 ${value}` : "空白");
  });

  updateScoreboard();
}

function processLine(line) {
  const values = line.filter((value) => value !== 0);
  const merged = [];
  let gained = 0;

  for (let index = 0; index < values.length; index += 1) {
    const currentValue = values[index];
    const nextValue = values[index + 1];

    if (currentValue === nextValue) {
      const mergedValue = currentValue * 2;
      merged.push(mergedValue);
      gained += mergedValue;
      index += 1;
    } else {
      merged.push(currentValue);
    }
  }

  while (merged.length < GRID_SIZE) {
    merged.push(0);
  }

  const changed = merged.some((value, index) => value !== line[index]);
  return { merged, gained, changed };
}

function getLine(position, direction) {
  const values = [];

  for (let offset = 0; offset < GRID_SIZE; offset += 1) {
    if (direction === "left" || direction === "right") {
      values.push(board[indexFor(position, offset)]);
    } else {
      values.push(board[indexFor(offset, position)]);
    }
  }

  return direction === "right" || direction === "down" ? values.reverse() : values;
}

function writeLine(position, direction, values) {
  const normalizedValues =
    direction === "right" || direction === "down" ? [...values].reverse() : values;

  for (let offset = 0; offset < GRID_SIZE; offset += 1) {
    if (direction === "left" || direction === "right") {
      board[indexFor(position, offset)] = normalizedValues[offset];
    } else {
      board[indexFor(offset, position)] = normalizedValues[offset];
    }
  }
}

function hasAvailableMoves() {
  if (getEmptyIndices().length > 0) {
    return true;
  }

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const current = board[indexFor(row, col)];
      const right = col < GRID_SIZE - 1 ? board[indexFor(row, col + 1)] : null;
      const down = row < GRID_SIZE - 1 ? board[indexFor(row + 1, col)] : null;

      if (current === right || current === down) {
        return true;
      }
    }
  }

  return false;
}

function finishMove(moved, gained) {
  if (!moved) {
    setStatus("这个方向无法移动，试试别的方向。");
    return;
  }

  score += gained;

  if (score > bestScore) {
    bestScore = score;
    window.localStorage.setItem(STORAGE_KEY, String(bestScore));
  }

  spawnTile();
  render();

  if (!hasWon && board.some((value) => value === 2048)) {
    hasWon = true;
    setStatus("已合成 2048，继续挑战更高分。");
    return;
  }

  if (!hasAvailableMoves()) {
    isGameOver = true;
    setStatus("没有可移动的位置了，点击重新开始。");
    return;
  }

  setStatus(gained > 0 ? `本次合并得分 ${gained}。` : "继续合并，冲击 2048。");
}

function move(direction) {
  if (isGameOver) {
    return;
  }

  let moved = false;
  let gained = 0;

  for (let position = 0; position < GRID_SIZE; position += 1) {
    const line = getLine(position, direction);
    const result = processLine(line);
    writeLine(position, direction, result.merged);
    moved = moved || result.changed;
    gained += result.gained;
  }

  finishMove(moved, gained);
}

function resetGame() {
  board = Array(CELL_COUNT).fill(0);
  score = 0;
  hasWon = false;
  isGameOver = false;
  spawnTile();
  spawnTile();
  setStatus("合并数字，尽快做出 2048。");
  render();
}

function directionFromKey(key) {
  switch (key) {
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    default:
      return null;
  }
}

function handleTouchStart(event) {
  const [touch] = event.changedTouches;
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}

function handleTouchEnd(event) {
  const [touch] = event.changedTouches;
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (Math.abs(deltaX) < SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD) {
    return;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    move(deltaX > 0 ? "right" : "left");
    return;
  }

  move(deltaY > 0 ? "down" : "up");
}

window.addEventListener("keydown", (event) => {
  const direction = directionFromKey(event.key);

  if (!direction) {
    return;
  }

  event.preventDefault();
  move(direction);
});

boardNode.addEventListener("touchstart", handleTouchStart, { passive: true });
boardNode.addEventListener("touchend", handleTouchEnd, { passive: true });
restartButton.addEventListener("click", resetGame);

buildBoard();
updateScoreboard();
resetGame();
