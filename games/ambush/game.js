const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');
const scoreText = document.getElementById('scoreText');
const timeText = document.getElementById('timeText');
const finalScore = document.getElementById('finalScore');
const title = document.getElementById('title');
const subtitle = document.getElementById('subtitle');
const startBtn = document.getElementById('startBtn');

let W, H, cx, cy, arenaR, playerR;
const PLAYER_SPEED = 3.5;
const ARROW_LEN = 22;
const ARROW_HEAD = 8;
const PLAYER_HIT_R = 10;

let player = { x: 0, y: 0 };
let arrows = [];
let score = 0;
let gameTime = 0;
let running = false;
let lastTime = 0;
let spawnTimer = 0;
let keys = {};
let animFrame;

function resize() {
  const s = Math.min(window.innerWidth, window.innerHeight) - 40;
  W = H = s;
  canvas.width = canvas.height = s;
  cx = W / 2;
  cy = H / 2;
  arenaR = s * 0.44;
  playerR = arenaR * 0.03;
  if (!running) { player.x = cx; player.y = cy; drawIdle(); }
}

function drawIdle() {
  ctx.clearRect(0, 0, W, H);
  drawArena();
  drawPlayer();
}

function drawArena() {
  // outer glow
  const g = ctx.createRadialGradient(cx, cy, arenaR - 5, cx, cy, arenaR + 15);
  g.addColorStop(0, 'rgba(200,160,60,0.15)');
  g.addColorStop(1, 'rgba(200,160,60,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, arenaR + 15, 0, Math.PI * 2); ctx.fill();
  // arena border
  ctx.strokeStyle = 'rgba(200,160,60,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, arenaR, 0, Math.PI * 2); ctx.stroke();
  // inner fill
  ctx.fillStyle = 'rgba(20,18,12,0.6)';
  ctx.beginPath(); ctx.arc(cx, cy, arenaR, 0, Math.PI * 2); ctx.fill();
  // center dot
  ctx.fillStyle = 'rgba(200,160,60,0.12)';
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
}

function drawPlayer() {
  // glow
  const g = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, playerR * 3);
  g.addColorStop(0, 'rgba(100,200,255,0.25)');
  g.addColorStop(1, 'rgba(100,200,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(player.x, player.y, playerR * 3, 0, Math.PI * 2); ctx.fill();
  // body
  ctx.fillStyle = '#64c8ff';
  ctx.beginPath(); ctx.arc(player.x, player.y, playerR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a0e0ff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawArrow(a) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(Math.atan2(a.dy, a.dx));
  // shaft
  ctx.strokeStyle = '#e8c060';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-ARROW_LEN, 0); ctx.lineTo(0, 0); ctx.stroke();
  // head
  ctx.fillStyle = '#ffe080';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-ARROW_HEAD, -4);
  ctx.lineTo(-ARROW_HEAD, 4);
  ctx.closePath();
  ctx.fill();
  // trail glow
  ctx.strokeStyle = 'rgba(232,192,96,0.2)';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-ARROW_LEN - 12, 0); ctx.lineTo(-ARROW_LEN, 0); ctx.stroke();
  ctx.restore();
}

function spawnArrow() {
  const angle = Math.random() * Math.PI * 2;
  const sx = cx + Math.cos(angle) * arenaR;
  const sy = cy + Math.sin(angle) * arenaR;
  // aim near center with some spread
  const aimAngle = Math.atan2(cy - sy, cx - sx) + (Math.random() - 0.5) * 0.6;
  const speed = 2 + Math.min(gameTime * 0.015, 4);
  arrows.push({
    x: sx, y: sy,
    dx: Math.cos(aimAngle) * speed,
    dy: Math.sin(aimAngle) * speed,
    speed
  });
}

function update(dt) {
  gameTime += dt;
  // move player
  let mx = 0, my = 0;
  if (keys['ArrowUp'] || keys['KeyW']) my -= 1;
  if (keys['ArrowDown'] || keys['KeyS']) my += 1;
  if (keys['ArrowLeft'] || keys['KeyA']) mx -= 1;
  if (keys['ArrowRight'] || keys['KeyD']) mx += 1;
  if (mx || my) {
    const len = Math.sqrt(mx * mx + my * my);
    player.x += (mx / len) * PLAYER_SPEED * dt * 60;
    player.y += (my / len) * PLAYER_SPEED * dt * 60;
  }
  // constrain to arena
  const pdx = player.x - cx, pdy = player.y - cy;
  const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
  const maxDist = arenaR - playerR;
  if (pdist > maxDist) {
    player.x = cx + (pdx / pdist) * maxDist;
    player.y = cy + (pdy / pdist) * maxDist;
  }

  // spawn arrows
  const spawnRate = Math.max(0.08, 0.8 - gameTime * 0.008);
  spawnTimer += dt;
  while (spawnTimer >= spawnRate) {
    spawnTimer -= spawnRate;
    spawnArrow();
    // extra arrows at higher difficulty
    if (gameTime > 15) spawnArrow();
    if (gameTime > 35) spawnArrow();
    if (gameTime > 60) spawnArrow();
  }

  // update arrows
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    a.x += a.dx * dt * 60;
    a.y += a.dy * dt * 60;
    // remove if out of arena
    const adx = a.x - cx, ady = a.y - cy;
    if (Math.sqrt(adx * adx + ady * ady) > arenaR + 30) {
      arrows.splice(i, 1);
      continue;
    }
    // collision
    const cx2 = a.x - player.x, cy2 = a.y - player.y;
    if (Math.sqrt(cx2 * cx2 + cy2 * cy2) < PLAYER_HIT_R + 3) {
      gameOver();
      return;
    }
  }

  score = Math.floor(gameTime * 10);
  scoreText.textContent = `分数: ${score}`;
  timeText.textContent = `时间: ${gameTime.toFixed(1)}s`;
}

function render() {
  ctx.clearRect(0, 0, W, H);
  drawArena();
  // draw arrows
  for (const a of arrows) drawArrow(a);
  drawPlayer();
}

function loop(ts) {
  if (!running) return;
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  render();
  animFrame = requestAnimationFrame(loop);
}

function startGame() {
  player.x = cx; player.y = cy;
  arrows = [];
  score = 0; gameTime = 0; spawnTimer = 0;
  running = true;
  overlay.classList.remove('active');
  overlay.style.display = 'none';
  hud.style.display = 'flex';
  lastTime = performance.now();
  animFrame = requestAnimationFrame(loop);
}

function gameOver() {
  running = false;
  cancelAnimationFrame(animFrame);
  hud.style.display = 'none';
  title.textContent = '十面埋伏';
  subtitle.textContent = '万箭穿心，壮烈阵亡';
  finalScore.style.display = 'block';
  finalScore.textContent = `得分: ${score}  |  坚持: ${gameTime.toFixed(1)}s`;
  startBtn.textContent = '再来一次';
  overlay.style.display = 'flex';
  overlay.classList.add('active');
}

window.addEventListener('keydown', e => { keys[e.code] = true; e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('resize', resize);
resize();
