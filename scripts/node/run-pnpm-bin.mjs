import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const nodeModulesCandidates = [
  join(rootDir, "node_modules"),
  join(rootDir, "node_modules.wsl-backup")
];

const [packageName, ...forwardArgs] = process.argv.slice(2);

if (!packageName) {
  fail("用法: node scripts/node/run-pnpm-bin.mjs <package> [...args]");
}

ensureCurrentPlatformDependencies();

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

if (result.error && result.status == null) {
  fail(`执行 ${packageName} 失败: ${result.error.message}`);
}

process.exit(result.status ?? 1);

function resolvePackageDir(name) {
  const preferredNodeModulesDir = resolveNodeModulesDir(name);
  const pnpmDir = join(preferredNodeModulesDir, ".pnpm");

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

function resolveNodeModulesDir(name) {
  const compatibleCandidates = nodeModulesCandidates.filter((candidateDir) => {
    const pnpmDir = join(candidateDir, ".pnpm");

    if (!existsSync(pnpmDir)) {
      return false;
    }

    if (name !== "vite") {
      return hasPackage(pnpmDir, name);
    }

    return hasPackage(pnpmDir, name) && hasCurrentPlatformRollupBinary(pnpmDir);
  });

  if (compatibleCandidates.length > 0) {
    return compatibleCandidates[0];
  }

  const availableCandidates = nodeModulesCandidates.filter((candidateDir) => existsSync(join(candidateDir, ".pnpm")));

  if (availableCandidates.length > 0) {
    return availableCandidates[0];
  }

  fail(`未找到可用依赖目录: ${nodeModulesCandidates.join(", ")}`);
}

function ensureCurrentPlatformDependencies() {
  const currentPnpmDir = join(rootDir, "node_modules", ".pnpm");
  const backupPnpmDir = join(rootDir, "node_modules.wsl-backup", ".pnpm");

  if (!existsSync(currentPnpmDir) || !existsSync(backupPnpmDir)) {
    return;
  }

  const packageNames = [
    getCurrentPlatformRollupPackageName(),
    getCurrentPlatformEsbuildPackageName()
  ].filter(Boolean);

  for (const packageName of packageNames) {
    restorePackageFromBackup(currentPnpmDir, backupPnpmDir, packageName);
  }
}

function restorePackageFromBackup(currentPnpmDir, backupPnpmDir, packageName) {
  const currentPackagePath = getVirtualStoreNodeModulesPackagePath(currentPnpmDir, packageName);

  if (existsSync(currentPackagePath)) {
    return;
  }

  const matchedBackupEntry = findPackageEntry(backupPnpmDir, packageName);

  if (!matchedBackupEntry) {
    return;
  }

  const backupPackagePath = getVirtualStorePackagePath(backupPnpmDir, matchedBackupEntry, packageName);

  if (!existsSync(backupPackagePath)) {
    return;
  }

  mkdirSync(join(currentPackagePath, ".."), { recursive: true });
  rmSync(currentPackagePath, { recursive: true, force: true });
  cpSync(backupPackagePath, currentPackagePath, { recursive: true, force: true });
}

function findPackageEntry(pnpmDir, packageName) {
  const encodedName = packageName.replace("/", "+");

  return readdirSync(pnpmDir)
    .sort((left, right) => left.localeCompare(right))
    .find((entry) => entry === encodedName || entry.startsWith(`${encodedName}@`));
}

function getVirtualStorePackagePath(pnpmDir, entryName, packageName) {
  const segments = packageName.split("/");
  return join(pnpmDir, entryName, "node_modules", ...segments);
}

function getVirtualStoreNodeModulesPackagePath(pnpmDir, packageName) {
  const segments = packageName.split("/");
  return join(pnpmDir, "node_modules", ...segments);
}

function hasPackage(pnpmDir, name) {
  return Boolean(findPackageEntry(pnpmDir, name));
}

function hasCurrentPlatformRollupBinary(pnpmDir) {
  const rollupPackageName = getCurrentPlatformRollupPackageName();

  if (!rollupPackageName) {
    return true;
  }

  if (hasPackage(pnpmDir, rollupPackageName)) {
    return true;
  }

  const packageDirName = rollupPackageName.split("/")[1];
  return existsSync(join(pnpmDir, "node_modules", "@rollup", packageDirName));
}

function getCurrentPlatformEsbuildPackageName() {
  if (process.platform === "win32" && process.arch === "x64") {
    return "@esbuild/win32-x64";
  }

  if (process.platform === "linux" && process.arch === "x64") {
    return "@esbuild/linux-x64";
  }

  return null;
}

function getCurrentPlatformRollupPackageName() {
  if (process.platform === "win32" && process.arch === "x64") {
    return "@rollup/rollup-win32-x64-msvc";
  }

  if (process.platform === "linux" && process.arch === "x64") {
    const report = typeof process.report?.getReport === "function"
      ? process.report.getReport()
      : undefined;
    const isGlibc = Boolean(report?.header?.glibcVersionRuntime);
    return isGlibc
      ? "@rollup/rollup-linux-x64-gnu"
      : "@rollup/rollup-linux-x64-musl";
  }

  return null;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
