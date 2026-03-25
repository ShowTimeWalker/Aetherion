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
let blades = [];
let daggers = [];
let shurikens = [];
let ninjas = [];
let score = 0;
let gameTime = 0;
let running = false;
let paused = false;
let lastTime = 0;
let spawnTimer = 0;
let formationTimer = 0;
let bladeTimer = 0;
let daggerTimer = 0;
let ninjaTimer = 0;
let keys = {};
let animFrame;

let playerSprite, arrowSprite, ninjaSprite, shurikenSprite;

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

  // Dark glow
  const glow = g.createRadialGradient(s, s, 0, s, s, s * 0.9);
  glow.addColorStop(0, 'rgba(100,0,0,0.15)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = glow;
  g.beginPath(); g.arc(s, s, s * 0.9, 0, Math.PI * 2); g.fill();

  // Black robe
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

  // Belt
  g.strokeStyle = '#444';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(s * 0.72, s * 1.15);
  g.lineTo(s * 1.28, s * 1.15);
  g.stroke();

  // Face
  g.fillStyle = '#e8c898';
  g.beginPath(); g.arc(s, s * 0.48, s * 0.18, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#c0a070';
  g.lineWidth = 0.5;
  g.stroke();

  // Red eyes
  g.fillStyle = '#cc0000';
  g.beginPath(); g.arc(s - s * 0.06, s * 0.46, 1.5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(s + s * 0.06, s * 0.46, 1.5, 0, Math.PI * 2); g.fill();

  // Black hat (斗笠, darker)
  g.fillStyle = '#222';
  g.beginPath();
  g.moveTo(s * 0.15, s * 0.52);
  g.quadraticCurveTo(s, s * 0.18, s * 1.85, s * 0.52);
  g.quadraticCurveTo(s, s * 0.45, s * 0.15, s * 0.52);
  g.fill();
  g.strokeStyle = '#444';
  g.lineWidth = 1;
  g.stroke();

  // Hat top
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

  // Four-pointed shuriken
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

  // Edge highlight
  g.strokeStyle = '#e0e0e0';
  g.lineWidth = 0.5;
  g.stroke();

  // Center circle
  g.fillStyle = '#888';
  g.beginPath(); g.arc(s, s, s * 0.12, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#666';
  g.beginPath(); g.arc(s, s, s * 0.06, 0, Math.PI * 2); g.fill();

  shurikenSprite = c;
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

// ========== Arrow Drawing (straight only) ==========

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

// ========== Curved Blade Drawing (弯刀) ==========

function drawBlade(b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(Math.atan2(b.dy, b.dx));

  // Trail glow (purple tint)
  ctx.strokeStyle = 'rgba(180,120,255,0.12)';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-10, 0); ctx.stroke();

  // Handle (wrapped)
  ctx.fillStyle = '#5a3a20';
  ctx.beginPath();
  ctx.roundRect(-16, -4, 12, 8, 2);
  ctx.fill();
  ctx.strokeStyle = '#7a5a30';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Handle wrap
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = 0.8;
  for (let i = -14; i < -6; i += 2.5) {
    ctx.beginPath(); ctx.moveTo(i, -4); ctx.lineTo(i, 4); ctx.stroke();
  }

  // Guard (metal connector)
  ctx.fillStyle = '#b0b0b0';
  ctx.beginPath();
  ctx.roundRect(-4, -5, 4, 10, 1);
  ctx.fill();
  ctx.strokeStyle = '#909090';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Curved blade (arc shape - streamlined double edge)
  ctx.fillStyle = '#d0d0d0';
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.quadraticCurveTo(10, -9, 20, -1.5);
  ctx.lineTo(20, 1.5);
  ctx.quadraticCurveTo(10, 9, 0, 4);
  ctx.closePath();
  ctx.fill();

  // Edge highlight (top)
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(1, -3.5);
  ctx.quadraticCurveTo(10, -8, 19, -1);
  ctx.stroke();

  // Center ridge
  ctx.strokeStyle = '#b0b0b0';
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(12, 1, 19, 0);
  ctx.stroke();

  ctx.restore();
}

// ========== Dagger Drawing (匕首) ==========

function drawDagger(d) {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(Math.atan2(d.dy, d.dx));

  // Trail glow (reddish)
  ctx.strokeStyle = 'rgba(255,80,80,0.1)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-8, 0); ctx.stroke();

  // Handle
  ctx.fillStyle = '#4a2a15';
  ctx.beginPath();
  ctx.roundRect(-14, -2.5, 8, 5, 1.5);
  ctx.fill();

  // Handle wrap
  ctx.strokeStyle = '#6a4a2a';
  ctx.lineWidth = 0.6;
  for (let i = -12; i < -8; i += 2) {
    ctx.beginPath(); ctx.moveTo(i, -2.5); ctx.lineTo(i, 2.5); ctx.stroke();
  }

  // Guard
  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(-6, -3.5, 2.5, 7);

  // Short blade (double-edged)
  ctx.fillStyle = '#c8c8c8';
  ctx.beginPath();
  ctx.moveTo(-3.5, -2.5);
  ctx.lineTo(12, 0);
  ctx.lineTo(-3.5, 2.5);
  ctx.closePath();
  ctx.fill();

  // Center ridge
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(11, 0); ctx.stroke();

  // Edge highlights
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(10, -0.3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2, 2); ctx.lineTo(10, 0.3); ctx.stroke();

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
  const speed = 2 + Math.min(gameTime * 0.015, 4);
  addArrow(sx, sy, aimAngle, speed);
}

// ========== Arrow Formation System (ALL STRAIGHT) ==========

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

function formationVShape() {
  const speed = 2.5 + Math.min(gameTime * 0.012, 3);
  const baseAngle = Math.random() * Math.PI * 2;
  const baseX = cx + Math.cos(baseAngle) * arenaR;
  const baseY = cy + Math.sin(baseAngle) * arenaR;
  const centerAim = Math.atan2(cy - baseY, cx - baseX);
  const armLen = 5;
  addArrow(baseX, baseY, centerAim, speed * 1.1);
  for (let arm = 0; arm < 2; arm++) {
    const dir = arm === 0 ? 1 : -1;
    const perpAngle = baseAngle + Math.PI / 2;
    for (let i = 1; i <= armLen; i++) {
      const backOffset = i * 14;
      const sideOffset = i * 12 * dir;
      const sx = baseX - Math.cos(centerAim) * backOffset + Math.cos(perpAngle) * sideOffset;
      const sy = baseY - Math.sin(centerAim) * backOffset + Math.sin(perpAngle) * sideOffset;
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

// NEW: Two lines from opposite sides
function formationDoubleLine() {
  const baseAngle = Math.random() * Math.PI * 2;
  const speed = 2.5 + Math.min(gameTime * 0.012, 3);
  const perpAngle = baseAngle + Math.PI / 2;
  const spacing = 18;
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

// NEW: Six-direction cross
function formationDoubleCross() {
  const speed = 2.5 + Math.min(gameTime * 0.012, 2.5);
  const baseRotation = Math.random() * Math.PI / 6;
  const dirs = [];
  for (let i = 0; i < 6; i++) dirs.push(baseRotation + (Math.PI / 3) * i);
  const spacing = 15;
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

// ========== Curved Blade System (弯刀, 45s) ==========

function spawnBlade() {
  const angle = Math.random() * Math.PI * 2;
  const sx = cx + Math.cos(angle) * arenaR;
  const sy = cy + Math.sin(angle) * arenaR;
  const aimAngle = Math.atan2(cy - sy, cx - sx) + (Math.random() - 0.5) * 0.4;
  const speed = 2.5 + Math.min(gameTime * 0.012, 3);
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
    const speed = 2.5 + Math.min(gameTime * 0.01, 2.5);
    addBlade(sx, sy, aimAngle, speed);
  }
}

function bladeFormationSpiral() {
  const count = 6;
  const baseAngle = Math.random() * Math.PI * 2;
  const speed = 2.5 + Math.min(gameTime * 0.01, 2);
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
  const speed = 2.5 + Math.min(gameTime * 0.01, 2);
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
  const speed = 2.5 + Math.min(gameTime * 0.01, 2);
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
  const speed = 2.5 + Math.min(gameTime * 0.01, 2);
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

// S-curve blade formation (blades with alternating exit angles)
function bladeFormationSCurve() {
  const count = 6;
  const baseAngle = Math.random() * Math.PI * 2;
  const baseX = cx + Math.cos(baseAngle) * arenaR;
  const baseY = cy + Math.sin(baseAngle) * arenaR;
  const centerAim = Math.atan2(cy - baseY, cx - baseX);
  const perpAngle = baseAngle + Math.PI / 2;
  const speed = 2.5 + Math.min(gameTime * 0.01, 2);
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * 22;
    const sx = baseX + Math.cos(perpAngle) * offset;
    const sy = baseY + Math.sin(perpAngle) * offset;
    const dir = (i % 2 === 0) ? 1 : -1;
    const exitAngle = centerAim + dir * 1.0;
    addBlade(sx, sy, centerAim + (Math.random() - 0.5) * 0.08, speed, { exitAngle });
  }
}

// Dual dragon blade formation
function bladeFormationDualDragon() {
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
      const exitAngle = toCenter + Math.PI - dir * 0.8;
      addBlade(sx, sy, toCenter + dir * 0.3, speed, { exitAngle });
    }
  }
}

// ========== Dagger System (匕首, 60s) ==========

function spawnDagger() {
  const angle = Math.random() * Math.PI * 2;
  const sx = cx + Math.cos(angle) * arenaR;
  const sy = cy + Math.sin(angle) * arenaR;
  const aimAngle = Math.atan2(cy - sy, cx - sx) + (Math.random() - 0.5) * 0.4;
  const speed = 2.8 + Math.min(gameTime * 0.015, 3);
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
    const speed = 2.8 + Math.min(gameTime * 0.01, 2.5);
    addDagger(sx, sy, aimAngle, speed);
  }
}

function daggerFormationSpiral() {
  const count = 6;
  const baseAngle = Math.random() * Math.PI * 2;
  const speed = 2.8 + Math.min(gameTime * 0.01, 2);
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
  const speed = 2.8 + Math.min(gameTime * 0.01, 2);
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
  const speed = 2.8 + Math.min(gameTime * 0.01, 2);
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
  const speed = 2.8 + Math.min(gameTime * 0.01, 2);
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
    const decelFactor = 0.92;
    w.dx *= decelFactor;
    w.dy *= decelFactor;
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
    const accelFactor = 1.03;
    const currentSpeed = Math.sqrt(w.dx * w.dx + w.dy * w.dy);
    if (currentSpeed < w.maxSpeed * 0.9) {
      w.dx *= accelFactor;
      w.dy *= accelFactor;
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

// ========== Ninja Boss System (黑衣人) ==========

function spawnNinja() {
  const edgeAngle = Math.random() * Math.PI * 2;
  const startX = cx + Math.cos(edgeAngle) * arenaR;
  const startY = cy + Math.sin(edgeAngle) * arenaR;
  // Target: random point inside arena (not too close to edge)
  const targetDist = arenaR * (0.2 + Math.random() * 0.3);
  const targetAngle = Math.random() * Math.PI * 2;
  const targetX = cx + Math.cos(targetAngle) * targetDist;
  const targetY = cy + Math.sin(targetAngle) * targetDist;
  // Exit direction: away from target through center-ish
  const exitAngle = Math.atan2(targetY - cy, targetX - cx);
  const exitX = cx + Math.cos(exitAngle) * (arenaR + 30);
  const exitY = cy + Math.sin(exitAngle) * (arenaR + 30);

  ninjas.push({
    x: startX, y: startY,
    targetX, targetY,
    exitX, exitY,
    state: 'entering', // entering -> throwing -> retreating -> done
    speed: 1.2,
    throwTimer: 0,
    throwCount: 0,
    maxThrows: 5,
    throwInterval: 2.0,
    elapsed: 0,
    hitR: PLAYER_HIT_R + 2,
  });
}

function updateNinjas(dt) {
  for (let i = ninjas.length - 1; i >= 0; i--) {
    const n = ninjas[i];
    n.elapsed += dt;

    if (n.state === 'entering') {
      const dx = n.targetX - n.x, dy = n.targetY - n.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3) {
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
      if (dist < 3) {
        ninjas.splice(i, 1);
        continue;
      }
      n.x += (dx / dist) * n.speed * 1.3 * dt * 60;
      n.y += (dy / dist) * n.speed * 1.3 * dt * 60;
    }

    // Collision with player
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
  const speed = 3.0;
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
  // Spawn first ninja immediately at 50s
  if (gameTime >= ninjaStart && gameTime - dt < ninjaStart) {
    spawnNinja();
    ninjaTimer = 0;
  }

  updateNinjas(dt);

  // Update arrows (STRAIGHT ONLY)
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

  // Update curved blades
  for (let i = blades.length - 1; i >= 0; i--) {
    const b = blades[i];
    updateTurningWeapon(b, dt);
    const bdx = b.x - cx, bdy = b.y - cy;
    if (Math.sqrt(bdx * bdx + bdy * bdy) > arenaR + 40 && b.state === 'exit') {
      blades.splice(i, 1);
      continue;
    }
    const bcx = b.x - player.x, bcy = b.y - player.y;
    if (Math.sqrt(bcx * bcx + bcy * bcy) < PLAYER_HIT_R + 4) {
      gameOver();
      return;
    }
  }

  // Update daggers
  for (let i = daggers.length - 1; i >= 0; i--) {
    const d = daggers[i];
    updateTurningWeapon(d, dt);
    const ddx = d.x - cx, ddy = d.y - cy;
    if (Math.sqrt(ddx * ddx + ddy * ddy) > arenaR + 40 && d.state === 'exit') {
      daggers.splice(i, 1);
      continue;
    }
    const dcx = d.x - player.x, dcy = d.y - player.y;
    if (Math.sqrt(dcx * dcx + dcy * dcy) < PLAYER_HIT_R + 4) {
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
    if (Math.sqrt(sdx * sdx + sdy * sdy) > arenaR + 40) {
      shurikens.splice(i, 1);
      continue;
    }
    const scx = sh.x - player.x, scy = sh.y - player.y;
    if (Math.sqrt(scx * scx + scy * scy) < PLAYER_HIT_R + 4) {
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
  drawArena();
  for (const a of arrows) drawArrow(a);
  for (const b of blades) drawBlade(b);
  for (const d of daggers) drawDagger(d);
  for (const n of ninjas) drawNinja(n);
  for (const sh of shurikens) drawShuriken(sh);
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
  render();
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
  arrows = []; blades = []; daggers = []; shurikens = []; ninjas = [];
  score = 0; gameTime = 0; spawnTimer = 0; formationTimer = 0; bladeTimer = 0; daggerTimer = 0; ninjaTimer = 0;
  running = true;
  paused = false;
  document.getElementById('pauseOverlay').style.display = 'none';
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
resize();
