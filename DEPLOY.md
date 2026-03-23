# DEPLOY.md

## 部署目标

本项目的部署目标是：

- 代码托管在 GitHub 私有仓库
- 本地开发完成后推送到 `main`
- GitHub Actions 自动触发部署
- 云服务器自动拉取最新代码
- 服务器执行 `pnpm build`
- 将 `dist/` 发布到 Nginx 站点目录
- 最终通过 `noah-bot.cloud` 对外访问

---

## 当前部署方案

本期采用 MVP 方案：

1. 前端门户技术栈：`Vite + Vue 3 + TypeScript`
2. 小游戏目录：`games/`
3. 服务器系统：`Ubuntu / Debian`
4. Web 服务：`Nginx`
5. 自动化触发：`GitHub Actions`
6. 发布方式：服务器本机构建后发布静态文件

部署链路如下：

```text
本地修改代码
-> git add / commit / push origin main
-> GitHub Actions 触发
-> Actions SSH 登录服务器
-> 服务器执行 git pull origin main
-> 服务器执行 pnpm build
-> 将 dist/ 同步到 Nginx 发布目录
-> sudo systemctl reload nginx
-> noah-bot.cloud 更新
```

---

## 服务器目录约定

建议服务器使用如下目录：

```text
/opt/aetherion        # Git 仓库工作目录
/var/www/aetherion    # Nginx 对外发布目录
```

说明：

1. `/opt/aetherion`
   - 用于保存 Git 仓库源码
   - GitHub Actions 登录服务器后，在这里执行 `git pull`
   - 再在这里执行 `pnpm build`

2. `/var/www/aetherion`
   - 用于保存实际发布的静态文件
   - Nginx 站点根目录指向这里
   - 最终对外访问的是这个目录，不是源码目录

---

## 服务器环境准备

服务器至少需要安装：

1. `git`
2. `node`
3. `pnpm`
4. `nginx`

### Node 与 pnpm

需要保证服务器可执行：

```bash
node -v
pnpm -v
```

推荐使用稳定版本的 Node 20 或更高版本。

### 初始化源码目录

首次部署前，在服务器准备目录：

```bash
sudo mkdir -p /opt/aetherion
sudo mkdir -p /var/www/aetherion
sudo chown -R <deploy-user>:<deploy-user> /opt/aetherion
sudo chown -R <deploy-user>:<deploy-user> /var/www/aetherion
```

其中 `<deploy-user>` 为部署用户。

---

## GitHub 私有仓库拉取权限

服务器需要能够拉取 GitHub 私有仓库。

这里采用 `Deploy Key`。

### 1. 在服务器生成 SSH Key

```bash
ssh-keygen -t ed25519 -C "aetherion-deploy"
```

假设生成在：

```text
~/.ssh/id_ed25519
~/.ssh/id_ed25519.pub
```

### 2. 将公钥添加到 GitHub 仓库

进入 GitHub 仓库：

`Settings -> Deploy keys -> Add deploy key`

添加：

- Title：`aetherion-server`
- Key：服务器生成的公钥内容
- 权限：只读即可

### 3. 在服务器测试 GitHub 连接

```bash
ssh -T git@github.com
```

然后首次拉取仓库：

```bash
cd /opt/aetherion
git clone git@github.com:<owner>/<repo>.git .
```

---

## GitHub Actions 登录服务器权限

除了服务器拉 GitHub 的 `Deploy Key`，还需要一套独立凭据，让 GitHub Actions 能 SSH 登录服务器执行部署命令。

### 1. 为 Actions 准备登录服务器的 SSH Key

可以在本地或服务器生成一套专门给 Actions 使用的密钥。

公钥写入服务器部署用户的：

```text
~/.ssh/authorized_keys
```

私钥写入 GitHub 仓库 `Secrets`。

### 2. GitHub Secrets 规划

仓库中至少配置以下 Secrets：

| 名称 | 说明 |
| --- | --- |
| `SERVER_HOST` | 服务器 IP 或域名 |
| `SERVER_PORT` | SSH 端口，通常是 `22` |
| `SERVER_USER` | 部署用户名 |
| `SERVER_SSH_KEY` | GitHub Actions 使用的私钥 |

---

## Nginx 配置

站点域名为：

```text
noah-bot.cloud
```

Nginx 的站点根目录建议指向：

```text
/var/www/aetherion
```

### 示例配置

```nginx
server {
    listen 80;
    server_name noah-bot.cloud;

    root /var/www/aetherion;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

说明：

1. 这里使用前端路由兜底到 `index.html`
2. 因为门户使用 Vue Router，所以刷新 `/play/snake` 时也必须能回到前端入口

配置完成后执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 项目构建与发布方式

当前项目的发布目标是 `dist/`。

### 本地开发

```bash
pnpm install
pnpm dev
```

### 生产构建

```bash
pnpm build
```

构建过程会自动做两件事：

1. 扫描 `games/`，生成 `public/game-manifest.json`
2. 将 `games/` 复制到构建产物中

最终产物结构类似：

```text
dist/
  index.html
  assets/
  game-manifest.json
  games/
    snake/
      index.html
      game.js
      style.css
```

---

## 推荐部署脚本逻辑

后续服务器上的部署脚本建议固定为如下逻辑：

```bash
cd /opt/aetherion
git pull origin main
pnpm install --frozen-lockfile
pnpm build
rsync -av --delete dist/ /var/www/aetherion/
sudo systemctl reload nginx
```

说明：

1. `pnpm install --frozen-lockfile`
   - 用于确保依赖与锁文件一致

2. `rsync -av --delete`
   - 用于把最新构建产物同步到站点目录
   - `--delete` 可以清理旧文件，避免残留

3. `reload nginx`
   - 静态站点理论上不一定每次都必须 reload
   - 但保留该步骤更统一

---

## GitHub Actions 计划

后续在仓库中添加：

```text
.github/workflows/deploy.yml
```

核心触发条件：

```yaml
on:
  push:
    branches: [main]
```

工作流职责：

1. 监听 `main` 分支 `push`
2. SSH 登录服务器
3. 远程执行部署命令

建议远程执行的命令尽量收敛到服务器脚本中，不要把过长的部署逻辑全部直接写在 workflow 里。

当前仓库已落地：

```text
.github/workflows/deploy.yml
scripts/server/deploy.sh
```

说明：

1. `.github/workflows/deploy.yml`
   - 监听 `main` 的 `push`
   - 同时支持手动 `workflow_dispatch`
   - 通过 SSH 登录服务器
   - 将仓库内的 `scripts/server/deploy.sh` 直接发送到服务器执行

2. `scripts/server/deploy.sh`
   - 在服务器执行 `git pull --ff-only`
   - 执行 `pnpm install --frozen-lockfile`
   - 执行 `pnpm build`
   - 使用 `rsync -av --delete` 同步 `dist/`
   - 可选执行 `sudo systemctl reload nginx`

### GitHub Actions 必填 Secrets

仓库 `Settings -> Secrets and variables -> Actions` 中至少配置：

| 名称 | 说明 |
| --- | --- |
| `SERVER_HOST` | 服务器 IP 或域名 |
| `SERVER_PORT` | SSH 端口，可填 `22` |
| `SERVER_USER` | 部署用户名 |
| `SERVER_SSH_KEY` | GitHub Actions 使用的私钥 |

### GitHub Actions 可选 Variables

如不配置，则使用默认值：

| 名称 | 默认值 | 说明 |
| --- | --- | --- |
| `SERVER_APP_DIR` | `/opt/aetherion` | 服务器源码目录 |
| `SERVER_SITE_DIR` | `/var/www/aetherion` | Nginx 发布目录 |
| `DEPLOY_BRANCH` | `main` | 部署分支 |
| `NGINX_SERVICE_NAME` | `nginx` | `systemctl reload` 的服务名 |
| `RELOAD_NGINX` | `true` | 是否 reload Nginx |

### 服务器额外要求

为了让 workflow 能稳定执行，服务器还需要满足：

1. `/opt/aetherion` 已经完成首次 `git clone`
2. 部署用户对 `/var/www/aetherion` 有写权限
3. 若启用 `RELOAD_NGINX=true`，部署用户可以无密码执行：

```bash
sudo -n systemctl reload nginx
```

如果当前用户默认需要输入密码，建议通过 `sudoers` 为该命令单独放行，否则 Actions 会在 reload 步骤失败。

---

## 部署验收清单

完成自动部署后，至少验证以下内容：

1. 服务器可手动 `git pull origin main`
2. 服务器可手动 `pnpm build`
3. `dist/` 中存在门户入口和 `dist/games/snake/index.html`
4. Nginx 能正常打开 `http://noah-bot.cloud`
5. 打开 `http://noah-bot.cloud/play/snake` 时可正常进入游戏页面
6. 本地修改门户内容并 `push` 后，线上自动更新
7. 本地修改 `games/snake/` 内容并 `push` 后，线上自动更新

---

## 当前不包含的内容

本期先不做：

1. Docker 化部署
2. 多环境部署
3. 自动回滚
4. 蓝绿发布
5. CDN 分发
6. 用户系统或后台管理

MVP 先保证链路打通，后续再逐步增强。
