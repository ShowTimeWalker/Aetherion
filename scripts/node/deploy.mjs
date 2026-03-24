import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const remoteDeployScriptPath = join(rootDir, "scripts", "server", "deploy.sh");
const sshConfigPath = process.env.DEPLOY_SSH_CONFIG ?? join(rootDir, ".local-secrets", "ssh", "server.json");
const sshHelperScriptPath = join(rootDir, "scripts", "node", "ssh_exec.py");

const args = new Set(process.argv.slice(2));
const isDryRun = args.has("--dry-run");

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
const sourceRef = currentBranch || "HEAD";

if (currentBranch && currentBranch !== config.branch) {
  console.log(`当前分支是 ${currentBranch}，将把当前提交发布到 ${config.remote}/${config.branch}`);
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

const remoteCommand = buildRemoteCommand(config);

if (isDryRun) {
  logStep("Dry run 验证完成");
  console.log("已完成本地检查，未执行 git push 或服务器部署。");
  console.log(`计划推送: git push ${config.remote} ${sourceRef}:${config.branch}`);
  console.log(`计划远程命令: ${remoteCommand}`);
  process.exit(0);
}

logStep(`推送 ${sourceRef} -> ${config.remote}/${config.branch}`);
runCommand("git", ["push", config.remote, `${sourceRef}:${config.branch}`]);

logStep("触发服务器部署");
runRemoteDeploy(remoteCommand);

console.log("");
console.log("发布完成。");

function printHelp() {
  console.log(`Aetherion 本地发布脚本

用法:
  pnpm run deploy
  pnpm run deploy -- --skip-build
  pnpm run deploy -- --dry-run

默认行为:
  1. 检查当前分支并确定发布来源
  2. 检查工作区是否干净
  3. 执行本地 pnpm build
  4. 将当前 HEAD 推送到 origin/deploy_gitee
  5. SSH 登录服务器并执行 scripts/server/deploy.sh

附加参数:
  --skip-build  跳过本地构建检查
  --dry-run     只做本地校验并输出计划动作，不执行推送和远程部署

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
  const invocation = getCommandInvocation(command, versionArgs);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: "ignore"
  });

  if (result.error || result.status !== 0) {
    fail(`本机缺少可执行命令: ${command}`);
  }
}

function runCommand(command, commandArgs, options = {}) {
  const invocation = getCommandInvocation(command, commandArgs);
  const result = spawnSync(invocation.command, invocation.args, {
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

  console.error(`未找到本地 SSH 配置: ${sshConfigPath}`);
  console.error("将尝试使用系统 ssh 直接登录服务器。");
  console.error("如果失败，请恢复 .local-secrets/ssh/server.json 或配置可用的 SSH 私钥。");

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

function getCommandInvocation(command, commandArgs) {
  if (process.platform === "win32") {
    if (command === "python") {
      return {
        command: "python.exe",
        args: commandArgs
      };
    }

    if (command === "pnpm") {
      return {
        command: "cmd.exe",
        args: ["/d", "/s", "/c", "pnpm", ...commandArgs]
      };
    }
  }

  return {
    command,
    args: commandArgs
  };
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
