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
let formationTimer = 0;
let keys = {};
let animFrame;

// Pre-render sprites
let playerSprite, arrowSprite;

function createPlayerSprite() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const s = size / 2;

  // Glow
  const glow = g.createRadialGradient(s, s, 0, s, s, s * 0.9);
  glow.addColorStop(0, 'rgba(255,200,100,0.15)');
  glow.addColorStop(1, 'rgba(255,200,100,0)');
  g.fillStyle = glow;
  g.beginPath(); g.arc(s, s, s * 0.9, 0, Math.PI * 2); g.fill();

  // Body (robe)
  g.fillStyle = '#4a3520';
  g.beginPath();
  g.moveTo(s, s * 0.55);
  g.quadraticCurveTo(s * 1.6, s * 1.0, s * 1.3, s * 1.8);
  g.lineTo(s * 0.7, s * 1.8);
  g.quadraticCurveTo(s * 0.4, s * 1.0, s, s * 0.55);
  g.fill();
  g.strokeStyle = '#6b5030';
  g.lineWidth = 1;
  g.stroke();

  // Belt
  g.strokeStyle = '#8b6040';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(s * 0.72, s * 1.15);
  g.lineTo(s * 1.28, s * 1.15);
  g.stroke();

  // Head
  g.fillStyle = '#e8c898';
  g.beginPath(); g.arc(s, s * 0.48, s * 0.18, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#c0a070';
  g.lineWidth = 0.5;
  g.stroke();

  // Eyes
  g.fillStyle = '#1a1a1a';
  g.beginPath(); g.arc(s - s * 0.06, s * 0.46, 1.5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(s + s * 0.06, s * 0.46, 1.5, 0, Math.PI * 2); g.fill();

  // Straw hat (斗笠)
  g.fillStyle = '#c8a050';
  g.beginPath();
  g.moveTo(s * 0.15, s * 0.52);
  g.quadraticCurveTo(s, s * 0.18, s * 1.85, s * 0.52);
  g.quadraticCurveTo(s, s * 0.45, s * 0.15, s * 0.52);
  g.fill();
  g.strokeStyle = '#a08030';
  g.lineWidth = 1;
  g.stroke();

  // Hat top cone
  g.fillStyle = '#b89040';
  g.beginPath();
  g.moveTo(s * 0.55, s * 0.42);
  g.lineTo(s, s * 0.12);
  g.lineTo(s * 1.45, s * 0.42);
  g.quadraticCurveTo(s, s * 0.38, s * 0.55, s * 0.42);
  g.fill();
  g.strokeStyle = '#907030';
  g.lineWidth = 0.8;
  g.stroke();

  // Hat string
  g.strokeStyle = '#8b6040';
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(s * 0.3, s * 0.51);
  g.quadraticCurveTo(s * 0.6, s * 0.65, s * 0.7, s * 0.6);
  g.stroke();
  g.beginPath();
  g.moveTo(s * 1.7, s * 0.51);
  g.quadraticCurveTo(s * 1.4, s * 0.65, s * 1.3, s * 0.6);
  g.stroke();

  playerSprite = c;
}

function createArrowSprite() {
  const w = 48, h = 12;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const cy = h / 2;

  // Shaft
  g.strokeStyle = '#d4a840';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(2, cy);
  g.lineTo(w - 12, cy);
  g.stroke();

  // Fletching (feathers)
  g.fillStyle = '#cc3333';
  g.beginPath();
  g.moveTo(2, cy);
  g.lineTo(10, cy - 4);
  g.lineTo(10, cy);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(2, cy);
  g.lineTo(10, cy + 4);
  g.lineTo(10, cy);
  g.closePath();
  g.fill();

  // Second feather layer
  g.fillStyle = '#dd5555';
  g.beginPath();
  g.moveTo(4, cy);
  g.lineTo(12, cy - 3);
  g.lineTo(12, cy);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(4, cy);
  g.lineTo(12, cy + 3);
  g.lineTo(12, cy);
  g.closePath();
  g.fill();

  // Arrow head (sleek metal)
  g.fillStyle = '#c0c0c0';
  g.beginPath();
  g.moveTo(w, cy);
  g.lineTo(w - 10, cy - 2.5);
  g.lineTo(w - 8, cy);
  g.lineTo(w - 10, cy + 2.5);
  g.closePath();
  g.fill();

  // Shaft ring detail
  g.strokeStyle = '#b89830';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(14, cy - 2); g.lineTo(14, cy + 2);
  g.stroke();

  arrowSprite = c;
}

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
  const g = ctx.createRadialGradient(cx, cy, arenaR - 5, cx, cy, arenaR + 15);
  g.addColorStop(0, 'rgba(200,160,60,0.15)');
  g.addColorStop(1, 'rgba(200,160,60,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, arenaR + 15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(200,160,60,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, arenaR, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(20,18,12,0.6)';
  ctx.beginPath(); ctx.arc(cx, cy, arenaR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(200,160,60,0.12)';
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
}

function drawPlayer() {
  if (!playerSprite) return;
  const sz = playerR * 4;
  ctx.drawImage(playerSprite, player.x - sz / 2, player.y - sz / 2, sz, sz);
}

function drawArrow(a) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(Math.atan2(a.dy, a.dx));
  const len = 24, head = 8;
  // trail glow
  ctx.strokeStyle = 'rgba(232,192,96,0.15)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-len - 16, 0); ctx.lineTo(-len, 0); ctx.stroke();
  // shaft
  ctx.strokeStyle = '#d4a840';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(2, 0); ctx.stroke();
  // fletching
  ctx.fillStyle = '#cc3333';
  ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len + 7, -3.5); ctx.lineTo(-len + 7, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len + 7, 3.5); ctx.lineTo(-len + 7, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#dd5555';
  ctx.beginPath(); ctx.moveTo(-len + 2, 0); ctx.lineTo(-len + 9, -2.5); ctx.lineTo(-len + 9, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-len + 2, 0); ctx.lineTo(-len + 9, 2.5); ctx.lineTo(-len + 9, 0); ctx.closePath(); ctx.fill();
  // head
  ctx.fillStyle = '#c0c0c0';
  ctx.beginPath();
  ctx.moveTo(head, 0);
  ctx.lineTo(head - 7, -3);
  ctx.lineTo(head - 5, 0);
  ctx.lineTo(head - 7, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function addArrow(sx, sy, aimAngle, speed) {
  arrows.push({
    x: sx, y: sy,
    dx: Math.cos(aimAngle) * speed,
    dy: Math.sin(aimAngle) * speed,
    speed
  });
}

function spawnArrow() {
  const angle = Math.random() * Math.PI * 2;
  const sx = cx + Math.cos(angle) * arenaR;
  const sy = cy + Math.sin(angle) * arenaR;
  const aimAngle = Math.atan2(cy - sy, cx - sx) + (Math.random() - 0.5) * 0.6;
  const speed = 2 + Math.min(gameTime * 0.015, 4);
  addArrow(sx, sy, aimAngle, speed);
}

// ========== Formation System ==========

function formationLine() {
  // 一字长蛇阵: 10 arrows in a line from one edge point
  const baseAngle = Math.random() * Math.PI * 2;
  const baseX = cx + Math.cos(baseAngle) * arenaR;
  const baseY = cy + Math.sin(baseAngle) * arenaR;
  const aimAngle = Math.atan2(cy - baseY, cx - baseX) + (Math.random() - 0.5) * 0.15;
  const speed = 2.5 + Math.min(gameTime * 0.012, 3);
  const perpAngle = baseAngle + Math.PI / 2;
  const spacing = 18;
  const count = 10;
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spacing;
    const sx = baseX + Math.cos(perpAngle) * offset;
    const sy = baseY + Math.sin(perpAngle) * offset;
    addArrow(sx, sy, aimAngle + (Math.random() - 0.5) * 0.05, speed);
  }
}

function formationFan() {
  // 扇形散射: from one point, fan of arrows
  const baseAngle = Math.random() * Math.PI * 2;
  const baseX = cx + Math.cos(baseAngle) * arenaR;
  const baseY = cy + Math.sin(baseAngle) * arenaR;
  const centerAim = Math.atan2(cy - baseY, cx - baseX);
  const speed = 2.5 + Math.min(gameTime * 0.012, 3);
  const count = 12;
  const spread = 0.6; // radians total spread
  for (let i = 0; i < count; i++) {
    const a = centerAim - spread / 2 + (spread / (count - 1)) * i;
    addArrow(baseX, baseY, a, speed);
  }
}

function formationCross() {
  // 四面齐射: 4 directions, each with a line of arrows
  const speed = 2.5 + Math.min(gameTime * 0.012, 2.5);
  const dirs = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];
  const spacing = 18;
  const count = 8;
  for (const dir of dirs) {
    const baseX = cx + Math.cos(dir) * arenaR;
    const baseY = cy + Math.sin(dir) * arenaR;
    const perpAngle = dir + Math.PI / 2;
    const aimAngle = dir + Math.PI; // toward center
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spacing;
      const sx = baseX + Math.cos(perpAngle) * offset;
      const sy = baseY + Math.sin(perpAngle) * offset;
      addArrow(sx, sy, aimAngle + (Math.random() - 0.5) * 0.03, speed);
    }
  }
}

function formationCircle() {
  // 环形围射: arrows from evenly spaced points around the edge, aimed at center
  const speed = 2.5 + Math.min(gameTime * 0.012, 2.5);
  const count = 16;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    addArrow(sx, sy, angle + Math.PI, speed); // toward center
  }
}

function formationSpin() {
  // 旋转箭雨: arrows from rotating angles over time
  const speed = 2.5 + Math.min(gameTime * 0.012, 3);
  const baseAngle = gameTime * 1.5; // rotates with time
  const count = 8;
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (Math.PI * 2 / count) * i;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    addArrow(sx, sy, angle + Math.PI + (Math.random() - 0.5) * 0.1, speed);
  }
}

function formationCrossWeave() {
  // 交叉箭网: two groups crossing at angles
  const speed = 2.5 + Math.min(gameTime * 0.012, 2.5);
  const angle1 = Math.random() * Math.PI * 2;
  const angle2 = angle1 + Math.PI / 2;
  [angle1, angle2].forEach(baseAngle => {
    const baseX = cx + Math.cos(baseAngle) * arenaR;
    const baseY = cy + Math.sin(baseAngle) * arenaR;
    const oppX = cx + Math.cos(baseAngle + Math.PI) * arenaR;
    const oppY = cy + Math.sin(baseAngle + Math.PI) * arenaR;
    const perpAngle = baseAngle + Math.PI / 2;
    const spacing = 30;
    const count = 5;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spacing;
      // From one side
      const sx = baseX + Math.cos(perpAngle) * offset;
      const sy = baseY + Math.sin(perpAngle) * offset;
      addArrow(sx, sy, baseAngle + Math.PI + (Math.random() - 0.5) * 0.04, speed);
      // From opposite side
      const sx2 = oppX + Math.cos(perpAngle) * offset;
      const sy2 = oppY + Math.sin(perpAngle) * offset;
      addArrow(sx2, sy2, baseAngle + (Math.random() - 0.5) * 0.04, speed);
    }
  });
}

function getAvailableFormations() {
  // Difficulty-based formation availability
  const t = gameTime;
  const f = [];

  // Basic: single arrow always available (handled in update)
  // Mid-tier formations
  if (t >= 8) f.push(formationLine);
  if (t >= 12) f.push(formationFan);
  // Advanced formations
  if (t >= 25) f.push(formationCross);
  if (t >= 35) f.push(formationCircle);
  if (t >= 45) f.push(formationSpin);
  if (t >= 55) f.push(formationCrossWeave);

  return f;
}

function spawnFormation() {
  const formations = getAvailableFormations();
  if (formations.length === 0) return;
  const fn = formations[Math.floor(Math.random() * formations.length)];
  fn();

  // After 60s, chance of double formation
  if (gameTime > 60 && Math.random() < 0.4) {
    const fn2 = formations[Math.floor(Math.random() * formations.length)];
    fn2();
  }

  // After 90s, chance of triple
  if (gameTime > 90 && Math.random() < 0.3) {
    const fn3 = formations[Math.floor(Math.random() * formations.length)];
    fn3();
  }
}

function update(dt) {
  gameTime += dt;

  // Move player
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
  const pdx = player.x - cx, pdy = player.y - cy;
  const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
  const maxDist = arenaR - playerR;
  if (pdist > maxDist) {
    player.x = cx + (pdx / pdist) * maxDist;
    player.y = cy + (pdy / pdist) * maxDist;
  }

  // Spawn single arrows (base rate)
  const spawnRate = Math.max(0.15, 0.7 - gameTime * 0.005);
  spawnTimer += dt;
  while (spawnTimer >= spawnRate) {
    spawnTimer -= spawnRate;
    spawnArrow();
  }

  // Spawn formations on a timer
  const formationRate = Math.max(1.5, 5 - gameTime * 0.03);
  formationTimer += dt;
  while (formationTimer >= formationRate) {
    formationTimer -= formationRate;
    spawnFormation();
  }

  // Update arrows
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    a.x += a.dx * dt * 60;
    a.y += a.dy * dt * 60;
    const adx = a.x - cx, ady = a.y - cy;
    if (Math.sqrt(adx * adx + ady * ady) > arenaR + 40) {
      arrows.splice(i, 1);
      continue;
    }
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
  score = 0; gameTime = 0; spawnTimer = 0; formationTimer = 0;
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

// Init
createPlayerSprite();
createArrowSprite();
resize();
