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

let W, H, cx, cy, arenaR, playerR, scale;
const PLAYER_SPEED_BASE = 5.0;
let playerSpeed;
const BASE_R = 350;
let PLAYER_HIT_R;

let player = { x: 0, y: 0 };
let arrows = [];
let blades = [];
let daggers = [];
let shurikens = [];
let ninjas = [];
let smokeBombs = [];
let maskedMen = [];
let smokeTimer = 0;
let score = 0;
let gameTime = 0;
let running = false;
let paused = false;
let gameOverCalled = false;
let lastTime = 0;
let spawnTimer = 0;
let formationTimer = 0;
let bladeTimer = 0;
let daggerTimer = 0;
let ninjaTimer = 0;
let keys = {};
let animFrame;

let playerSprite, arrowSprite, ninjaSprite, shurikenSprite, maskedSprite;
let bambooCache = null;

function createPlayerSprite() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const s = size / 2;

  const glow = g.createRadialGradient(s, s, 0, s, s, s * 0.9);
  glow.addColorStop(0, 'rgba(255,200,100,0.15)');
  glow.addColorStop(1, 'rgba(255,200,100,0)');
  g.fillStyle = glow;
  g.beginPath(); g.arc(s, s, s * 0.9, 0, Math.PI * 2); g.fill();

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

  g.strokeStyle = '#8b6040';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(s * 0.72, s * 1.15);
  g.lineTo(s * 1.28, s * 1.15);
  g.stroke();

  g.fillStyle = '#e8c898';
  g.beginPath(); g.arc(s, s * 0.48, s * 0.18, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#c0a070';
  g.lineWidth = 0.5;
  g.stroke();

  g.fillStyle = '#1a1a1a';
  g.beginPath(); g.arc(s - s * 0.06, s * 0.46, 1.5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(s + s * 0.06, s * 0.46, 1.5, 0, Math.PI * 2); g.fill();

  g.fillStyle = '#c8a050';
  g.beginPath();
  g.moveTo(s * 0.15, s * 0.52);
  g.quadraticCurveTo(s, s * 0.18, s * 1.85, s * 0.52);
  g.quadraticCurveTo(s, s * 0.45, s * 0.15, s * 0.52);
  g.fill();
  g.strokeStyle = '#a08030';
  g.lineWidth = 1;
  g.stroke();

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

function createNinjaSprite() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const s = size / 2;

  const glow = g.createRadialGradient(s, s, 0, s, s, s * 0.9);
  glow.addColorStop(0, 'rgba(100,0,0,0.15)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = glow;
  g.beginPath(); g.arc(s, s, s * 0.9, 0, Math.PI * 2); g.fill();

  g.fillStyle = '#1a1a1a';
  g.beginPath();
  g.moveTo(s, s * 0.55);
  g.quadraticCurveTo(s * 1.6, s * 1.0, s * 1.3, s * 1.8);
  g.lineTo(s * 0.7, s * 1.8);
  g.quadraticCurveTo(s * 0.4, s * 1.0, s, s * 0.55);
  g.fill();
  g.strokeStyle = '#333';
  g.lineWidth = 1;
  g.stroke();

  g.strokeStyle = '#444';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(s * 0.72, s * 1.15);
  g.lineTo(s * 1.28, s * 1.15);
  g.stroke();

  g.fillStyle = '#e8c898';
  g.beginPath(); g.arc(s, s * 0.48, s * 0.18, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#c0a070';
  g.lineWidth = 0.5;
  g.stroke();

  g.fillStyle = '#cc0000';
  g.beginPath(); g.arc(s - s * 0.06, s * 0.46, 1.5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(s + s * 0.06, s * 0.46, 1.5, 0, Math.PI * 2); g.fill();

  g.fillStyle = '#222';
  g.beginPath();
  g.moveTo(s * 0.15, s * 0.52);
  g.quadraticCurveTo(s, s * 0.18, s * 1.85, s * 0.52);
  g.quadraticCurveTo(s, s * 0.45, s * 0.15, s * 0.52);
  g.fill();
  g.strokeStyle = '#444';
  g.lineWidth = 1;
  g.stroke();

  g.fillStyle = '#2a2a2a';
  g.beginPath();
  g.moveTo(s * 0.55, s * 0.42);
  g.lineTo(s, s * 0.12);
  g.lineTo(s * 1.45, s * 0.42);
  g.quadraticCurveTo(s, s * 0.38, s * 0.55, s * 0.42);
  g.fill();
  g.strokeStyle = '#444';
  g.lineWidth = 0.8;
  g.stroke();

  ninjaSprite = c;
}

function createShurikenSprite() {
  const size = 48;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const s = size / 2;

  g.fillStyle = '#c0c0c0';
  g.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i - Math.PI / 2;
    const nextAngle = (Math.PI / 2) * (i + 0.5) - Math.PI / 2;
    const tipX = s + Math.cos(angle) * s * 0.8;
    const tipY = s + Math.sin(angle) * s * 0.8;
    const innerX = s + Math.cos(nextAngle) * s * 0.25;
    const innerY = s + Math.sin(nextAngle) * s * 0.25;
    if (i === 0) g.moveTo(tipX, tipY);
    else g.lineTo(tipX, tipY);
    g.lineTo(innerX, innerY);
  }
  g.closePath();
  g.fill();

  g.strokeStyle = '#e0e0e0';
  g.lineWidth = 0.5;
  g.stroke();

  g.fillStyle = '#888';
  g.beginPath(); g.arc(s, s, s * 0.12, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#666';
  g.beginPath(); g.arc(s, s, s * 0.06, 0, Math.PI * 2); g.fill();

  shurikenSprite = c;
}

function createMaskedSprite() {
  const size = 48;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const s = size / 2;

  g.fillStyle = '#2a2a2a';
  g.beginPath();
  g.moveTo(s, s * 0.6);
  g.quadraticCurveTo(s * 1.5, s * 1.0, s * 1.25, s * 1.75);
  g.lineTo(s * 0.75, s * 1.75);
  g.quadraticCurveTo(s * 0.5, s * 1.0, s, s * 0.6);
  g.fill();
  g.strokeStyle = '#444';
  g.lineWidth = 0.8;
  g.stroke();

  g.strokeStyle = '#555';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(s * 0.75, s * 1.15);
  g.lineTo(s * 1.25, s * 1.15);
  g.stroke();

  g.fillStyle = '#111';
  g.beginPath(); g.arc(s, s * 0.5, s * 0.2, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#333';
  g.lineWidth = 0.5;
  g.stroke();

  g.fillStyle = '#aa3333';
  g.beginPath(); g.arc(s - s * 0.06, s * 0.48, 1.2, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(s + s * 0.06, s * 0.48, 1.2, 0, Math.PI * 2); g.fill();

  g.fillStyle = '#1a1a1a';
  g.beginPath();
  g.moveTo(s * 0.25, s * 0.55);
  g.quadraticCurveTo(s, s * 0.2, s * 1.75, s * 0.55);
  g.quadraticCurveTo(s, s * 0.48, s * 0.25, s * 0.55);
  g.fill();
  g.strokeStyle = '#333';
  g.lineWidth = 0.8;
  g.stroke();

  maskedSprite = c;
}

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
  cx = W / 2;
  cy = H / 2;
  arenaR = Math.min(W, H) * 0.45;
  scale = arenaR / BASE_R;
  playerR = 15 * scale;
  PLAYER_HIT_R = 10 * scale;
  playerSpeed = PLAYER_SPEED_BASE * scale;
  bambooCache = null;
  // Reposition player if game is running (keep relative position)
  if (running) {
    const pdx = player.x - cx, pdy = player.y - cy;
    const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
    if (pdist > arenaR - playerR) {
      const maxDist = arenaR - playerR;
      player.x = cx + (pdx / pdist) * maxDist;
      player.y = cy + (pdy / pdist) * maxDist;
    }
  } else {
    player.x = cx; player.y = cy;
    drawIdle();
  }
}

function drawIdle() {
  ctx.clearRect(0, 0, W, H);
  drawBambooForest(0);
  drawArena();
  drawPlayer();
}

function drawArena() {
  const S = scale;
  const g = ctx.createRadialGradient(cx, cy, arenaR - 5 * S, cx, cy, arenaR + 15 * S);
  g.addColorStop(0, 'rgba(200,160,60,0.15)');
  g.addColorStop(1, 'rgba(200,160,60,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, arenaR + 15 * S, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(200,160,60,0.4)';
  ctx.lineWidth = 2 * S;
  ctx.beginPath(); ctx.arc(cx, cy, arenaR, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(20,18,12,0.6)';
  ctx.beginPath(); ctx.arc(cx, cy, arenaR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(200,160,60,0.12)';
  ctx.beginPath(); ctx.arc(cx, cy, 4 * S, 0, Math.PI * 2); ctx.fill();
}

// ========== Bamboo Forest Background ==========

function generateBambooForest() {
  const stems = [];
  const leaves = [];
  const fogBlobs = [];

  const numStems = 60;
  for (let i = 0; i < numStems; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = arenaR * 0.55 + Math.random() * arenaR * 1.5;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    const dx = x - cx, dy = y - cy;
    if (Math.sqrt(dx * dx + dy * dy) < arenaR * 0.85) continue;
    if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;

    const layer = Math.random();
    const height = (80 + layer * 200 + Math.random() * 120) * scale;
    const width = (3 + layer * 4 + Math.random() * 3) * scale;
    const green = 20 + layer * 40;
    const r = 10 + layer * 15;
    const g = green + Math.floor(Math.random() * 20);
    const b = 8 + layer * 12;
    const alpha = 0.3 + layer * 0.5;
    const sway = (Math.random() - 0.5) * 8 * scale;

    stems.push({ x, y, height, width, r, g, b, alpha, sway, layer });

    const numLeaves = 3 + Math.floor(layer * 5) + Math.floor(Math.random() * 4);
    for (let j = 0; j < numLeaves; j++) {
      const ly = y - height * (0.15 + Math.random() * 0.8);
      const lx = x + (Math.random() - 0.5) * 30 * scale + sway * ((y - ly) / height);
      const leafLen = (12 + Math.random() * 25) * scale;
      const leafAngle = (Math.random() - 0.5) * 1.5 + (lx > x ? 0.3 : -0.3);
      const leafAlpha = alpha * (0.4 + Math.random() * 0.5);
      const leafG = g + 15 + Math.floor(Math.random() * 25);
      leaves.push({ x: lx, y: ly, len: leafLen, angle: leafAngle, r: r - 5, g: leafG, b: b + 5, alpha: leafAlpha, layer });
    }
  }

  stems.sort((a, b) => a.layer - b.layer);
  leaves.sort((a, b) => a.layer - b.layer);

  const numFog = 15;
  for (let i = 0; i < numFog; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = arenaR * 0.3 + Math.random() * arenaR * 1.8;
    fogBlobs.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      radius: (40 + Math.random() * 100) * scale,
      alpha: 0.03 + Math.random() * 0.06,
      drift: (Math.random() - 0.5) * 0.5,
      phase: Math.random() * Math.PI * 2,
    });
  }

  bambooCache = { stems, leaves, fogBlobs };
}

function drawBambooForest(time) {
  if (!bambooCache) generateBambooForest();
  if (!bambooCache) return;
  const { stems, leaves, fogBlobs } = bambooCache;
  const t = time || 0;

  ctx.fillStyle = '#060d08';
  ctx.fillRect(0, 0, W, H);

  for (const f of fogBlobs) {
    const fx = f.x + Math.sin(t * 0.3 + f.phase) * 20 * scale;
    const fy = f.y + Math.cos(t * 0.2 + f.phase) * 10 * scale;
    const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, f.radius);
    grad.addColorStop(0, `rgba(120,160,130,${f.alpha})`);
    grad.addColorStop(1, 'rgba(120,160,130,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fx, fy, f.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const s of stems) {
    const swayX = Math.sin(t * 0.5 + s.x * 0.01) * s.sway;
    const topX = s.x + swayX;
    ctx.strokeStyle = `rgba(${s.r},${s.g},${s.b},${s.alpha})`;
    ctx.lineWidth = s.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    const midX = s.x + swayX * 0.4;
    const midY = s.y - s.height * 0.5;
    ctx.quadraticCurveTo(midX, midY, topX, s.y - s.height);
    ctx.stroke();

    const nodeCount = 3 + Math.floor(s.layer * 3);
    for (let n = 1; n <= nodeCount; n++) {
      const frac = n / (nodeCount + 1);
      const nx = s.x + swayX * frac * frac;
      const ny = s.y - s.height * frac;
      ctx.strokeStyle = `rgba(${s.r - 5},${s.g - 10},${s.b},${s.alpha * 0.8})`;
      ctx.lineWidth = s.width + 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(nx - s.width * 0.8, ny);
      ctx.lineTo(nx + s.width * 0.8, ny);
      ctx.stroke();
    }
  }

  for (const l of leaves) {
    const lx = l.x + Math.sin(t * 0.7 + l.y * 0.02) * 2 * scale;
    ctx.save();
    ctx.translate(lx, l.y);
    ctx.rotate(l.angle);
    ctx.fillStyle = `rgba(${Math.max(0, l.r)},${Math.min(255, l.g)},${Math.min(255, l.b)},${l.alpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, l.len, l.len * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(${l.r + 20},${l.g - 10},${l.b},${l.alpha * 0.4})`;
    ctx.lineWidth = 0.5 * scale;
    ctx.beginPath();
    ctx.moveTo(-l.len * 0.8, 0);
    ctx.lineTo(l.len * 0.8, 0);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 0; i < fogBlobs.length / 2; i++) {
    const f = fogBlobs[i];
    const fx = f.x + Math.sin(t * 0.4 + f.phase + 2) * 25 * scale;
    const fy = f.y + Math.cos(t * 0.3 + f.phase + 1) * 15 * scale;
    const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, f.radius * 0.7);
    grad.addColorStop(0, `rgba(80,120,90,${f.alpha * 0.6})`);
    grad.addColorStop(1, 'rgba(80,120,90,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fx, fy, f.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  if (!playerSprite) return;
  const sz = playerR * 4;
  ctx.drawImage(playerSprite, player.x - sz / 2, player.y - sz / 2, sz, sz);
}

// ========== Arrow Drawing ==========

function drawArrow(a) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(Math.atan2(a.dy, a.dx));
  const S = scale;
  const len = 24 * S, head = 8 * S;
  ctx.strokeStyle = 'rgba(232,192,96,0.15)';
  ctx.lineWidth = 5 * S;
  ctx.beginPath(); ctx.moveTo(-len - 16 * S, 0); ctx.lineTo(-len, 0); ctx.stroke();
  ctx.strokeStyle = '#d4a840';
  ctx.lineWidth = 2 * S;
  ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(2 * S, 0); ctx.stroke();
  ctx.fillStyle = '#cc3333';
  ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len + 7 * S, -3.5 * S); ctx.lineTo(-len + 7 * S, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len + 7 * S, 3.5 * S); ctx.lineTo(-len + 7 * S, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#dd5555';
  ctx.beginPath(); ctx.moveTo(-len + 2 * S, 0); ctx.lineTo(-len + 9 * S, -2.5 * S); ctx.lineTo(-len + 9 * S, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-len + 2 * S, 0); ctx.lineTo(-len + 9 * S, 2.5 * S); ctx.lineTo(-len + 9 * S, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c0c0c0';
  ctx.beginPath();
  ctx.moveTo(head, 0); ctx.lineTo(head - 7 * S, -3 * S); ctx.lineTo(head - 5 * S, 0); ctx.lineTo(head - 7 * S, 3 * S);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ========== Curved Blade Drawing ==========

function drawBlade(b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(Math.atan2(b.dy, b.dx));
  const S = scale;

  ctx.strokeStyle = 'rgba(180,120,255,0.12)';
  ctx.lineWidth = 6 * S;
  ctx.beginPath(); ctx.moveTo(-20 * S, 0); ctx.lineTo(-10 * S, 0); ctx.stroke();

  ctx.fillStyle = '#5a3a20';
  ctx.beginPath();
  ctx.roundRect(-16 * S, -4 * S, 12 * S, 8 * S, 2 * S);
  ctx.fill();
  ctx.strokeStyle = '#7a5a30';
  ctx.lineWidth = 0.5 * S;
  ctx.stroke();

  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = 0.8 * S;
  for (let i = -14; i < -6; i += 2.5) {
    ctx.beginPath(); ctx.moveTo(i * S, -4 * S); ctx.lineTo(i * S, 4 * S); ctx.stroke();
  }

  ctx.fillStyle = '#b0b0b0';
  ctx.beginPath();
  ctx.roundRect(-4 * S, -5 * S, 4 * S, 10 * S, 1 * S);
  ctx.fill();
  ctx.strokeStyle = '#909090';
  ctx.lineWidth = 0.5 * S;
  ctx.stroke();

  ctx.fillStyle = '#d0d0d0';
  ctx.beginPath();
  ctx.moveTo(0, -4 * S);
  ctx.quadraticCurveTo(10 * S, -9 * S, 20 * S, -1.5 * S);
  ctx.lineTo(20 * S, 1.5 * S);
  ctx.quadraticCurveTo(10 * S, 9 * S, 0, 4 * S);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 0.5 * S;
  ctx.beginPath();
  ctx.moveTo(1 * S, -3.5 * S);
  ctx.quadraticCurveTo(10 * S, -8 * S, 19 * S, -1 * S);
  ctx.stroke();

  ctx.strokeStyle = '#b0b0b0';
  ctx.lineWidth = 0.3 * S;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(12 * S, 1 * S, 19 * S, 0);
  ctx.stroke();

  ctx.restore();
}

// ========== Dagger Drawing ==========

function drawDagger(d) {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(Math.atan2(d.dy, d.dx));
  const S = scale;

  ctx.strokeStyle = 'rgba(255,80,80,0.1)';
  ctx.lineWidth = 5 * S;
  ctx.beginPath(); ctx.moveTo(-14 * S, 0); ctx.lineTo(-8 * S, 0); ctx.stroke();

  ctx.fillStyle = '#4a2a15';
  ctx.beginPath();
  ctx.roundRect(-14 * S, -2.5 * S, 8 * S, 5 * S, 1.5 * S);
  ctx.fill();

  ctx.strokeStyle = '#6a4a2a';
  ctx.lineWidth = 0.6 * S;
  for (let i = -12; i < -8; i += 2) {
    ctx.beginPath(); ctx.moveTo(i * S, -2.5 * S); ctx.lineTo(i * S, 2.5 * S); ctx.stroke();
  }

  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(-6 * S, -3.5 * S, 2.5 * S, 7 * S);

  ctx.fillStyle = '#c8c8c8';
  ctx.beginPath();
  ctx.moveTo(-3.5 * S, -2.5 * S);
  ctx.lineTo(12 * S, 0);
  ctx.lineTo(-3.5 * S, 2.5 * S);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.4 * S;
  ctx.beginPath(); ctx.moveTo(-3 * S, 0); ctx.lineTo(11 * S, 0); ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 0.4 * S;
  ctx.beginPath(); ctx.moveTo(-2 * S, -2 * S); ctx.lineTo(10 * S, -0.3 * S); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2 * S, 2 * S); ctx.lineTo(10 * S, 0.3 * S); ctx.stroke();

  ctx.restore();
}

// ========== Weapon Creation ==========

function addArrow(sx, sy, aimAngle, speed) {
  arrows.push({
    x: sx, y: sy,
    dx: Math.cos(aimAngle) * speed,
    dy: Math.sin(aimAngle) * speed,
    speed,
  });
}

function addBlade(sx, sy, aimAngle, speed, opts = {}) {
  blades.push({
    x: sx, y: sy,
    dx: Math.cos(aimAngle) * speed,
    dy: Math.sin(aimAngle) * speed,
    speed,
    maxSpeed: speed,
    state: 'approach',
    turnProgress: 0,
    turnDuration: 0.6 + Math.random() * 0.4,
    originalAngle: aimAngle,
    exitAngle: opts.exitAngle != null ? opts.exitAngle : aimAngle + Math.PI + (Math.random() - 0.5) * 1.2,
    elapsed: 0,
  });
}

function addDagger(sx, sy, aimAngle, speed, opts = {}) {
  daggers.push({
    x: sx, y: sy,
    dx: Math.cos(aimAngle) * speed,
    dy: Math.sin(aimAngle) * speed,
    speed,
    maxSpeed: speed,
    state: 'approach',
    turnProgress: 0,
    turnDuration: 0.5 + Math.random() * 0.3,
    originalAngle: aimAngle,
    exitAngle: opts.exitAngle != null ? opts.exitAngle : aimAngle + Math.PI + (Math.random() - 0.5) * 1.2,
    elapsed: 0,
  });
}

function spawnArrow() {
  const angle = Math.random() * Math.PI * 2;
  const sx = cx + Math.cos(angle) * arenaR;
  const sy = cy + Math.sin(angle) * arenaR;
  const aimAngle = Math.atan2(cy - sy, cx - sx) + (Math.random() - 0.5) * 0.6;
  const speed = (2 + Math.min(gameTime * 0.015, 4)) * scale;
  addArrow(sx, sy, aimAngle, speed);
}

// ========== Arrow Formation System ==========

function formationLine() {
  const baseAngle = Math.random() * Math.PI * 2;
  const baseX = cx + Math.cos(baseAngle) * arenaR;
  const baseY = cy + Math.sin(baseAngle) * arenaR;
  const aimAngle = Math.atan2(cy - baseY, cx - baseX) + (Math.random() - 0.5) * 0.15;
  const speed = (2.5 + Math.min(gameTime * 0.012, 3)) * scale;
  const perpAngle = baseAngle + Math.PI / 2;
  const spacing = 18 * scale;
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
  const speed = (2.5 + Math.min(gameTime * 0.012, 3)) * scale;
  const count = 12;
  const spread = 0.6;
  for (let i = 0; i < count; i++) {
    const a = centerAim - spread / 2 + (spread / (count - 1)) * i;
    addArrow(baseX, baseY, a, speed);
  }
}

function formationCross() {
  const speed = (2.5 + Math.min(gameTime * 0.012, 2.5)) * scale;
  const dirs = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];
  const spacing = 18 * scale;
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
  const speed = (2.5 + Math.min(gameTime * 0.012, 2.5)) * scale;
  const count = 16;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    addArrow(sx, sy, angle + Math.PI, speed);
  }
}

function formationSpin() {
  const speed = (2.5 + Math.min(gameTime * 0.012, 3)) * scale;
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
  const speed = (2.5 + Math.min(gameTime * 0.012, 2.5)) * scale;
  const angle1 = Math.random() * Math.PI * 2;
  const angle2 = angle1 + Math.PI / 2;
  [angle1, angle2].forEach(baseAngle => {
    const baseX = cx + Math.cos(baseAngle) * arenaR;
    const baseY = cy + Math.sin(baseAngle) * arenaR;
    const oppX = cx + Math.cos(baseAngle + Math.PI) * arenaR;
    const oppY = cy + Math.sin(baseAngle + Math.PI) * arenaR;
    const perpAngle = baseAngle + Math.PI / 2;
    const spacing = 30 * scale;
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

function formationPulse() {
  const baseSpeed = (2 + Math.min(gameTime * 0.01, 2.5)) * scale;
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

function formationVShape() {
  const speed = (2.5 + Math.min(gameTime * 0.012, 3)) * scale;
  const baseAngle = Math.random() * Math.PI * 2;
  const baseX = cx + Math.cos(baseAngle) * arenaR;
  const baseY = cy + Math.sin(baseAngle) * arenaR;
  const centerAim = Math.atan2(cy - baseY, cx - baseX);
  const perpAngle = baseAngle + Math.PI / 2;
  const armLen = 5;
  addArrow(baseX, baseY, centerAim, speed * 1.1);
  for (let arm = 0; arm < 2; arm++) {
    const dir = arm === 0 ? 1 : -1;
    for (let i = 1; i <= armLen; i++) {
      const backOffset = i * 14 * scale;
      const sideOffset = i * 12 * scale * dir;
      const sx = baseX - Math.cos(centerAim) * backOffset + Math.cos(perpAngle) * sideOffset;
      const sy = baseY - Math.sin(centerAim) * backOffset + Math.sin(perpAngle) * sideOffset;
      const dx = sx - cx, dy = sy - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let fx = sx, fy = sy;
      if (dist > arenaR) {
        fx = cx + (dx / dist) * arenaR;
        fy = cy + (dy / dist) * arenaR;
      }
      addArrow(fx, fy, centerAim + (Math.random() - 0.5) * 0.03, speed - i * 0.1 * scale);
    }
  }
}

function formationStorm() {
  const speed = (3 + Math.min(gameTime * 0.015, 3)) * scale;
  const count = 20;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx) + (Math.random() - 0.5) * 0.8;
    addArrow(sx, sy, aimAngle, speed * (0.7 + Math.random() * 0.6));
  }
}

function formationDoubleLine() {
  const baseAngle = Math.random() * Math.PI * 2;
  const speed = (2.5 + Math.min(gameTime * 0.012, 3)) * scale;
  const perpAngle = baseAngle + Math.PI / 2;
  const spacing = 18 * scale;
  const count = 8;
  for (let side = 0; side < 2; side++) {
    const angle = baseAngle + side * Math.PI;
    const baseX = cx + Math.cos(angle) * arenaR;
    const baseY = cy + Math.sin(angle) * arenaR;
    const aimAngle = angle + Math.PI;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spacing;
      const sx = baseX + Math.cos(perpAngle) * offset;
      const sy = baseY + Math.sin(perpAngle) * offset;
      addArrow(sx, sy, aimAngle + (Math.random() - 0.5) * 0.05, speed);
    }
  }
}

function formationDoubleCross() {
  const speed = (2.5 + Math.min(gameTime * 0.012, 2.5)) * scale;
  const baseRotation = Math.random() * Math.PI / 6;
  const dirs = [];
  for (let i = 0; i < 6; i++) dirs.push(baseRotation + (Math.PI / 3) * i);
  const spacing = 15 * scale;
  const count = 6;
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

function getAvailableFormations() {
  const t = gameTime;
  const f = [];
  if (t >= 8)  f.push(formationLine);
  if (t >= 12) f.push(formationFan);
  if (t >= 25) f.push(formationCross);
  if (t >= 35) f.push(formationCircle);
  if (t >= 40) f.push(formationVShape);
  if (t >= 45) f.push(formationSpin);
  if (t >= 55) f.push(formationCrossWeave);
  if (t >= 60) f.push(formationPulse);
  if (t >= 70) f.push(formationDoubleLine);
  if (t >= 80) f.push(formationStorm);
  if (t >= 90) f.push(formationDoubleCross);
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

// ========== Curved Blade System ==========

function spawnBlade() {
  const angle = Math.random() * Math.PI * 2;
  const sx = cx + Math.cos(angle) * arenaR;
  const sy = cy + Math.sin(angle) * arenaR;
  const aimAngle = Math.atan2(cy - sy, cx - sx) + (Math.random() - 0.5) * 0.4;
  const speed = (2.5 + Math.min(gameTime * 0.012, 3)) * scale;
  addBlade(sx, sy, aimAngle, speed);
}

function spawnBladeFormation() {
  const bladeFormations = [bladeFormationScatter, bladeFormationSpiral, bladeFormationCross];
  if (gameTime >= 90) {
    bladeFormations.push(bladeFormationPinwheel, bladeFormationBarrage, bladeFormationSCurve, bladeFormationDualDragon);
  }
  const fn = bladeFormations[Math.floor(Math.random() * bladeFormations.length)];
  fn();
}

function bladeFormationScatter() {
  const count = 3 + Math.floor(Math.min((gameTime - 45) / 30, 5));
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const speed = (2.5 + Math.min(gameTime * 0.01, 2.5)) * scale;
    addBlade(sx, sy, aimAngle, speed);
  }
}

function bladeFormationSpiral() {
  const count = 6;
  const baseAngle = Math.random() * Math.PI * 2;
  const speed = (2.5 + Math.min(gameTime * 0.01, 2)) * scale;
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (i / count) * Math.PI * 2;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const exitAngle = angle + Math.PI * 0.5;
    addBlade(sx, sy, aimAngle, speed, { exitAngle });
  }
}

function bladeFormationCross() {
  const speed = (2.5 + Math.min(gameTime * 0.01, 2)) * scale;
  const count = 4;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const exitAngle = angle + Math.PI / 2 + Math.random() * 0.5;
    addBlade(sx, sy, aimAngle, speed, { exitAngle });
  }
}

function bladeFormationPinwheel() {
  const count = 8;
  const speed = (2.5 + Math.min(gameTime * 0.01, 2)) * scale;
  const rotDir = Math.random() < 0.5 ? 1 : -1;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const exitAngle = angle + Math.PI + rotDir * 1.2;
    addBlade(sx, sy, aimAngle, speed, { exitAngle });
  }
}

function bladeFormationBarrage() {
  const count = 10;
  const speed = (2.5 + Math.min(gameTime * 0.01, 2)) * scale;
  const baseAngle = Math.random() * Math.PI * 2;
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.8;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const exitAngle = Math.random() * Math.PI * 2;
    addBlade(sx, sy, aimAngle, speed, { exitAngle });
  }
}

function bladeFormationSCurve() {
  const count = 6;
  const baseAngle = Math.random() * Math.PI * 2;
  const baseX = cx + Math.cos(baseAngle) * arenaR;
  const baseY = cy + Math.sin(baseAngle) * arenaR;
  const centerAim = Math.atan2(cy - baseY, cx - baseX);
  const perpAngle = baseAngle + Math.PI / 2;
  const speed = (2.5 + Math.min(gameTime * 0.01, 2)) * scale;
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * 22 * scale;
    const sx = baseX + Math.cos(perpAngle) * offset;
    const sy = baseY + Math.sin(perpAngle) * offset;
    const dir = (i % 2 === 0) ? 1 : -1;
    const exitAngle = centerAim + dir * 1.0;
    addBlade(sx, sy, centerAim + (Math.random() - 0.5) * 0.08, speed, { exitAngle });
  }
}

function bladeFormationDualDragon() {
  const speed = (2.5 + Math.min(gameTime * 0.01, 2.5)) * scale;
  const baseAngle = Math.random() * Math.PI * 2;
  const count = 8;
  for (let dragon = 0; dragon < 2; dragon++) {
    const dir = dragon === 0 ? 1 : -1;
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + dir * (i * 0.15);
      const sx = cx + Math.cos(angle) * arenaR;
      const sy = cy + Math.sin(angle) * arenaR;
      const toCenter = Math.atan2(cy - sy, cx - sx);
      const exitAngle = toCenter + Math.PI - dir * 0.8;
      addBlade(sx, sy, toCenter + dir * 0.3, speed, { exitAngle });
    }
  }
}

// ========== Dagger System ==========

function spawnDagger() {
  const angle = Math.random() * Math.PI * 2;
  const sx = cx + Math.cos(angle) * arenaR;
  const sy = cy + Math.sin(angle) * arenaR;
  const aimAngle = Math.atan2(cy - sy, cx - sx) + (Math.random() - 0.5) * 0.4;
  const speed = (2.8 + Math.min(gameTime * 0.015, 3)) * scale;
  addDagger(sx, sy, aimAngle, speed);
}

function spawnDaggerFormation() {
  const daggerFormations = [daggerFormationScatter, daggerFormationCross, daggerFormationSpiral];
  if (gameTime >= 90) {
    daggerFormations.push(daggerFormationPinwheel, daggerFormationBarrage);
  }
  const fn = daggerFormations[Math.floor(Math.random() * daggerFormations.length)];
  fn();
}

function daggerFormationScatter() {
  const count = 3 + Math.floor(Math.min((gameTime - 60) / 30, 5));
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const speed = (2.8 + Math.min(gameTime * 0.01, 2.5)) * scale;
    addDagger(sx, sy, aimAngle, speed);
  }
}

function daggerFormationSpiral() {
  const count = 6;
  const baseAngle = Math.random() * Math.PI * 2;
  const speed = (2.8 + Math.min(gameTime * 0.01, 2)) * scale;
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (i / count) * Math.PI * 2;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const exitAngle = angle + Math.PI * 0.6;
    addDagger(sx, sy, aimAngle, speed, { exitAngle });
  }
}

function daggerFormationCross() {
  const speed = (2.8 + Math.min(gameTime * 0.01, 2)) * scale;
  const count = 4;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const exitAngle = angle + Math.PI / 2 + Math.random() * 0.5;
    addDagger(sx, sy, aimAngle, speed, { exitAngle });
  }
}

function daggerFormationPinwheel() {
  const count = 8;
  const speed = (2.8 + Math.min(gameTime * 0.01, 2)) * scale;
  const rotDir = Math.random() < 0.5 ? 1 : -1;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const exitAngle = angle + Math.PI + rotDir * 1.0;
    addDagger(sx, sy, aimAngle, speed, { exitAngle });
  }
}

function daggerFormationBarrage() {
  const count = 12;
  const speed = (2.8 + Math.min(gameTime * 0.01, 2)) * scale;
  const baseAngle = Math.random() * Math.PI * 2;
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.8;
    const sx = cx + Math.cos(angle) * arenaR;
    const sy = cy + Math.sin(angle) * arenaR;
    const aimAngle = Math.atan2(cy - sy, cx - sx);
    const exitAngle = Math.random() * Math.PI * 2;
    addDagger(sx, sy, aimAngle, speed, { exitAngle });
  }
}

// ========== Shared Turning Weapon Update ==========

function updateTurningWeapon(w, dt) {
  w.elapsed += dt;
  const distToCenter = Math.sqrt((w.x - cx) ** 2 + (w.y - cy) ** 2);

  if (w.state === 'approach') {
    w.x += w.dx * dt * 60;
    w.y += w.dy * dt * 60;
    if (distToCenter < arenaR * 0.45) {
      w.state = 'decelerate';
    }
  }

  if (w.state === 'decelerate') {
    w.dx *= 0.92;
    w.dy *= 0.92;
    w.x += w.dx * dt * 60;
    w.y += w.dy * dt * 60;
    const currentSpeed = Math.sqrt(w.dx * w.dx + w.dy * w.dy);
    if (currentSpeed < w.maxSpeed * 0.35) {
      w.state = 'turning';
      w.turnProgress = 0;
      w.currentAngle = Math.atan2(w.dy, w.dx);
    }
  }

  if (w.state === 'turning') {
    w.turnProgress += dt / w.turnDuration;
    if (w.turnProgress > 1) w.turnProgress = 1;
    const t = w.turnProgress;
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const angleDiff = w.exitAngle - w.currentAngle;
    const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    const newAngle = w.currentAngle + normalizedDiff * ease * 0.08;
    w.currentAngle = newAngle;
    const slowSpeed = w.maxSpeed * 0.2;
    w.dx = Math.cos(newAngle) * slowSpeed;
    w.dy = Math.sin(newAngle) * slowSpeed;
    w.x += w.dx * dt * 60;
    w.y += w.dy * dt * 60;
    if (w.turnProgress >= 1) {
      w.state = 'accelerate';
      w.currentAngle = w.exitAngle;
      w.dx = Math.cos(w.exitAngle) * w.maxSpeed * 0.3;
      w.dy = Math.sin(w.exitAngle) * w.maxSpeed * 0.3;
    }
  }

  if (w.state === 'accelerate') {
    const currentSpeed = Math.sqrt(w.dx * w.dx + w.dy * w.dy);
    if (currentSpeed < w.maxSpeed * 0.9) {
      w.dx *= 1.03;
      w.dy *= 1.03;
    }
    w.x += w.dx * dt * 60;
    w.y += w.dy * dt * 60;
    w.state = 'exit';
  }

  if (w.state === 'exit') {
    w.x += w.dx * dt * 60;
    w.y += w.dy * dt * 60;
  }
}

// ========== Ninja Boss System ==========

function spawnNinja() {
  const edgeAngle = Math.random() * Math.PI * 2;
  const startX = cx + Math.cos(edgeAngle) * arenaR;
  const startY = cy + Math.sin(edgeAngle) * arenaR;
  const targetDist = arenaR * (0.2 + Math.random() * 0.3);
  const targetAngle = Math.random() * Math.PI * 2;
  const targetX = cx + Math.cos(targetAngle) * targetDist;
  const targetY = cy + Math.sin(targetAngle) * targetDist;
  const exitAngle = Math.atan2(targetY - cy, targetX - cx);
  const exitX = cx + Math.cos(exitAngle) * (arenaR + 30 * scale);
  const exitY = cy + Math.sin(exitAngle) * (arenaR + 30 * scale);

  ninjas.push({
    x: startX, y: startY,
    targetX, targetY,
    exitX, exitY,
    state: 'entering',
    speed: 1.2 * scale,
    throwTimer: 0,
    throwCount: 0,
    maxThrows: 5,
    throwInterval: 2.0,
    elapsed: 0,
    hitR: PLAYER_HIT_R + 2 * scale,
  });
}

function updateNinjas(dt) {
  for (let i = ninjas.length - 1; i >= 0; i--) {
    const n = ninjas[i];
    n.elapsed += dt;

    if (n.state === 'entering') {
      const dx = n.targetX - n.x, dy = n.targetY - n.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3 * scale) {
        n.state = 'throwing';
        n.throwTimer = 0;
      } else {
        n.x += (dx / dist) * n.speed * dt * 60;
        n.y += (dy / dist) * n.speed * dt * 60;
      }
    }

    if (n.state === 'throwing') {
      n.throwTimer += dt;
      if (n.throwTimer >= n.throwInterval && n.throwCount < n.maxThrows) {
        n.throwTimer -= n.throwInterval;
        n.throwCount++;
        throwShuriken(n);
      }
      if (n.throwCount >= n.maxThrows) {
        n.state = 'retreating';
      }
    }

    if (n.state === 'retreating') {
      const dx = n.exitX - n.x, dy = n.exitY - n.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3 * scale) {
        ninjas.splice(i, 1);
        continue;
      }
      n.x += (dx / dist) * n.speed * 1.3 * dt * 60;
      n.y += (dy / dist) * n.speed * 1.3 * dt * 60;
    }

    const px = n.x - player.x, py = n.y - player.y;
    if (Math.sqrt(px * px + py * py) < n.hitR + PLAYER_HIT_R) {
      gameOver();
      return;
    }
  }
}

function throwShuriken(ninja) {
  const dx = player.x - ninja.x, dy = player.y - ninja.y;
  const angle = Math.atan2(dy, dx);
  const speed = 3.0 * scale;
  shurikens.push({
    x: ninja.x, y: ninja.y,
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed,
    rotation: 0,
    rotSpeed: 8 + Math.random() * 4,
  });
}

function drawNinja(n) {
  if (!ninjaSprite) return;
  const sz = playerR * 4;
  ctx.drawImage(ninjaSprite, n.x - sz / 2, n.y - sz / 2, sz, sz);
}

function drawShuriken(sh) {
  ctx.save();
  ctx.translate(sh.x, sh.y);
  ctx.rotate(sh.rotation);
  const sz = playerR * 2.5;
  ctx.drawImage(shurikenSprite, -sz / 2, -sz / 2, sz, sz);
  ctx.restore();
}

// ========== Smoke Bomb System ==========

function spawnMaskedMan() {
  const edgeAngle = Math.random() * Math.PI * 2;
  const startX = cx + Math.cos(edgeAngle) * arenaR;
  const startY = cy + Math.sin(edgeAngle) * arenaR;
  const targetDist = arenaR * (0.15 + Math.random() * 0.45);
  const targetAngle = Math.random() * Math.PI * 2;
  const targetX = cx + Math.cos(targetAngle) * targetDist;
  const targetY = cy + Math.sin(targetAngle) * targetDist;
  const exitAngle = edgeAngle + Math.PI;
  const exitX = cx + Math.cos(exitAngle) * (arenaR + 40 * scale);
  const exitY = cy + Math.sin(exitAngle) * (arenaR + 40 * scale);

  maskedMen.push({
    x: startX, y: startY,
    targetX, targetY, exitX, exitY,
    state: 'entering',
    speed: 2.5 * scale,
    throwDone: false,
    done: false,
  });
}

function updateMaskedMen(dt) {
  for (let i = maskedMen.length - 1; i >= 0; i--) {
    const m = maskedMen[i];
    if (m.state === 'entering') {
      const dx = m.targetX - m.x, dy = m.targetY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5 * scale) {
        createSmokeBomb(m.x, m.y);
        m.state = 'retreating';
      } else {
        m.x += (dx / dist) * m.speed * dt * 60;
        m.y += (dy / dist) * m.speed * dt * 60;
      }
    }
    if (m.state === 'retreating') {
      const dx = m.exitX - m.x, dy = m.exitY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5 * scale) {
        maskedMen.splice(i, 1);
        continue;
      }
      m.x += (dx / dist) * m.speed * 1.8 * dt * 60;
      m.y += (dy / dist) * m.speed * 1.8 * dt * 60;
    }
  }
}

function createSmokeBomb(x, y) {
  smokeBombs.push({
    x, y,
    phase: 'explode',
    explodeRadius: 0,
    explodeMaxRadius: 80 * scale,
    explodeTimer: 0,
    explodeDuration: 0.3,
    smokeRadius: 0,
    smokeMaxRadius: (120 + Math.random() * 30) * scale,
    smokeAlpha: 0,
    smokeTimer: 0,
    smokeDuration: 4.5,
    fadeTimer: 0,
    fadeDuration: 1.0,
    particles: [],
    done: false,
  });
  const sb = smokeBombs[smokeBombs.length - 1];
  const count = 25 + Math.floor(Math.random() * 10);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * sb.smokeMaxRadius * 0.9;
    sb.particles.push({
      ox: Math.cos(angle) * dist,
      oy: Math.sin(angle) * dist,
      r: (15 + Math.random() * 30) * scale,
      drift: (Math.random() - 0.5) * 1.2 * scale,
      driftY: (Math.random() - 0.5) * 0.6 * scale,
      phase: Math.random() * Math.PI * 2,
      alphaBase: 0.15 + Math.random() * 0.2,
    });
  }
}

function updateSmokeBombs(dt) {
  for (let i = smokeBombs.length - 1; i >= 0; i--) {
    const sb = smokeBombs[i];
    if (sb.phase === 'explode') {
      sb.explodeTimer += dt;
      const t = Math.min(sb.explodeTimer / sb.explodeDuration, 1);
      sb.explodeRadius = sb.explodeMaxRadius * t;
      if (t >= 1) {
        sb.phase = 'smoke';
        sb.smokeRadius = sb.smokeMaxRadius;
        sb.smokeAlpha = 1;
      }
    } else if (sb.phase === 'smoke') {
      sb.smokeTimer += dt;
      const pulseT = sb.smokeTimer / sb.smokeDuration;
      sb.smokeAlpha = 1 - pulseT * 0.2;
      if (sb.smokeTimer >= sb.smokeDuration) {
        sb.phase = 'fade';
      }
    } else if (sb.phase === 'fade') {
      sb.fadeTimer += dt;
      const t = Math.min(sb.fadeTimer / sb.fadeDuration, 1);
      sb.smokeAlpha = (1 - t) * 0.8;
      if (t >= 1) {
        smokeBombs.splice(i, 1);
      }
    }
    for (const p of sb.particles) {
      p.ox += p.drift * dt;
      p.oy += p.driftY * dt;
    }
  }
}

function drawSmokeBombs() {
  for (const sb of smokeBombs) {
    if (sb.phase === 'explode') {
      const grad = ctx.createRadialGradient(sb.x, sb.y, 0, sb.x, sb.y, sb.explodeRadius);
      grad.addColorStop(0, `rgba(255,220,150,${0.8 * (1 - sb.explodeTimer / sb.explodeDuration)})`);
      grad.addColorStop(0.5, `rgba(200,180,120,${0.4 * (1 - sb.explodeTimer / sb.explodeDuration)})`);
      grad.addColorStop(1, 'rgba(150,130,80,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sb.x, sb.y, sb.explodeRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    if (sb.phase === 'smoke' || sb.phase === 'fade') {
      const alpha = sb.smokeAlpha;
      const S = scale;
      for (const p of sb.particles) {
        const px = sb.x + p.ox + Math.sin(gameTime * 0.8 + p.phase) * 3 * S;
        const py = sb.y + p.oy + Math.cos(gameTime * 0.6 + p.phase) * 2 * S;
        const pAlpha = p.alphaBase * alpha;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r);
        grad.addColorStop(0, `rgba(160,155,145,${pAlpha})`);
        grad.addColorStop(0.6, `rgba(140,135,125,${pAlpha * 0.6})`);
        grad.addColorStop(1, 'rgba(120,115,105,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      const cAlpha = 0.4 * alpha;
      const cGrad = ctx.createRadialGradient(sb.x, sb.y, 0, sb.x, sb.y, sb.smokeMaxRadius * 0.7);
      cGrad.addColorStop(0, `rgba(180,175,165,${cAlpha})`);
      cGrad.addColorStop(1, 'rgba(150,145,135,0)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(sb.x, sb.y, sb.smokeMaxRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMaskedMan(m) {
  if (!maskedSprite) return;
  const sz = playerR * 3.2;
  ctx.drawImage(maskedSprite, m.x - sz / 2, m.y - sz / 2, sz, sz);
}

// ========== Main Update ==========

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
    player.x += (mx / len) * playerSpeed * dt * 60;
    player.y += (my / len) * playerSpeed * dt * 60;
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

  // Spawn arrow formations
  const formationRate = Math.max(1.5, 5 - gameTime * 0.03);
  formationTimer += dt;
  while (formationTimer >= formationRate) {
    formationTimer -= formationRate;
    spawnFormation();
  }

  // Spawn curved blades after 45s
  if (gameTime >= 45) {
    const bladeRate = Math.max(1.5, 5 - (gameTime - 45) * 0.04);
    bladeTimer += dt;
    while (bladeTimer >= bladeRate) {
      bladeTimer -= bladeRate;
      if (gameTime >= 60 && Math.random() < 0.4) {
        spawnBladeFormation();
      } else {
        const count = 1 + Math.floor(Math.min((gameTime - 45) / 30, 3));
        for (let i = 0; i < count; i++) spawnBlade();
      }
    }
  }

  // Spawn daggers after 60s
  if (gameTime >= 60) {
    const daggerRate = Math.max(1.5, 5 - (gameTime - 60) * 0.04);
    daggerTimer += dt;
    while (daggerTimer >= daggerRate) {
      daggerTimer -= daggerRate;
      if (gameTime >= 90 && Math.random() < 0.4) {
        spawnDaggerFormation();
      } else {
        const count = 1 + Math.floor(Math.min((gameTime - 60) / 30, 3));
        for (let i = 0; i < count; i++) spawnDagger();
      }
    }
  }

  // Spawn ninja boss: first at 50s, then every 30s
  ninjaTimer += dt;
  const ninjaInterval = 30;
  const ninjaStart = 50;
  if (gameTime >= ninjaStart && ninjaTimer >= ninjaInterval) {
    ninjaTimer -= ninjaInterval;
    spawnNinja();
  }
  if (gameTime >= ninjaStart && gameTime - dt < ninjaStart) {
    spawnNinja();
    ninjaTimer = 0;
  }

  // Smoke bomb: first at 60s, then every 17s
  smokeTimer += dt;
  const smokeStart = 60;
  const smokeInterval = 17;
  if (gameTime >= smokeStart && smokeTimer >= smokeInterval) {
    smokeTimer -= smokeInterval;
    spawnMaskedMan();
  }
  if (gameTime >= smokeStart && gameTime - dt < smokeStart) {
    spawnMaskedMan();
    smokeTimer = 0;
  }

  updateMaskedMen(dt);
  updateSmokeBombs(dt);
  updateNinjas(dt);

  // Update arrows
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    a.x += a.dx * dt * 60;
    a.y += a.dy * dt * 60;
    const adx = a.x - cx, ady = a.y - cy;
    if (Math.sqrt(adx * adx + ady * ady) > arenaR + 40 * scale) {
      arrows.splice(i, 1);
      continue;
    }
    const cx2 = a.x - player.x, cy2 = a.y - player.y;
    if (Math.sqrt(cx2 * cx2 + cy2 * cy2) < PLAYER_HIT_R + 3 * scale) {
      gameOver();
      return;
    }
  }

  // Update curved blades
  for (let i = blades.length - 1; i >= 0; i--) {
    const b = blades[i];
    updateTurningWeapon(b, dt);
    const bdx = b.x - cx, bdy = b.y - cy;
    if (Math.sqrt(bdx * bdx + bdy * bdy) > arenaR + 40 * scale && b.state === 'exit') {
      blades.splice(i, 1);
      continue;
    }
    const bcx = b.x - player.x, bcy = b.y - player.y;
    if (Math.sqrt(bcx * bcx + bcy * bcy) < PLAYER_HIT_R + 4 * scale) {
      gameOver();
      return;
    }
  }

  // Update daggers
  for (let i = daggers.length - 1; i >= 0; i--) {
    const d = daggers[i];
    updateTurningWeapon(d, dt);
    const ddx = d.x - cx, ddy = d.y - cy;
    if (Math.sqrt(ddx * ddx + ddy * ddy) > arenaR + 40 * scale && d.state === 'exit') {
      daggers.splice(i, 1);
      continue;
    }
    const dcx = d.x - player.x, dcy = d.y - player.y;
    if (Math.sqrt(dcx * dcx + dcy * dcy) < PLAYER_HIT_R + 4 * scale) {
      gameOver();
      return;
    }
  }

  // Update shurikens
  for (let i = shurikens.length - 1; i >= 0; i--) {
    const sh = shurikens[i];
    sh.x += sh.dx * dt * 60;
    sh.y += sh.dy * dt * 60;
    sh.rotation += sh.rotSpeed * dt;
    const sdx = sh.x - cx, sdy = sh.y - cy;
    if (Math.sqrt(sdx * sdx + sdy * sdy) > arenaR + 40 * scale) {
      shurikens.splice(i, 1);
      continue;
    }
    const scx = sh.x - player.x, scy = sh.y - player.y;
    if (Math.sqrt(scx * scx + scy * scy) < PLAYER_HIT_R + 4 * scale) {
      gameOver();
      return;
    }
  }

  score = Math.floor(gameTime * 10);
  scoreText.textContent = `分数: ${score}`;
  timeText.textContent = `时间: ${gameTime.toFixed(1)}s`;
}

// ========== Render ==========

function render() {
  ctx.clearRect(0, 0, W, H);
  drawBambooForest(gameTime);
  drawArena();
  for (const a of arrows) drawArrow(a);
  for (const b of blades) drawBlade(b);
  for (const d of daggers) drawDagger(d);
  for (const n of ninjas) drawNinja(n);
  for (const sh of shurikens) drawShuriken(sh);
  for (const m of maskedMen) drawMaskedMan(m);
  drawSmokeBombs();
  drawPlayer();
}

function loop(ts) {
  if (!running) return;
  if (paused) {
    lastTime = ts;
    animFrame = requestAnimationFrame(loop);
    return;
  }
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  if (running) render(); // only render if not game over
  animFrame = requestAnimationFrame(loop);
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  const pauseEl = document.getElementById('pauseOverlay');
  if (paused) {
    pauseEl.style.display = 'flex';
  } else {
    pauseEl.style.display = 'none';
  }
}

function startGame() {
  player.x = cx; player.y = cy;
  arrows = []; blades = []; daggers = []; shurikens = []; ninjas = []; smokeBombs = []; maskedMen = [];
  score = 0; gameTime = 0; spawnTimer = 0; formationTimer = 0; bladeTimer = 0; daggerTimer = 0; ninjaTimer = 0; smokeTimer = 0;
  running = true;
  gameOverCalled = false;
  paused = false;
  document.getElementById('pauseOverlay').style.display = 'none';
  overlay.classList.remove('active');
  overlay.style.display = 'none';
  hud.style.display = 'flex';
  lastTime = performance.now();
  animFrame = requestAnimationFrame(loop);
}

function gameOver() {
  console.log('[十面埋伏] gameOver() called, gameTime=' + gameTime.toFixed(1) + 's');
  if (gameOverCalled) return;
  gameOverCalled = true;
  running = false;
  cancelAnimationFrame(animFrame);
  hud.style.display = 'none';
  // Render final frame
  render();
  title.textContent = '十面埋伏';
  const t = gameTime;
  let评语;
  if (t < 10) 评语 = '刚进门就被抬走了？弓箭手们还没热身呢！';
  else if (t < 20) 评语 = '嗯……至少你进了场，下次试试别站在箭靶子上？';
  else if (t < 30) 评语 = '看得出来你在认真躲了，路子对了，继续练！';
  else if (t < 40) 评语 = '已有几分章法，再磨练身法，假以时日必成大器。';
  else if (t < 50) 评语 = '身手不凡，江湖中人见你也要让出三分！';
  else if (t < 60) 评语 = '好一个铁骨铮铮的勇士！箭雨之中犹自岿然不动。';
  else if (t < 70) 评语 = '令群雄刮目相看！这般身法，当世鲜有人及。';
  else if (t < 80) 评语 = '此等勇武，足以载入江湖英雄谱！众人敬仰！';
  else if (t < 90) 评语 = '传闻中的绝世高手，今日竟得一见，三生有幸！';
  else if (t < 100) 评语 = '近乎神话！你已超脱凡尘，踏入传说中的武学之境。';
  else if (t < 110) 评语 = '仙人之姿！当世武林，唯你独尊！';
  else if (t < 120) 评语 = '登峰造极，无人可及！你便是这天下的第一！';
  else 评语 = '壮士立于千军万马之间，矢如骤雨而不能伤其分毫，虽力竭而殁，然英魂不灭，千古长存。天地为鉴，日月为证——此战，当为万世之传颂。';
  subtitle.textContent = 评语;
  finalScore.style.display = 'block';
  finalScore.textContent = `得分: ${score}  |  坚持: ${gameTime.toFixed(1)}s`;
  startBtn.textContent = '再来一次';
  overlay.style.display = 'flex';
  overlay.classList.add('active');
  submitScore(score, gameTime);
}

// ========== Leaderboard ==========

function getUsername() {
  return localStorage.getItem('aetherion_user') || null;
}

const LB_KEY = 'aetherion_leaderboard_ambush';

function submitScore(score, time) {
  const user = getUsername();
  const rankMsg = document.getElementById('rankMsg');
  if (!user) {
    rankMsg.style.display = 'block';
    rankMsg.textContent = '登录后可记录成绩到排行榜';
    return;
  }
  try {
    const lb = JSON.parse(localStorage.getItem(LB_KEY) || '[]');
    lb.push({ username: user, score, time, date: new Date().toLocaleDateString('zh-CN') });
    lb.sort((a, b) => b.score - a.score || a.time - b.time);
    if (lb.length > 100) lb.length = 100;
    localStorage.setItem(LB_KEY, JSON.stringify(lb));
    rankMsg.style.display = 'block';
    rankMsg.textContent = '成绩已记录！';
  } catch { /* silently fail */ }
}

function showLeaderboard() {
  const modal = document.getElementById('leaderboardModal');
  const content = document.getElementById('lbContent');
  modal.style.display = 'flex';

  const lb = JSON.parse(localStorage.getItem(LB_KEY) || '[]').slice(0, 20);
  if (!lb.length) { content.innerHTML = '<p style="color:#807060">暂无记录</p>'; return; }

  const username = getUsername();
  let html = `<table style="width:100%;border-collapse:collapse;font-size:0.9rem">
    <tr style="color:#a09070;border-bottom:1px solid #3a3020">
      <th style="padding:0.5rem;text-align:center;width:50px">排名</th>
      <th style="padding:0.5rem;text-align:left">侠客</th>
      <th style="padding:0.5rem;text-align:right">分数</th>
      <th style="padding:0.5rem;text-align:right">存活</th>
      <th style="padding:0.5rem;text-align:right">日期</th>
    </tr>`;
  lb.forEach((e, i) => {
    const isMe = e.username === username;
    const style = isMe ? 'background:rgba(200,160,60,0.12);color:#e0c060' : '';
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
    html += `<tr style="${style};border-bottom:1px solid #1a1810">
      <td style="padding:0.45rem;text-align:center">${medal}</td>
      <td style="padding:0.45rem;text-align:left${isMe ? ';font-weight:bold' : ''}">${e.username}</td>
      <td style="padding:0.45rem;text-align:right;color:#c8a030">${e.score}</td>
      <td style="padding:0.45rem;text-align:right">${e.time}s</td>
      <td style="padding:0.45rem;text-align:right;color:#807060">${e.date || ''}</td>
    </tr>`;
  });
  html += '</table>';
  content.innerHTML = html;
}

window.addEventListener('keydown', e => {
  if (e.code === 'Space' && running) { e.preventDefault(); togglePause(); return; }
  if (paused) { e.preventDefault(); return; }
  keys[e.code] = true; e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('resize', resize);

// Init
createPlayerSprite();
createArrowSprite();
createNinjaSprite();
createShurikenSprite();
createMaskedSprite();
resize();
