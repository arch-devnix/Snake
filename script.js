const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const debugEL = document.getElementById("debug");

const CELL = 30;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;

// ==Define now (infer reset() to change values)==
let snake;
let food;
let dir;
let nextDir;
let score;
let gameOver;
let win;
let paused;
let tickMs;
let lastTime;
let acc;
let best = Number(localStorage.getItem("snakeBest")) || 0;

// ==input==
window.addEventListener("keydown", e => {
  if (e.key === "Tab") {
    e.preventDefault();
    debugEL.toggleAttribute("hidden");
    return;
  }

  // pause toggle (only when alive and not paused-by-gameover)
  if ((e.key === " " || e.key === "Spacebar") && !gameOver) {
    e.preventDefault();
    paused = !paused;
    return;
  }

  if (gameOver) {
    if (e.key === "r" || e.key === "R") reset();
    return;
  }

  if (paused) {
    return;
  }

  let d = null;
  if (e.key === "ArrowUp"    || e.key === "w") d = { x: 0,  y: -1 };
  if (e.key === "ArrowDown"  || e.key === "s") d = { x: 0,  y: 1  };
  if (e.key === "ArrowLeft"  || e.key === "a") d = { x: -1, y: 0  };
  if (e.key === "ArrowRight" || e.key === "d") d = { x: 1,  y: 0  };
  if (!d) return;
  if (d.x === -dir.x && d.y === -dir.y) return;
  nextDir = d;
});

// ==reset==
function reset() {
  snake = [
    { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) },
    { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) + 1 },
    { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) + 2 },
  ];
  food = { x: 0, y: 0 };
  dir = { x: 0, y: -1 };
  nextDir = { x: 0, y: -1 };
  score = 0;
  gameOver = false;
  win = false;
  paused = false;
  tickMs = 140;
  acc = 0;
  lastTime = 0;
  spawnFood();
}

// ==food==
function spawnFood() {
  const free = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!snake.some(s => s.x === x && s.y === y)) free.push({ x, y });
    }
  }
  if (free.length === 0) {
    win = true;
    gameOver = true;
    return;
  }
  const cell = free[Math.floor(Math.random() * free.length)];
  food.x = cell.x;
  food.y = cell.y;
}

// ==per tick==
function step() {
  dir = nextDir;

  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    gameOver = true;
    return;
  }

  const ate = head.x === food.x && head.y === food.y;

  const body = ate ? snake : snake.slice(0, -1);
  if (body.some(s => s.x === head.x && s.y === head.y)) {
    gameOver = true;
    return;
  }

  snake.unshift(head);

  if (ate) {
    score += 10;
    tickMs = Math.max(60, tickMs - 4);
    spawnFood();
  } else {
    snake.pop();
  }
}

// ==render==
function drawGrid() {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= COLS; x++) {
    ctx.moveTo(x * CELL + 0.5, 0);
    ctx.lineTo(x * CELL + 0.5, canvas.height);
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.moveTo(0, y * CELL + 0.5);
    ctx.lineTo(canvas.width, y * CELL + 0.5);
  }
  ctx.stroke();
}

function render() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();

  // snake
  ctx.strokeStyle = "#205e20";
  ctx.lineWidth = 3;
  ctx.fillStyle = "lime";
  for (const seg of snake) {
    ctx.fillRect(seg.x * CELL, seg.y * CELL, CELL, CELL);
    ctx.strokeRect(seg.x * CELL, seg.y * CELL, CELL, CELL);
  }

  // food
  ctx.fillStyle = "red";
  ctx.fillRect(food.x * CELL, food.y * CELL, CELL, CELL);
  ctx.strokeStyle = "#5e2020";
  ctx.lineWidth = 1;
  ctx.strokeRect(food.x * CELL, food.y * CELL, CELL, CELL);

  // pause overlay
  if (paused && !gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);
    ctx.font = "16px sans-serif";
    ctx.fillText("Space to resume", canvas.width / 2, canvas.height / 2 + 40);
  }

  // game over / win overlay
  if (gameOver) {
    // persist high score once
    if (score > best) {
      best = score;
      localStorage.setItem("snakeBest", String(best));
    }

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(win ? "You Win!" : "Game Over", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "18px sans-serif";
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText(`Best: ${best}`, canvas.width / 2, canvas.height / 2 + 55);
    ctx.font = "12px sans-serif";
    ctx.fillText(`"R" to restart`, canvas.width / 2, canvas.height / 2 + 85);
  }
}

// ==debug==
function updateDebug() {
  debugEL.textContent =
    `Diag:\n----\n` +
    `head cell:  (${snake[0].x}, ${snake[0].y})\n` +
    `head pixel: (${snake[0].x * CELL}, ${snake[0].y * CELL})\n` +
    `dir:        (${dir.x}, ${dir.y})\n` +
    `nextDir:    (${nextDir.x}, ${nextDir.y})\n` +
    `score:      ${score}\n` +
    `best:       ${best}\n` +
    `tick:       ${tickMs}ms\n` +
    `paused:     ${paused}\n` +
    `gameOver:   ${gameOver}\n` +
    `win:        ${win}`;
}

// ==loop==
function loop(t) {
  if (lastTime === 0) lastTime = t;
  const dt = t - lastTime;
  lastTime = t;

  if (!paused && !gameOver) {
    acc += dt;
    while (acc >= tickMs) {
      acc -= tickMs;
      step();
      if (gameOver) break;
    }
  }

  render();
  updateDebug();
  requestAnimationFrame(loop);
}

reset();
requestAnimationFrame(loop);