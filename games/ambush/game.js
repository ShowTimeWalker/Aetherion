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
let knives = [];
let score = 0;
let gameTime = 0;
let running = false;
let lastTime = 0;
let spawnTimer = 0;
let formationTimer = 0;
let knifeTimer = 0;
let keys = {};
let animFrame;

// Pre-render sprites
let playerSprite, arrowSprite, knifeSprite;

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

  g.strokeStyle = '#d4a840';
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(2, cy); g.lineTo(w - 12, cy); g.stroke();

  g.fillStyle = '#cc3333';
  g.beginPath(); g.moveTo(2, cy); g.lineTo(10, cy - 4); g.lineTo(10, cy); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(2, cy); g.lineTo(10, cy + 4); g.lineTo(10, cy); g.closePath(); g.fill();

  g.fillStyle = '#dd5555';
  g.beginPath(); g.moveTo(4, cy); g.lineTo(12, cy - 3); g.lineTo(12, cy); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(4, cy); g.lineTo(12, cy + 3); g.lineTo(12, cy); g.closePath(); g.fill();

  g.fillStyle = '#c0c0c0';
  g.beginPath();
  g.moveTo(w, cy); g.lineTo(w - 10, cy - 2.5); g.lineTo(w - 8, cy); g.lineTo(w - 10, cy + 2.5);
  g.closePath(); g.fill();

  g.strokeStyle = '#b89830';
  g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(14, cy - 2); g.lineTo(14, cy + 2); g.stroke();

  arrowSprite = c;
}

function createKnifeSprite() {
  const w = 40, h = 14;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const cy2 = h / 2;

  // Handle
  g.fillStyle = '#5a3a20';
  g.beginPath();
  g.roundRect(0, cy2 - 3, 14, 6, 2);
  g.fill();
  g.strokeStyle = '#7a5a30';
  g.lineWidth = 0.5;
  g.stroke();

  // Handle wrap
  g.strokeStyle = '#8a6a3a';
  g.lineWidth = 1;
  for (let i = 3; i < 12; i += 3) {
    g.beginPath(); g.moveTo(i, cy2 - 3); g.lineTo(i, cy2 + 3); g.stroke();
  }

  // Guard
  g.fillStyle = '#a0a0a0';
  g.fillRect(13, cy2 - 4, 3, 8);

  // Blade
  g.fillStyle = '#d0d0d0';
  g.beginPath();
  g.moveTo(16, cy2 - 2);
  g.lineTo(w, cy2);
  g.lineTo(16, cy2 + 2);
  g.closePath();
  g.fill();

  // Blade edge highlight
  g.strokeStyle = '#ffffff';
  g.lineWidth = 0.5;
  g.beginPath();
  g.moveTo(18, cy2 - 1);
  g.lineTo(w - 2, cy2 - 0.5);
  g.stroke();

  // Blade center line
  g.strokeStyle = '#b0b0b0';
  g.lineWidth = 0.3;
  g.beginPath();
  g.moveTo(16, cy2);
  g.lineTo(w - 1, cy2);
  g.stroke();

  knifeSprite = c;
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
  ctx.strokeStyle = 'rgba(232,192,96,0.15)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-len - 16, 0); ctx.lineTo(-len, 0); ctx.stroke();
  ctx.strokeStyle = '#d4a840';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(2, 0); ctx.stroke();
  ctx.fillStyle = '#cc3333';
  ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len + 7, -3.5); ctx.lineTo(-len + 7, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len + 7, 3.5); ctx.lineTo(-len + 7, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#dd5555';
  ctx.beginPath(); ctx.moveTo(-len + 2, 0); ctx.lineTo(-len + 9, -2.5); ctx.lineTo(-len + 9, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-len + 2, 0); ctx.lineTo(-len + 9, 2.5); ctx.lineTo(-len + 9, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c0c0c0';
  ctx.beginPath();
  ctx.moveTo(head, 0); ctx.lineTo(head - 7, -3); ctx.lineTo(head - 5, 0); ctx.lineTo(head - 7, 3);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawKnife(k) {
  ctx.save();
  ctx.translate(k.x, k.y);
  ctx.rotate(Math.atan2(k.dy, k.dx));

  // Trail glow (reddish for danger)
  ctx.strokeStyle = 'rgba(255,100,100,0.12)';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-10, 0); ctx.stroke();

  // Handle
  ctx.fillStyle = '#5a3a20';
  ctx.beginPath();
  ctx.roundRect(-18, -3, 12, 6, 1.5);
  ctx.fill();

  // Guard
  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(-6, -4, 2.5, 8);

  // Blade
  ctx.fillStyle = '#d0d0d0';
  ctx.beginPath();
  ctx.moveTo(-3.5, -2.5);
  ctx.lineTo(16, 0);
  ctx.lineTo(-3.5, 2.5);
  ctx.closePath();
  ctx.fill();

  // Blade highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(-2, -1.5); ctx.lineTo(14, -0.5); ctx.stroke();

  ctx.restore();
}

function addArrow(sx, sy, aimAngle, speed, opts = {}) {
  arrows.push({
    x: sx, y: sy,
    dx: Math.cos(aimAngle) * speed,
    dy: Math.sin(aimAngle) * speed,
    speed,
    curve: opts.curve || 0,    // curvature: radians per frame to turn
    turnTimer: opts.turnTimer || 0,
    bounced: false,
    bounceSpeed: opts.bounceSpeed || 0,
  });
}

function addKnife(sx, sy, aimAngle, speed, opts = {}) {
  // turnPhase: when to turn (fraction of journey 0-1), turnRate: how fast to curve
  const targetX = cx + (Math.random() - 0.5) * arenaR * 0.5;
  const targetY = cy + (Math.random() - 0.5) * arenaR * 0.5;
  knives.push({
    x: sx, y: sy,
    dx: Math.cos(aimAngle) * speed,
    dy: Math.sin(aimAngle) * speed,
    speed,
    maxSpeed: speed,
    // Turning state machine
    state: 'approach',  // approach -> decelerate -> turning -> accelerate -> exit
    turnProgress: 0,    // 0-1 how far through the turn
    turnDuration: 0.6 + Math.random() * 0.4, // seconds for full turn
    originalAngle: aimAngle,
    exitAngle: opts.exitAngle != null ? opts.exitAngle : aimAngle + Math.PI + (Math.random() - 0.5) * 1.2,
    turnStarted: false,
    elapsed: 0,
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

// ========== Arrow Formation System ==========

function formationLine() {
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
  const baseAngle = Math.random() * Math.PI * 2;
  const baseX = cx + Math.cos(baseAngle) * arenaR;
  const baseY = cy + Math.sin(baseAngle) * arenaR;
  const centerAim = Math.atan2(cy - baseY, cx - baseX);
  const speed = 2.5 + Math.min(gameTime * 0.012, 3);
  const count = 12;
  const spread = 0.6;
  for (let i = 0; i < count; i++) {
    const a = centerAim - spread / 2 + (spread / (count - 1)) * i;
    addArrow(baseX, baseY, a, speed);
  }
}

function formationCross() {
  const speed = 2.5 + Math.min(gameTime * 0.012, 2.5);
  const dirs = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];
  const spacing = 18;
  const count = 8;
  for (const dir of dirs) {
    const baseX = cx + Math.cos(dir) * arenaR;
    const baseY = cy + Math.sin(dir) * arenaR;
    const perpAngle = dir + Math.PI / 2;
    const aimAngle = dir + Math.PI;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spacing;
      const sx = baseX + Math.cos(perpAngle) * offset;
      const sy = baseY + Math.sin(perpAngle) * offset;
      addArrow(sx, sy, aimAngle + (Math.random() - 0.5) * 0.03, speed);
    }
  }
}

function formationCircle() {
  const speed = 2.5 + Math.min(gameTime * 0.012, 2.5);
  const count = 16;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    addArrow(sx, sy, angle + Math.PI, speed);
  }
}

function formationSpin() {
  const speed = 2.5 + Math.min(gameTime * 0.012, 3);
  const baseAngle = gameTime * 1.5;
  const count = 8;
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (Math.PI * 2 / count) * i;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    addArrow(sx, sy, angle + Math.PI + (Math.random() - 0.5) * 0.1, speed);
  }
}

function formationCrossWeave() {
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
      const sx = baseX + Math.cos(perpAngle) * offset;
      const sy = baseY + Math.sin(perpAngle) * offset;
      addArrow(sx, sy, baseAngle + Math.PI + (Math.random() - 0.5) * 0.04, speed);
      const sx2 = oppX + Math.cos(perpAngle) * offset;
      const sy2 = oppY + Math.sin(perpAngle) * offset;
      addArrow(sx2, sy2, baseAngle + (Math.random() - 0.5) * 0.04, speed);
    }
  });
}

// ========== NEW Arrow Formations ==========

// 螺旋射箭: arrows spiral inward from the edge
function formationSpiral() {
  const speed = 2 + Math.min(gameTime * 0.01, 2.5);
  const count = 20;
  const startAngle = Math.random() * Math.PI * 2;
  const curveDir = Math.random() < 0.5 ? 1 : -1;
  for (let i = 0; i < count; i++) {
    const angle = startAngle + (i / count) * Math.PI * 3;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const toCenter = Math.atan2(cy - sy, cx - sx);
    // Aim slightly off-center with curvature toward center
    const aimAngle = toCenter + curveDir * 0.5;
    addArrow(sx, sy, aimAngle, speed, { curve: curveDir * 0.015 });
  }
}

// S型射箭: arrows follow S-curve paths
function formationSCurve() {
  const speed = 2.2 + Math.min(gameTime * 0.01, 2);
  const count = 6;
  const baseAngle = Math.random() * Math.PI * 2;
  const baseX = cx + Math.cos(baseAngle) * arenaR;
  const baseY = cy + Math.sin(baseAngle) * arenaR;
  const centerAim = Math.atan2(cy - baseY, cx - baseX);
  const perpAngle = baseAngle + Math.PI / 2;
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * 22;
    const sx = baseX + Math.cos(perpAngle) * offset;
    const sy = baseY + Math.sin(perpAngle) * offset;
    const curveDir = (i % 2 === 0) ? 0.018 : -0.018;
    // Use a timer to flip curvature after some time
    addArrow(sx, sy, centerAim + (Math.random() - 0.5) * 0.08, speed, {
      curve: curveDir,
      turnTimer: 80 + Math.random() * 30, // frames until curve reverses
    });
  }
}

// 双龙出海: two symmetric arc groups from opposite corners
function formationDualDragon() {
  const speed = 2.5 + Math.min(gameTime * 0.01, 2.5);
  const baseAngle = Math.random() * Math.PI * 2;
  const count = 8;
  for (let dragon = 0; dragon < 2; dragon++) {
    const dir = dragon === 0 ? 1 : -1;
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + dir * (i * 0.15);
      const sx = cx + Math.cos(angle) * arenaR;
      const sy = cy + Math.sin(angle) * arenaR;
      const toCenter = Math.atan2(cy - sy, cx - sx);
      addArrow(sx, sy, toCenter + dir * 0.4, speed, { curve: -dir * 0.012 });
    }
  }
}

// 万花筒: rotational symmetry pattern
function formationKaleidoscope() {
  const speed = 2.2 + Math.min(gameTime * 0.01, 2);
  const arms = 5 + Math.floor(Math.random() * 3);
  const arrowsPerArm = 3;
  const baseRotation = Math.random() * Math.PI * 2;
  const curveDir = Math.random() < 0.5 ? 1 : -1;
  for (let arm = 0; arm < arms; arm++) {
    const armAngle = baseRotation + (Math.PI * 2 / arms) * arm;
    for (let i = 0; i < arrowsPerArm; i++) {
      const delay = i * 0.12;
      const angle = armAngle + i * 0.15;
      const sx = cx + Math.cos(angle) * arenaR;
      const sy = cy + Math.sin(angle) * arenaR;
      const toCenter = Math.atan2(cy - sy, cx - sx);
      addArrow(sx, sy, toCenter + curveDir * (0.3 + i * 0.1), speed * (0.9 + i * 0.05), { curve: curveDir * 0.01 });
    }
  }
}

// 弹跳箭: arrows that bounce when reaching center area
function formationBounce() {
  const speed = 2.5 + Math.min(gameTime * 0.01, 2.5);
  const count = 10;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.2;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    // Aim at a point near center (not exactly center)
    const targetOffset = (Math.random() - 0.5) * arenaR * 0.3;
    const perpAngle = angle + Math.PI / 2;
    const targetX = cx + Math.cos(perpAngle) * targetOffset;
    const targetY = cy + Math.sin(perpAngle) * targetOffset;
    const aimAngle = Math.atan2(targetY - sy, targetX - sx);
    // After reaching near center, arrow bounces in a new direction
    const bounceAngle = angle + Math.PI + (Math.random() - 0.5) * 0.8;
    addArrow(sx, sy, aimAngle, speed, {
      bounced: false,
      bounceSpeed: speed * 0.8,
    });
    // Set bounce angle on the arrow
    arrows[arrows.length - 1].bounceAngle = bounceAngle;
    arrows[arrows.length - 1].bounceDist = arenaR * (0.15 + Math.random() * 0.15);
  }
}

// 脉冲波: ring of arrows with varying speeds creating a wave
function formationPulse() {
  const baseSpeed = 2 + Math.min(gameTime * 0.01, 2.5);
  const count = 24;
  const pulseCount = 3;
  for (let p = 0; p < pulseCount; p++) {
    const speedMult = 0.6 + p * 0.3;
    const arrowsInPulse = Math.floor(count / pulseCount);
    for (let i = 0; i < arrowsInPulse; i++) {
      const angle = (Math.PI * 2 / arrowsInPulse) * i + p * 0.15;
      const sx = cx + Math.cos(angle) * arenaR;
      const sy = cy + Math.sin(angle) * arenaR;
      addArrow(sx, sy, angle + Math.PI, baseSpeed * speedMult);
    }
  }
}

// V字雁阵: V-shaped formation from one side
function formationVShape() {
  const speed = 2.5 + Math.min(gameTime * 0.012, 3);
  const baseAngle = Math.random() * Math.PI * 2;
  const baseX = cx + Math.cos(baseAngle) * arenaR;
  const baseY = cy + Math.sin(baseAngle) * arenaR;
  const centerAim = Math.atan2(cy - baseY, cx - baseX);
  const armLen = 5; // arrows per arm

  // Lead arrow
  addArrow(baseX, baseY, centerAim, speed * 1.1);

  for (let arm = 0; arm < 2; arm++) {
    const dir = arm === 0 ? 1 : -1;
    const perpAngle = baseAngle + Math.PI / 2;
    for (let i = 1; i <= armLen; i++) {
      // V shape: backward and to the side
      const backOffset = i * 14;
      const sideOffset = i * 12 * dir;
      const sx = baseX - Math.cos(centerAim) * backOffset + Math.cos(perpAngle) * sideOffset;
      const sy = baseY - Math.sin(centerAim) * backOffset + Math.sin(perpAngle) * sideOffset;
      // Clamp to arena edge
      const dx = sx - cx, dy = sy - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let fx = sx, fy = sy;
      if (dist > arenaR) {
        fx = cx + (dx / dist) * arenaR;
        fy = cy + (dy / dist) * arenaR;
      }
      addArrow(fx, fy, centerAim + (Math.random() - 0.5) * 0.03, speed - i * 0.1);
    }
  }
}

// 狂风暴雨: rapid random arrows from all sides (brief barrage)
function formationStorm() {
  const speed = 3 + Math.min(gameTime * 0.015, 3);
  const count = 20;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx) + (Math.random() - 0.5) * 0.8;
    addArrow(sx, sy, aimAngle, speed * (0.7 + Math.random() * 0.6));
  }
}

// 追踪箭: arrows that slowly curve toward player position at spawn time
function formationTracking() {
  const speed = 2 + Math.min(gameTime * 0.01, 2);
  const count = 5;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const toPlayer = Math.atan2(player.y - sy, player.x - sx);
    // Don't aim directly at player, aim near with curve toward player
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const diff = toPlayer - aimAngle;
    const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
    // Curve toward player
    const curveAmount = normalizedDiff > 0 ? 0.008 : -0.008;
    addArrow(sx, sy, aimAngle + normalizedDiff * 0.3, speed, { curve: curveAmount * 1.5 });
  }
}

function getAvailableFormations() {
  const t = gameTime;
  const f = [];

  if (t >= 8)  f.push(formationLine);
  if (t >= 12) f.push(formationFan);
  if (t >= 20) f.push(formationSpiral);
  if (t >= 25) f.push(formationCross);
  if (t >= 30) f.push(formationSCurve);
  if (t >= 35) f.push(formationCircle);
  if (t >= 40) f.push(formationVShape);
  if (t >= 45) f.push(formationSpin);
  if (t >= 50) f.push(formationDualDragon);
  if (t >= 55) f.push(formationCrossWeave);
  if (t >= 60) f.push(formationPulse);
  if (t >= 65) f.push(formationBounce);
  if (t >= 70) f.push(formationKaleidoscope);
  if (t >= 80) f.push(formationTracking);
  if (t >= 90) f.push(formationStorm);

  return f;
}

function spawnFormation() {
  const formations = getAvailableFormations();
  if (formations.length === 0) return;
  const fn = formations[Math.floor(Math.random() * formations.length)];
  fn();

  if (gameTime > 60 && Math.random() < 0.4) {
    const fn2 = formations[Math.floor(Math.random() * formations.length)];
    fn2();
  }

  if (gameTime > 90 && Math.random() < 0.3) {
    const fn3 = formations[Math.floor(Math.random() * formations.length)];
    fn3();
  }
}

// ========== Knife System ==========

function spawnKnife() {
  const angle = Math.random() * Math.PI * 2;
  const sx = cx + Math.cos(angle) * arenaR;
  const sy = cy + Math.sin(angle) * arenaR;
  const aimAngle = Math.atan2(cy - sy, cx - sx) + (Math.random() - 0.5) * 0.4;
  const speed = 2.5 + Math.min(gameTime * 0.012, 3);
  addKnife(sx, sy, aimAngle, speed);
}

function spawnKnifeFormation() {
  // Knife formations that leverage the turning mechanic
  const knifeFormations = [knifeFormationScatter, knifeFormationSpiral, knifeFormationCross];

  // After 90s, more formations available
  if (gameTime >= 90) {
    knifeFormations.push(knifeFormationPinwheel, knifeFormationBarrage);
  }

  const fn = knifeFormations[Math.floor(Math.random() * knifeFormations.length)];
  fn();
}

function knifeFormationScatter() {
  const count = 3 + Math.floor(Math.min((gameTime - 60) / 30, 5));
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const speed = 2.5 + Math.min(gameTime * 0.01, 2.5);
    addKnife(sx, sy, aimAngle, speed);
  }
}

function knifeFormationSpiral() {
  const count = 6;
  const baseAngle = Math.random() * Math.PI * 2;
  const speed = 2.5 + Math.min(gameTime * 0.01, 2);
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (i / count) * Math.PI * 2;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    // Exit angles spiral outward
    const exitAngle = angle + Math.PI * 0.5;
    addKnife(sx, sy, aimAngle, speed, { exitAngle });
  }
}

function knifeFormationCross() {
  const speed = 2.5 + Math.min(gameTime * 0.01, 2);
  const count = 4;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const exitAngle = angle + Math.PI / 2 + Math.random() * 0.5;
    addKnife(sx, sy, aimAngle, speed, { exitAngle });
  }
}

function knifeFormationPinwheel() {
  const count = 8;
  const speed = 2.5 + Math.min(gameTime * 0.01, 2);
  const rotDir = Math.random() < 0.5 ? 1 : -1;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const exitAngle = angle + Math.PI + rotDir * 1.2;
    addKnife(sx, sy, aimAngle, speed, { exitAngle });
  }
}

function knifeFormationBarrage() {
  const count = 10;
  const speed = 2.5 + Math.min(gameTime * 0.01, 2);
  const baseAngle = Math.random() * Math.PI * 2;
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.8;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const exitAngle = Math.random() * Math.PI * 2;
    addKnife(sx, sy, aimAngle, speed, { exitAngle });
  }
}

function updateKnife(k, dt) {
  k.elapsed += dt;
  const distToCenter = Math.sqrt((k.x - cx) ** 2 + (k.y - cy) ** 2);

  if (k.state === 'approach') {
    // Move toward center area
    k.x += k.dx * dt * 60;
    k.y += k.dy * dt * 60;

    // Start decelerating when close to center
    if (distToCenter < arenaR * 0.45) {
      k.state = 'decelerate';
    }
  }

  if (k.state === 'decelerate') {
    // Slow down smoothly
    const decelFactor = 0.92;
    k.dx *= decelFactor;
    k.dy *= decelFactor;
    k.x += k.dx * dt * 60;
    k.y += k.dy * dt * 60;

    const currentSpeed = Math.sqrt(k.dx * k.dx + k.dy * k.dy);
    // Start turning when slow enough
    if (currentSpeed < k.maxSpeed * 0.35) {
      k.state = 'turning';
      k.turnProgress = 0;
      k.currentAngle = Math.atan2(k.dy, k.dx);
    }
  }

  if (k.state === 'turning') {
    // Smooth arc turn using angle interpolation
    k.turnProgress += dt / k.turnDuration;
    if (k.turnProgress > 1) k.turnProgress = 1;

    // Use smooth easing (ease in-out)
    const t = k.turnProgress;
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    // Interpolate angle
    const startAngle = k.originalAngle + Math.PI; // roughly toward center then past
    const angleDiff = k.exitAngle - k.currentAngle;
    const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    const newAngle = k.currentAngle + normalizedDiff * ease * 0.08;

    k.currentAngle = newAngle;
    const slowSpeed = k.maxSpeed * 0.2;
    k.dx = Math.cos(newAngle) * slowSpeed;
    k.dy = Math.sin(newAngle) * slowSpeed;
    k.x += k.dx * dt * 60;
    k.y += k.dy * dt * 60;

    if (k.turnProgress >= 1) {
      k.state = 'accelerate';
      k.currentAngle = k.exitAngle;
      k.dx = Math.cos(k.exitAngle) * k.maxSpeed * 0.3;
      k.dy = Math.sin(k.exitAngle) * k.maxSpeed * 0.3;
    }
  }

  if (k.state === 'accelerate') {
    // Speed back up in exit direction
    const accelFactor = 1.03;
    const currentSpeed = Math.sqrt(k.dx * k.dx + k.dy * k.dy);
    if (currentSpeed < k.maxSpeed * 0.9) {
      k.dx *= accelFactor;
      k.dy *= accelFactor;
    }
    k.x += k.dx * dt * 60;
    k.y += k.dy * dt * 60;
    k.state = 'exit';
  }

  if (k.state === 'exit') {
    k.x += k.dx * dt * 60;
    k.y += k.dy * dt * 60;
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

  // Spawn single arrows
  const spawnRate = Math.max(0.15, 0.7 - gameTime * 0.005);
  spawnTimer += dt;
  while (spawnTimer >= spawnRate) {
    spawnTimer -= spawnRate;
    spawnArrow();
  }

  // Spawn formations
  const formationRate = Math.max(1.5, 5 - gameTime * 0.03);
  formationTimer += dt;
  while (formationTimer >= formationRate) {
    formationTimer -= formationRate;
    spawnFormation();
  }

  // Spawn knives after 60s
  if (gameTime >= 60) {
    const knifeRate = Math.max(1.5, 5 - (gameTime - 60) * 0.04);
    knifeTimer += dt;
    while (knifeTimer >= knifeRate) {
      knifeTimer -= knifeRate;
      if (gameTime >= 90 && Math.random() < 0.4) {
        spawnKnifeFormation();
      } else {
        const count = 1 + Math.floor(Math.min((gameTime - 60) / 30, 3));
        for (let i = 0; i < count; i++) spawnKnife();
      }
    }
  }

  // Update arrows
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];

    // Apply curvature (for spiral, S-curve, etc.)
    if (a.curve !== 0) {
      const currentAngle = Math.atan2(a.dy, a.dx);
      const newAngle = currentAngle + a.curve;
      a.dx = Math.cos(newAngle) * a.speed;
      a.dy = Math.sin(newAngle) * a.speed;

      // S-curve: reverse curvature after timer
      if (a.turnTimer > 0) {
        a.turnTimer--;
        if (a.turnTimer <= 0) {
          a.curve = -a.curve;
        }
      }
    }

    // Bounce mechanic
    if (a.bounceAngle !== undefined && !a.bounced) {
      const distToCenter = Math.sqrt((a.x - cx) ** 2 + (a.y - cy) ** 2);
      if (distToCenter < a.bounceDist) {
        a.bounced = true;
        a.dx = Math.cos(a.bounceAngle) * a.speed;
        a.dy = Math.sin(a.bounceAngle) * a.speed;
      }
    }

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

  // Update knives
  for (let i = knives.length - 1; i >= 0; i--) {
    const k = knives[i];
    updateKnife(k, dt);

    const kdx = k.x - cx, kdy = k.y - cy;
    if (Math.sqrt(kdx * kdx + kdy * kdy) > arenaR + 40 && k.state === 'exit') {
      knives.splice(i, 1);
      continue;
    }
    const kcx2 = k.x - player.x, kcy2 = k.y - player.y;
    if (Math.sqrt(kcx2 * kcx2 + kcy2 * kcy2) < PLAYER_HIT_R + 4) {
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
  for (const k of knives) drawKnife(k);
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
  knives = [];
  score = 0; gameTime = 0; spawnTimer = 0; formationTimer = 0; knifeTimer = 0;
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
createKnifeSprite();
resize();
