# GITHUB_ACTION_WORKFLOW.md

## 文档目的

本文档整理 Aetherion 项目从本地构建、GitHub 仓库初始化、服务器准备、GitHub Actions 自动部署，到 Nginx 对外发布的完整落地流程。

目标是让后续维护时可以直接按本文档复用，不需要重新摸索整条链路。

---

## 项目现状

当前项目是一个基于 `Vite + Vue 3 + TypeScript` 的小游戏门户，小游戏以独立静态目录形式存在于 `games/` 下。

当前已落地：

- 本地构建命令可用
- GitHub 仓库已初始化并推送
- GitHub Actions 自动部署工作流已接入
- 服务器已完成 Node / pnpm / Nginx / 站点目录准备
- `https://noah-bot.cloud` 已直接指向本项目的静态门户
- `git push origin main` 后可自动部署上线

---

## 项目构建方式

### 本地安装依赖

```bash
pnpm install
```

### 本地开发

```bash
pnpm dev
```

说明：

- `predev` 会先执行 `scripts/node/build-games.mjs`
- 该脚本会扫描 `games/`，生成 `public/game-manifest.json`
- 同时把小游戏复制到 `public/games/`

### 生产构建

```bash
pnpm build
```

说明：

- `prebuild` 会先执行 `scripts/node/build-games.mjs`
- 然后执行：

```bash
vue-tsc --noEmit && vite build
```

### 构建产物

最终发布目录为：

```text
dist/
  index.html
  assets/
  game-manifest.json
  games/
```

`Nginx` 对外服务的根目录应始终指向 `dist` 同步后的发布目录，而不是源码目录。

---

## 仓库与关键文件

### GitHub Actions 工作流

文件：

[`/.github/workflows/deploy.yml`](C:/Users/Noah/Documents/vscode/Aetherion/.github/workflows/deploy.yml)

职责：

- 监听 `main` 分支 `push`
- 支持手动 `workflow_dispatch`
- 读取 GitHub Secrets / Variables
- 使用 SSH 登录服务器
- 将仓库内的部署脚本发送到服务器执行

### 服务器部署脚本

文件：

[`/scripts/server/deploy.sh`](C:/Users/Noah/Documents/vscode/Aetherion/scripts/server/deploy.sh)

职责：

- 检查 `git` / `node` / `pnpm` / `rsync`
- 进入服务器源码目录
- `git fetch` + `git pull --ff-only`
- `pnpm install --frozen-lockfile`
- `pnpm build`
- `rsync -av --delete dist/ /var/www/aetherion/`
- 可选 `sudo systemctl reload nginx`

### 部署说明文档

已有文档：

[`/DEPLOY.md`](C:/Users/Noah/Documents/vscode/Aetherion/DEPLOY.md)

本文档比 `DEPLOY.md` 更偏“实操记录”和“当前环境落地结果”。

---

## 当前实际部署链路

完整链路如下：

```text
本地修改代码
-> git add / commit / push origin main
-> GitHub Actions 监听 main 分支 push
-> Actions 读取 SERVER_HOST / SERVER_PORT / SERVER_USER / SERVER_SSH_KEY
-> Actions 使用 SSH 登录服务器
-> 服务器执行 scripts/server/deploy.sh
-> 服务器在 /opt/aetherion 中 git pull
-> 服务器执行 pnpm install --frozen-lockfile
-> 服务器执行 pnpm build
-> 服务器把 dist/ 同步到 /var/www/aetherion/
-> 服务器 reload nginx
-> https://noah-bot.cloud 更新
```

### Mermaid 时序图

```mermaid
sequenceDiagram
    autonumber
    actor Dev as 开发者
    participant Local as 本地项目
    participant GitHub as GitHub 仓库
    participant Actions as GitHub Actions
    participant Server as 云服务器
    participant Repo as /opt/aetherion
    participant Nginx as /var/www/aetherion + Nginx
    actor User as 访问用户

    Dev->>Local: 修改代码
    Dev->>Local: pnpm build 本地自检
    Dev->>GitHub: git push origin main
    GitHub->>Actions: 触发 deploy.yml
    Actions->>Actions: 读取 Secrets / Variables
    Actions->>Server: 通过 SERVER_SSH_KEY SSH 登录
    Actions->>Server: 发送并执行 scripts/server/deploy.sh
    Server->>Repo: 进入 /opt/aetherion
    Repo->>GitHub: 使用 Deploy Key git fetch / git pull
    GitHub-->>Repo: 返回最新 main 代码
    Repo->>Repo: pnpm install --frozen-lockfile
    Repo->>Repo: pnpm build
    Repo->>Nginx: rsync dist/ -> /var/www/aetherion/
    Repo->>Nginx: sudo systemctl reload nginx
    User->>Nginx: 访问 https://noah-bot.cloud
    Nginx-->>User: 返回最新静态站点内容
```

### 时序图解读

- 开发者只需要负责本地开发、提交和推送
- GitHub 负责监听 `main` 分支变更并触发工作流
- GitHub Actions 使用 `SERVER_SSH_KEY` 登录服务器
- 服务器再用自己的 `Deploy Key` 去 GitHub 拉私有仓库
- 真正的构建动作发生在服务器的 `/opt/aetherion`
- 对外访问时，`Nginx` 实际读取的是 `/var/www/aetherion`

---

## GitHub 仓库初始化过程

本项目目录在开始时已经是一个 Git 仓库，因此不需要再次执行 `git init`。

实际初始化过程是：

```bash
git branch -M main
git add .
git commit -m "first commit"
git remote add origin git@github.com:ShowTimeWalker/Aetherion.git
git push -u origin main
```

### 注意事项

- 目录已经是 Git 仓库时，不要重复 `git init`
- 首次推送前需要确认 `.gitignore` 正确，避免把 `node_modules/`、`dist/` 推到仓库
- Windows 下如遇到 `safe.directory` 错误，需要把项目目录加入 Git 信任目录

例如：

```bash
git config --global --add safe.directory C:/Users/Noah/Documents/vscode/Aetherion
```

---

## GitHub Actions 中用到的关键术语

### CI

`Continuous Integration`

含义：

- 自动检查代码
- 自动构建
- 自动运行测试

### CD

`Continuous Deployment` 或 `Continuous Delivery`

含义：

- 自动把代码发布到服务器

### Secret

GitHub Actions 中加密保存的敏感信息。

例如：

- SSH 私钥
- 服务器地址
- Token

### Variable

GitHub Actions 中的普通配置项。

例如：

- 部署目录
- 分支名
- 服务名

### SSH

远程连接服务器的协议。

在本项目里：

- GitHub Actions 用 SSH 登录服务器
- 服务器也用 SSH 从 GitHub 拉私有仓库

---

## GitHub Actions Secrets 配置

路径：

```text
GitHub Repository
-> Settings
-> Secrets and variables
-> Actions
```

### 必填 Repository Secrets

| 名称 | 当前实际值 | 作用 |
| --- | --- | --- |
| `SERVER_HOST` | `58.87.71.61` | 服务器地址 |
| `SERVER_PORT` | `22` | SSH 端口 |
| `SERVER_USER` | `ubuntu` | GitHub Actions 登录服务器用的用户 |
| `SERVER_SSH_KEY` | GitHub Actions 专用私钥内容 | 让 Actions 可以 SSH 登录服务器 |

### 必填值解释

#### `SERVER_HOST`

服务器公网 IP 或域名。

当前项目使用：

```text
58.87.71.61
```

#### `SERVER_PORT`

服务器 SSH 端口。

当前项目使用：

```text
22
```

#### `SERVER_USER`

GitHub Actions 登录服务器使用的 Linux 用户。

当前项目使用：

```text
ubuntu
```

#### `SERVER_SSH_KEY`

这里填的是 GitHub Actions 使用的私钥全文，不是文件路径。

例如应粘贴：

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

不是填：

```text
C:\Users\Noah\.ssh\aetherion_actions
```

---

## GitHub Actions Variables 配置

可选路径：

```text
GitHub Repository
-> Settings
-> Secrets and variables
-> Actions
-> Variables
```

### 当前工作流支持的 Variables

| 名称 | 默认值 | 作用 |
| --- | --- | --- |
| `SERVER_APP_DIR` | `/opt/aetherion` | 服务器源码目录 |
| `SERVER_SITE_DIR` | `/var/www/aetherion` | Nginx 发布目录 |
| `DEPLOY_BRANCH` | `main` | 部署分支 |
| `NGINX_SERVICE_NAME` | `nginx` | 要 reload 的服务名 |
| `RELOAD_NGINX` | `true` | 是否自动 reload nginx |

如果不配置，工作流会使用默认值。

---

## 两套 SSH 密钥的区别

本项目部署中实际存在两套不同用途的 SSH 权限。

### 1. GitHub Actions -> 服务器

作用：

- 让 GitHub Actions 能登录服务器执行部署脚本

实际使用：

- 私钥放在 GitHub Secret `SERVER_SSH_KEY`
- 对应公钥写入服务器用户的：

```text
~/.ssh/authorized_keys
```

### 2. 服务器 -> GitHub 仓库

作用：

- 让服务器自己可以执行 `git pull origin main`

实际使用：

- 服务器本机保存私钥
- 公钥添加到 GitHub 仓库 `Deploy Keys`

### 为什么要分开

因为这两条链路的方向完全不同：

- GitHub Actions 登录服务器
- 服务器登录 GitHub

如果只配一套，通常不够。

---

## 当前服务器实际配置结果

当前服务器信息：

- 系统：`Ubuntu 24.04 LTS`
- 部署用户：`ubuntu`
- 域名：`noah-bot.cloud`

### 当前已完成

- 已安装 `Node.js 20.20.1`
- 已安装 `pnpm 10.32.1`
- 已安装 `nginx`
- 已安装 `rsync`
- 已创建目录：

```text
/opt/aetherion
/var/www/aetherion
```

- 已保证 `ubuntu` 对这两个目录有权限
- 已确认 `ubuntu` 可以执行：

```bash
sudo -n systemctl reload nginx
```

---

## 服务器初始化过程

### 1. 安装 Node.js 20 和 pnpm

服务器实际安装逻辑：

```bash
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg rsync
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
printf '%s\n' 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main' | sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null
sudo apt-get update -y
sudo apt-get install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@10.32.1 --activate
```

### 2. 创建部署目录

```bash
sudo mkdir -p /opt/aetherion /var/www/aetherion
sudo chown -R ubuntu:ubuntu /opt/aetherion /var/www/aetherion
```

---

## 服务器访问 GitHub 私有仓库的配置

### 服务器生成 Deploy Key

服务器上实际生成了一把 GitHub Deploy Key：

```bash
ssh-keygen -t ed25519 -C "aetherion-server-deploy" -f ~/.ssh/aetherion_github_deploy -N ""
```

### 服务器 SSH 配置

服务器上为 GitHub 配置了专用 SSH 身份：

```text
~/.ssh/config
```

内容逻辑类似：

```sshconfig
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/aetherion_github_deploy
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
```

### GitHub 仓库中添加 Deploy Key

路径：

```text
GitHub Repository
-> Settings
-> Deploy keys
-> Add deploy key
```

说明：

- Title 可以写 `aetherion-server`
- Key 填服务器公钥
- 一般只读即可，不勾选写权限

---

## GitHub Actions 登录服务器的配置

### 本地生成 Actions 专用 SSH Key

本机曾生成：

```bash
ssh-keygen -t ed25519 -C "aetherion-actions"
```

建议保存为：

```text
C:\Users\Noah\.ssh\aetherion_actions
C:\Users\Noah\.ssh\aetherion_actions.pub
```

### 公钥写入服务器

把 `.pub` 公钥写入服务器：

```text
~/.ssh/authorized_keys
```

### 私钥写入 GitHub Secret

把以下私钥文件内容写入：

```text
SERVER_SSH_KEY
```

---

## 当前 Nginx 发布方式

当前 `https://noah-bot.cloud` 已经不再反向代理 OpenClaw，而是直接作为 Vue 静态站点托管。

### 当前设计

- `80` 端口：重定向到 `443`
- `443` 端口：直接读取 `/var/www/aetherion`

### 推荐配置结构

```nginx
server {
    listen 80;
    server_name noah-bot.cloud;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name noah-bot.cloud;

    ssl_certificate /etc/letsencrypt/live/noah-bot.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/noah-bot.cloud/privkey.pem;

    root /var/www/aetherion;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 为什么不是反向代理

因为这个 Vue 项目最终产物是静态文件，不需要后端进程常驻监听端口。

所以：

- OpenClaw：适合 `proxy_pass`
- Aetherion：适合 `root + try_files`

---

## 自动部署验证方式

### 手动验证服务器部署脚本

在服务器执行：

```bash
cd /opt/aetherion
bash scripts/server/deploy.sh
```

若通过，说明服务器侧逻辑没问题。

### 验证 GitHub Actions 是否生效

可以创建一个空提交触发 workflow：

```bash
git commit --allow-empty -m "chore: trigger deploy workflow"
git push origin main
```

然后检查服务器：

```bash
cd /opt/aetherion
git rev-parse --short HEAD
```

如果服务器提交号追上了最新 GitHub 提交号，说明自动部署已打通。

---

## 当前已经验证通过的事实

本项目已经实际验证通过：

- 本地 `pnpm build` 正常
- GitHub 仓库推送正常
- GitHub Actions Secrets 生效
- GitHub Actions 能 SSH 登录服务器
- 服务器能 SSH 读取 GitHub 私有仓库
- 服务器能执行 `git pull`
- 服务器能执行 `pnpm build`
- 服务器能把 `dist/` 同步到 `/var/www/aetherion`
- Nginx reload 正常
- `https://noah-bot.cloud` 可正常访问
- 推送样式修改后，线上会自动更新

---

## 常见问题与排查

### 1. Git 报 safe.directory

症状：

```text
fatal: detected dubious ownership in repository
```

处理：

```bash
git config --global --add safe.directory C:/Users/Noah/Documents/vscode/Aetherion
```

### 2. GitHub Actions 能登录服务器，但服务器 `git pull` 失败

原因：

- 少了服务器到 GitHub 的 Deploy Key
- 或 `~/.ssh/config` 没指定 GitHub 使用的身份文件

### 3. 服务器缺少 node / pnpm

症状：

- `deploy.sh` 报 `Missing required command: node`
- 或 `Missing required command: pnpm`

处理：

- 按本文档的 Node 20 安装过程补齐

### 4. 服务器站点目录没有写权限

症状：

- `rsync` 失败

处理：

```bash
sudo chown -R ubuntu:ubuntu /var/www/aetherion
```

### 5. reload nginx 失败

症状：

- workflow 到最后一步失败

原因：

- 当前用户不能无密码执行 `sudo systemctl reload nginx`

处理：

- 为部署用户放行该命令

### 6. 页面刷新 404

原因：

- Nginx 未配置 Vue Router 的回退路由

处理：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 操作范式

### 日常发布流程

开发完成后：

```bash
git add .
git commit -m "your message"
git push origin main
```

然后等待 GitHub Actions 自动部署。

### 快速自检顺序

1. 本地先执行 `pnpm build`
2. 再 `git push origin main`
3. 到 GitHub 仓库查看 `Actions -> Deploy`
4. 如有需要，登录服务器看：

```bash
cd /opt/aetherion
git rev-parse --short HEAD
```

---

## 后续代办

以下是后续建议继续处理的事项。

### 1. 为 OpenClaw 迁移到单独子域名

当前根域名已经切到 Aetherion。

如果后续还需要 OpenClaw，建议分配一个独立子域名，例如：

- `openclaw.noah-bot.cloud`

然后给 OpenClaw 单独建一个 Nginx `server`。

### 2. 给 GitHub Actions 增加显式构建检查

当前 workflow 是在服务器上构建。

后续可以考虑先在 GitHub Actions 里增加一次：

```bash
pnpm install
pnpm build
```

本地检查成功后再 SSH 部署。

这样可以更早发现前端构建问题。

### 3. 给 workflow 增加失败告警

后续可以接入：

- 邮件通知
- 企业微信 / 飞书 / Telegram / Discord webhook

用于部署失败提醒。

### 4. 给部署流程增加回滚能力

当前是“最新版本覆盖式发布”。

后续可以考虑：

- 保留最近几次构建产物目录
- 失败时回滚到上一版本

### 5. 拆分生产和测试环境

当前只有一套环境。

后续可以增加：

- `dev` / `staging` / `prod`
- 不同分支触发不同服务器部署

### 6. 统一收敛服务器脚本

目前部署脚本已经在仓库中，但服务器准备动作仍有部分是手工完成的。

后续可以继续沉淀：

- `scripts/server/bootstrap.sh`
- `scripts/server/setup-node.sh`
- `scripts/server/setup-nginx.sh`

让初始化更标准化。

### 7. 优化 Nginx 缓存策略

当前静态资源缓存仍是基础版本。

后续可以进一步区分：

- `index.html` 不长缓存
- `assets/*.js` / `assets/*.css` 长缓存
- 游戏静态资源按类型缓存

### 8. 增加监控与日志观测

后续建议加入：

- Nginx access / error log 监控
- GitHub Actions 部署日志归档
- 站点可用性监控

### 9. 为门户补更明显的上线验证标记

例如：

- 页脚显示当前 Git commit short SHA
- 页脚显示最近部署时间

这样可以肉眼确认“线上是不是刚发布的版本”。

### 10. 为项目增加更精简的运维文档

本文档已经比较完整，后续可以再提炼一版：

- `30 秒发布指南`
- `故障排查速查表`

方便未来快速维护。

---

## 结论

当前 Aetherion 已经具备一条可用的自动发布链路：

- 本地改代码
- 推送 GitHub
- GitHub Actions 触发
- SSH 登录服务器
- 服务器拉代码、构建、发布
- `https://noah-bot.cloud` 自动更新

这条链路已经被实际验证通过，可以作为当前项目的正式发布方式继续使用。
