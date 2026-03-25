import express from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const USERS_FILE = join(DATA_DIR, "users.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(USERS_FILE)) writeFileSync(USERS_FILE, "[]", "utf-8");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password + "aetherion_salt_2026").digest("hex");
}

function readUsers() {
  return JSON.parse(readFileSync(USERS_FILE, "utf-8"));
}

function writeUsers(users) {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "用户名和密码不能为空" });
  if (username.length < 2 || username.length > 20) return res.status(400).json({ error: "用户名长度 2-20 字符" });
  if (password.length < 4) return res.status(400).json({ error: "密码至少 4 位" });

  const users = readUsers();
  if (users.find((u) => u.username === username)) return res.status(409).json({ error: "用户名已存在" });

  const user = { username, password: hashPassword(password), createdAt: Date.now() };
  users.push(user);
  writeUsers(users);
  res.json({ username, createdAt: user.createdAt });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "用户名和密码不能为空" });

  const users = readUsers();
  const user = users.find((u) => u.username === username && u.password === hashPassword(password));
  if (!user) return res.status(401).json({ error: "用户名或密码错误" });

  // Simple token: base64 encoded username + timestamp
  const token = Buffer.from(JSON.stringify({ username, ts: Date.now() })).toString("base64");
  res.json({ username, token });
});

// ========== Leaderboard ==========

const LEADERBOARD_FILE = join(DATA_DIR, "leaderboard.json");
if (!existsSync(LEADERBOARD_FILE)) writeFileSync(LEADERBOARD_FILE, "[]", "utf-8");

function readLeaderboard() {
  return JSON.parse(readFileSync(LEADERBOARD_FILE, "utf-8"));
}

function writeLeaderboard(data) {
  writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Verify token and return username
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    const payload = JSON.parse(Buffer.from(authHeader.slice(7), "base64"));
    // Token expires after 7 days
    if (Date.now() - payload.ts > 7 * 24 * 60 * 60 * 1000) return null;
    return payload.username;
  } catch { return null; }
}

app.post("/api/leaderboard/submit", (req, res) => {
  const username = verifyToken(req.headers.authorization);
  if (!username) return res.status(401).json({ error: "未登录" });

  const { score, time } = req.body;
  if (typeof score !== "number" || typeof time !== "number") return res.status(400).json({ error: "参数错误" });
  if (score < 0 || time < 0) return res.status(400).json({ error: "参数错误" });

  const lb = readLeaderboard();
  const today = new Date().toISOString().slice(0, 10);
  lb.push({ username, score: Math.floor(score), time: Math.round(time * 10) / 10, date: today });

  // Keep only top 100 per user, then sort by score desc and keep top 200 total
  // Actually just keep top 500 total
  lb.sort((a, b) => b.score - a.score || b.time - a.time);
  writeLeaderboard(lb.slice(0, 500));

  const rank = lb.findIndex(e => e.username === username && e.score === Math.floor(score) && e.time === Math.round(time * 10) / 10) + 1;
  res.json({ rank, message: `你排名第 ${rank}！` });
});

app.get("/api/leaderboard", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const lb = readLeaderboard();
  lb.sort((a, b) => b.score - a.score || b.time - a.time);
  res.json({ leaderboard: lb.slice(0, limit) });
});

app.listen(3456, () => {
  console.log("Auth server running on http://localhost:3456");
});
