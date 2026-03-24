import { existsSync, readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const pnpmDir = join(rootDir, "node_modules", ".pnpm");

const [packageName, ...forwardArgs] = process.argv.slice(2);

if (!packageName) {
  fail("用法: node scripts/node/run-pnpm-bin.mjs <package> [...args]");
}

const packageDir = resolvePackageDir(packageName);
const packageJsonPath = join(packageDir, "package.json");

if (!existsSync(packageJsonPath)) {
  fail(`未找到包配置: ${packageJsonPath}`);
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const binField = packageJson.bin;

if (!binField) {
  fail(`包 ${packageName} 未声明 bin`);
}

const binRelativePath = typeof binField === "string"
  ? binField
  : binField[packageName] ?? Object.values(binField)[0];

if (!binRelativePath) {
  fail(`包 ${packageName} 未找到可执行入口`);
}

const binPath = join(packageDir, binRelativePath);
const result = spawnSync(process.execPath, [binPath, ...forwardArgs], {
  cwd: rootDir,
  stdio: "inherit"
});

if (result.error) {
  fail(`执行 ${packageName} 失败: ${result.error.message}`);
}

process.exit(result.status ?? 1);

function resolvePackageDir(name) {
  if (!existsSync(pnpmDir)) {
    fail(`未找到 pnpm 安装目录: ${pnpmDir}`);
  }

  const encodedName = name.replace("/", "+");
  const matchedEntry = readdirSync(pnpmDir)
    .sort((left, right) => left.localeCompare(right))
    .find((entry) => entry === encodedName || entry.startsWith(`${encodedName}@`));

  if (!matchedEntry) {
    fail(`未在 node_modules/.pnpm 中找到 ${name}`);
  }

  return join(pnpmDir, matchedEntry, "node_modules", name);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
