const ROWS = 9;
const COLS = 9;
const MINE_COUNT = 10;
const SAFE_CELLS = ROWS * COLS - MINE_COUNT;

const boardElement = document.getElementById("board");
const mineCountElement = document.getElementById("mine-count");
const timerElement = document.getElementById("timer");
const statusElement = document.getElementById("status");
const restartButton = document.getElementById("restart");

let board = [];
let firstClick = true;
let gameOver = false;
let flagsPlaced = 0;
let revealedCount = 0;
let elapsedSeconds = 0;
let timerId = null;
let explodedCellKey = "";

function cellKey(row, col) {
  return `${row}-${col}`;
}

function formatCounter(value) {
  if (value < 0) {
    return `-${String(Math.abs(value)).padStart(2, "0")}`;
  }

  return String(value).padStart(3, "0");
}

function updateMineCounter() {
  mineCountElement.textContent = formatCounter(MINE_COUNT - flagsPlaced);
}

function updateTimer() {
  timerElement.textContent = formatCounter(elapsedSeconds);
}

function setStatus(message) {
  statusElement.textContent = message;
}

function setFace(emoji) {
  restartButton.textContent = emoji;
}

function startTimer() {
  if (timerId) {
    return;
  }

  timerId = window.setInterval(() => {
    elapsedSeconds = Math.min(elapsedSeconds + 1, 999);
    updateTimer();
  }, 1000);
}

function stopTimer() {
  if (!timerId) {
    return;
  }

  window.clearInterval(timerId);
  timerId = null;
}

function createCell(row, col) {
  return {
    row,
    col,
    isMine: false,
    isOpen: false,
    isFlagged: false,
    adjacentMines: 0
  };
}

function createBoardState() {
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => createCell(row, col))
  );
}

function inBounds(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function getNeighbors(row, col) {
  const neighbors = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;

      if (inBounds(nextRow, nextCol)) {
        neighbors.push(board[nextRow][nextCol]);
      }
    }
  }

  return neighbors;
}

// 首击安全：将首个点击点及其周围 3x3 区域排除在雷区之外。
function placeMines(safeRow, safeCol) {
  const excluded = new Set([cellKey(safeRow, safeCol)]);

  getNeighbors(safeRow, safeCol).forEach((cell) => {
    excluded.add(cellKey(cell.row, cell.col));
  });

  let placed = 0;

  while (placed < MINE_COUNT) {
    const row = Math.floor(Math.random() * ROWS);
    const col = Math.floor(Math.random() * COLS);
    const currentCell = board[row][col];
    const key = cellKey(row, col);

    if (currentCell.isMine || excluded.has(key)) {
      continue;
    }

    currentCell.isMine = true;
    placed += 1;
  }

  board.flat().forEach((cell) => {
    if (cell.isMine) {
      return;
    }

    cell.adjacentMines = getNeighbors(cell.row, cell.col).filter((neighbor) => neighbor.isMine).length;
  });
}

function revealSingleCell(cell) {
  if (cell.isOpen || cell.isFlagged) {
    return false;
  }

  cell.isOpen = true;

  if (!cell.isMine) {
    revealedCount += 1;
  }

  return true;
}

function floodReveal(startCell) {
  const queue = [startCell];

  while (queue.length > 0) {
    const cell = queue.shift();

    if (!cell || !revealSingleCell(cell)) {
      continue;
    }

    if (cell.adjacentMines > 0) {
      continue;
    }

    getNeighbors(cell.row, cell.col).forEach((neighbor) => {
      if (!neighbor.isOpen && !neighbor.isFlagged && !neighbor.isMine) {
        queue.push(neighbor);
      }
    });
  }
}

function revealAllMines() {
  board.flat().forEach((cell) => {
    if (cell.isMine) {
      cell.isOpen = true;
    }
  });
}

function markWrongFlags() {
  board.flat().forEach((cell) => {
    if (cell.isFlagged && !cell.isMine) {
      cell.isOpen = true;
    }
  });
}

function checkWin() {
  if (revealedCount !== SAFE_CELLS) {
    return;
  }

  gameOver = true;
  stopTimer();
  setFace("😎");
  setStatus("恭喜，你已清除全部安全区域！");

  board.flat().forEach((cell) => {
    if (cell.isMine && !cell.isFlagged) {
      cell.isFlagged = true;
      flagsPlaced += 1;
    }
  });

  updateMineCounter();
  renderBoard();
}

function loseGame(triggerCell) {
  gameOver = true;
  explodedCellKey = cellKey(triggerCell.row, triggerCell.col);
  stopTimer();
  revealAllMines();
  markWrongFlags();
  setFace("😵");
  setStatus("踩到地雷了，点击重新开始再来一局。\u201d);
  renderBoard();
}

function revealCell(row, col) {
  if (gameOver) {
    return;
  }

  const cell = board[row][col];

  if (cell.isOpen || cell.isFlagged) {
    return;
  }

  if (firstClick) {
    placeMines(row, col);
    firstClick = false;
    startTimer();
    setStatus("扫雷进行中，注意数字提示。\u201d);
  }

  if (cell.isMine) {
    cell.isOpen = true;
    loseGame(cell);
    return;
  }

  floodReveal(cell);
  renderBoard();
  checkWin();
}

function toggleFlag(row, col) {
  if (gameOver) {
    return;
  }

  const cell = board[row][col];

  if (cell.isOpen) {
    return;
  }

  cell.isFlagged = !cell.isFlagged;
  flagsPlaced += cell.isFlagged ? 1 : -1;

  updateMineCounter();
  renderBoard();

  if (firstClick) {
    setStatus("已插旗；左键点击任意格子开始。\u201d);
  }
}

function getCellDisplay(cell) {
  if (cell.isFlagged && !cell.isOpen) {
    return "🚩";
  }

  if (cell.isMine && cell.isOpen) {
    return "💣";
  }

  if (!cell.isOpen || cell.adjacentMines === 0) {
    return "";
  }

  return String(cell.adjacentMines);
}

function getCellClasses(cell) {
  const classes = ["cell"];

  if (cell.isOpen) {
    classes.push("cell--open");
  }

  if (cell.isFlagged && !cell.isOpen) {
    classes.push("cell--flagged");
  }

  if (cell.isOpen && cell.isMine) {
    classes.push("cell--mine");
  }

  if (cell.isOpen && !cell.isMine && cell.adjacentMines === 0) {
    classes.push("cell--empty");
  }

  if (cell.isFlagged && cell.isOpen && !cell.isMine) {
    classes.push("cell--wrong-flag");
  }

  if (cell.adjacentMines > 0 && cell.isOpen && !cell.isMine) {
    classes.push(`number-${cell.adjacentMines}`);
  }

  if (explodedCellKey === cellKey(cell.row, cell.col)) {
    classes.push("cell--exploded");
  }

  return classes.join(" ");
}

function getAriaLabel(cell) {
  if (cell.isFlagged && !cell.isOpen) {
    return `第 ${cell.row + 1} 行第 ${cell.col + 1} 列，已标记旗帜`;
  }

  if (!cell.isOpen) {
    return `第 ${cell.row + 1} 行第 ${cell.col + 1} 列，未揭开`;
  }

  if (cell.isMine) {
    return `第 ${cell.row + 1} 行第 ${cell.col + 1} 列，地雷`;
  }

  if (cell.adjacentMines === 0) {
    return `第 ${cell.row + 1} 行第 ${cell.col + 1} 列，空白`;
  }

  return `第 ${cell.row + 1} 行第 ${cell.col + 1} 列，周围 ${cell.adjacentMines} 个地雷`;
}

function renderBoard() {
  boardElement.innerHTML = board
    .flat()
    .map((cell) => {
      const label = getAriaLabel(cell);
      const content = getCellDisplay(cell);

      return `
        <button
          class="${getCellClasses(cell)}"
          data-row="${cell.row}"
          data-col="${cell.col}"
          type="button"
          role="gridcell"
          aria-label="${label}"
        >${content}</button>
      `;
    })
    .join("");
}

function resetGame() {
  stopTimer();
  board = createBoardState();
  firstClick = true;
  gameOver = false;
  flagsPlaced = 0;
  revealedCount = 0;
  elapsedSeconds = 0;
  explodedCellKey = "";

  updateMineCounter();
  updateTimer();
  setFace("🙂");
  setStatus("点击任意格子开始，首击必定安全。\u201d);
  renderBoard();
}

boardElement.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-row][data-col]");

  if (!button) {
    return;
  }

  const row = Number(button.dataset.row);
  const col = Number(button.dataset.col);
  revealCell(row, col);
});

boardElement.addEventListener("contextmenu", (event) => {
  const button = event.target.closest("button[data-row][data-col]");

  if (!button) {
    return;
  }

  event.preventDefault();

  const row = Number(button.dataset.row);
  const col = Number(button.dataset.col);
  toggleFlag(row, col);
});

restartButton.addEventListener("click", resetGame);

resetGame();
