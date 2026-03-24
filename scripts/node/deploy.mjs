import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const remoteDeployScriptPath = join(rootDir, "scripts", "server", "deploy.sh");
const sshConfigPath = process.env.DEPLOY_SSH_CONFIG ?? join(rootDir, ".local-secrets", "ssh", "server.json");
const sshHelperScriptPath = join(rootDir, "scripts", "node", "ssh_exec.py");

const args = new Set(process.argv.slice(2));

const config = {
  remote: process.env.DEPLOY_REMOTE ?? "origin",
  branch: process.env.DEPLOY_BRANCH ?? "deploy_gitee",
  serverHost: process.env.DEPLOY_HOST ?? "58.87.71.61",
  serverPort: process.env.DEPLOY_PORT ?? "22",
  serverUser: process.env.DEPLOY_USER ?? "ubuntu",
  appDir: process.env.DEPLOY_APP_DIR ?? "/opt/aetherion",
  siteDir: process.env.DEPLOY_SITE_DIR ?? "/var/www/aetherion",
  nginxServiceName: process.env.DEPLOY_NGINX_SERVICE_NAME ?? "nginx",
  reloadNginx: process.env.DEPLOY_RELOAD_NGINX ?? "true"
};

if (args.has("--help") || args.has("-h")) {
  printHelp();
  process.exit(0);
}

if (!existsSync(remoteDeployScriptPath)) {
  fail(`未找到远程部署脚本: ${remoteDeployScriptPath}`);
}

assertCommand("git", ["--version"]);
assertCommand("pnpm", ["--version"]);
assertSshSupport();

logStep("检查当前分支");
const currentBranch = runCommand("git", ["branch", "--show-current"], { captureStdout: true }).trim();

if (currentBranch !== config.branch) {
  fail(`当前分支是 ${currentBranch || "(unknown)"}，只能从 ${config.branch} 执行发布`);
}

logStep("检查工作区是否干净");
const workingTreeStatus = runCommand("git", ["status", "--short"], { captureStdout: true }).trim();

if (workingTreeStatus) {
  fail("当前工作区存在未提交修改，请先提交后再发布");
}

if (!args.has("--skip-build")) {
  logStep("执行本地构建检查");
  runCommand("pnpm", ["build"]);
}

logStep(`推送 ${config.remote}/${config.branch}`);
runCommand("git", ["push", config.remote, config.branch]);

logStep("触发服务器部署");
const remoteCommand = buildRemoteCommand(config);
runRemoteDeploy(remoteCommand);

console.log("");
console.log("发布完成。");

function printHelp() {
  console.log(`Aetherion 本地发布脚本

用法:
  pnpm deploy
  pnpm deploy -- --skip-build

默认行为:
  1. 检查当前分支是否为 deploy_gitee
  2. 检查工作区是否干净
  3. 执行本地 pnpm build
  4. 推送到 origin/deploy_gitee
  5. SSH 登录服务器并执行 scripts/server/deploy.sh

可覆盖环境变量:
  DEPLOY_REMOTE
  DEPLOY_BRANCH
  DEPLOY_HOST
  DEPLOY_PORT
  DEPLOY_USER
  DEPLOY_SSH_CONFIG
  DEPLOY_APP_DIR
  DEPLOY_SITE_DIR
  DEPLOY_NGINX_SERVICE_NAME
  DEPLOY_RELOAD_NGINX
`);
}

function buildRemoteCommand(currentConfig) {
  const envAssignments = [
    ["APP_DIR", currentConfig.appDir],
    ["SITE_DIR", currentConfig.siteDir],
    ["BRANCH", currentConfig.branch],
    ["REMOTE", currentConfig.remote],
    ["NGINX_SERVICE_NAME", currentConfig.nginxServiceName],
    ["RELOAD_NGINX", currentConfig.reloadNginx]
  ]
    .map(([key, value]) => `${key}=${quoteForShell(value)}`)
    .join(" ");

  return `${envAssignments} bash -s`;
}

function quoteForShell(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function assertSshSupport() {
  if (existsSync(sshConfigPath)) {
    assertCommand("python", ["--version"]);
    return;
  }

  assertCommand("ssh", ["-V"]);
}

function assertCommand(command, versionArgs) {
  const result = spawnSync(resolveCommand(command), versionArgs, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: "ignore"
  });

  if (result.error || result.status !== 0) {
    fail(`本机缺少可执行命令: ${command}`);
  }
}

function runCommand(command, commandArgs, options = {}) {
  const result = spawnSync(resolveCommand(command), commandArgs, {
    cwd: rootDir,
    encoding: "utf8",
    input: options.input,
    stdio: options.captureStdout ? ["pipe", "pipe", "inherit"] : ["pipe", "inherit", "inherit"]
  });

  if (result.error) {
    fail(`执行失败: ${command} ${commandArgs.join(" ")}\n${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`命令退出码异常: ${command} ${commandArgs.join(" ")}`);
  }

  return result.stdout ?? "";
}

function runRemoteDeploy(remoteCommand) {
  if (existsSync(sshConfigPath)) {
    runCommand("python", [
      sshHelperScriptPath,
      "--config",
      sshConfigPath,
      "--command",
      remoteCommand,
      "--input-file",
      remoteDeployScriptPath
    ]);
    return;
  }

  const remoteScript = readFileSync(remoteDeployScriptPath, "utf8");

  runCommand(
    "ssh",
    [
      "-o",
      "BatchMode=yes",
      "-o",
      "ConnectTimeout=10",
      "-p",
      config.serverPort,
      `${config.serverUser}@${config.serverHost}`,
      remoteCommand
    ],
    {
      input: remoteScript
    }
  );
}

function resolveCommand(command) {
  if (process.platform === "win32") {
    if (command === "pnpm") {
      return "pnpm.cmd";
    }

    if (command === "python") {
      return "python.exe";
    }
  }

  return command;
}

function logStep(message) {
  console.log("");
  console.log(`==> ${message}`);
}

function fail(message) {
  console.error("");
  console.error(`发布失败: ${message}`);
  process.exit(1);
}
