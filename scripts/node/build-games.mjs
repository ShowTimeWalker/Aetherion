import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, join, resolve } from "node:path";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const gamesDir = join(rootDir, "games");
const publicDir = join(rootDir, "public");
const publicGamesDir = join(publicDir, "games");
const manifestPath = join(publicDir, "game-manifest.json");

function toPublicPath(slug, assetPath) {
  if (!assetPath) {
    return undefined;
  }

  if (assetPath.startsWith("/")) {
    return assetPath;
  }

  return `/games/${slug}/${assetPath.replace(/^\.?\//, "")}`;
}

function readGameEntry(entryDir) {
  const slug = basename(entryDir);
  const indexPath = join(entryDir, "index.html");
  const metaPath = join(entryDir, "game.json");

  if (!existsSync(indexPath)) {
    throw new Error(`${slug} 缺少 index.html`);
  }

  if (!existsSync(metaPath)) {
    throw new Error(`${slug} 缺少 game.json`);
  }

  const rawMeta = readFileSync(metaPath, "utf8");
  const parsedMeta = JSON.parse(rawMeta);

  if (parsedMeta.slug && parsedMeta.slug !== slug) {
    throw new Error(`${slug} 的 game.json 中 slug 与目录名不一致`);
  }

  return {
    slug,
    title: parsedMeta.title ?? slug,
    description: parsedMeta.description ?? "",
    cover: toPublicPath(slug, parsedMeta.cover),
    playUrl: `/games/${slug}/index.html`
  };
}

function collectGames() {
  if (!existsSync(gamesDir)) {
    return [];
  }

  const directories = readdirSync(gamesDir)
    .map((name) => join(gamesDir, name))
    .filter((entryPath) => statSync(entryPath).isDirectory())
    .sort((left, right) => left.localeCompare(right));

  return directories.map(readGameEntry);
}

function syncGames() {
  mkdirSync(publicDir, { recursive: true });
  rmSync(publicGamesDir, { recursive: true, force: true });
  mkdirSync(publicGamesDir, { recursive: true });

  if (!existsSync(gamesDir)) {
    return;
  }

  for (const entryName of readdirSync(gamesDir)) {
    const sourcePath = join(gamesDir, entryName);

    if (!statSync(sourcePath).isDirectory()) {
      continue;
    }

    cpSync(sourcePath, join(publicGamesDir, entryName), {
      recursive: true,
      force: true
    });
  }
}

const manifest = collectGames();
syncGames();
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`已同步 ${manifest.length} 个游戏到 public/games`);
