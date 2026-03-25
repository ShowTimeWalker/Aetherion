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

app.listen(3456, () => {
  console.log("Auth server running on http://localhost:3456");
});
