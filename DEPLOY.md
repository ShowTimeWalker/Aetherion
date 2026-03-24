# DEPLOY.md

## 部署目标

当前项目的正式部署方案为：

- 代码托管：`Gitee`
- 流水线：`Gitee Go`
- 部署执行位置：云服务器本机
- Web 服务：`Nginx`
- 发布目录：`dist/ -> /var/www/aetherion`

生产域名仍为：

```text
https://noah-bot.cloud
```

---

## 当前部署链路

```text
本地开发
-> git push origin main
-> Gitee Go 监听 main
-> Gitee Go 调用服务器 Agent 主机组
-> 服务器执行 scripts/server/deploy.sh
-> git pull origin main
-> pnpm install --frozen-lockfile
-> pnpm build
-> rsync dist/ /var/www/aetherion/
-> reload nginx
```

---

## 仓库内关键文件

- [`/.workflow/MasterPipeline.yml`](C:/Users/Noah/Documents/vscode/Aetherion/.workflow/MasterPipeline.yml)：Gitee Go 生产流水线
- [`/scripts/server/deploy.sh`](C:/Users/Noah/Documents/vscode/Aetherion/scripts/server/deploy.sh)：服务器部署脚本
- [`/GITEE_GO_WORKFLOW.md`](C:/Users/Noah/Documents/vscode/Aetherion/GITEE_GO_WORKFLOW.md)：完整迁移与配置说明

---

## 服务器目录约定

```text
/opt/aetherion        # Git 工作目录
/var/www/aetherion    # Nginx 对外发布目录
```

说明：

- `/opt/aetherion` 保存源码与构建上下文
- `/var/www/aetherion` 只保存最终静态产物

---

## 服务器环境要求

至少具备：

1. `git`
2. `node`
3. `pnpm`
4. `rsync`
5. `nginx`

建议验证：

```bash
node -v
pnpm -v
git --version
rsync --version
```

---

## Gitee 仓库要求

服务器需要能通过 SSH 拉取 Gitee 私有仓库。

推荐做法：

1. 服务器生成单独的 Gitee 部署密钥
2. 公钥添加到 Gitee 仓库“部署公钥管理”
3. `/opt/aetherion` 的 `origin` 指向 Gitee 仓库

示例：

```bash
ssh-keygen -t ed25519 -C "aetherion-server-gitee" -f ~/.ssh/aetherion_gitee_deploy -N ""
ssh -T git@gitee.com
cd /opt/aetherion
git remote set-url origin git@gitee.com:<your-namespace>/Aetherion.git
git fetch origin main
```

---

## Gitee Go 流水线要求

仓库中已提供基础流水线：

[`/.workflow/MasterPipeline.yml`](C:/Users/Noah/Documents/vscode/Aetherion/.workflow/MasterPipeline.yml)

你需要确认两件事：

1. `hostGroupID` 已替换为真实主机组 ID
2. `APP_DIR` / `SITE_DIR` / `BRANCH` 等变量与你服务器一致

当前默认值为：

```text
APP_DIR=/opt/aetherion
SITE_DIR=/var/www/aetherion
BRANCH=main
NGINX_SERVICE_NAME=nginx
RELOAD_NGINX=true
```

---

## 服务器部署脚本逻辑

`scripts/server/deploy.sh` 的实际逻辑是：

```bash
cd /opt/aetherion
git fetch origin main
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm build
rsync -av --delete dist/ /var/www/aetherion/
sudo -n systemctl reload nginx
```

这也是后续排障时最先应该验证的部分。

---

## 日常发布流程

```bash
pnpm build
git add .
git commit -m "your message"
git push origin main
```

说明：

- `origin` 应指向 Gitee
- `main` 为生产分支
- push 后由 Gitee Go 自动部署

---

## 验收标准

至少确认：

1. `pnpm build` 本地可成功执行
2. Gitee Go 流水线能被 `main` 分支 push 正常触发
3. `dist/game-manifest.json` 已生成
4. `dist/games/<slug>/index.html` 存在
5. 首页能展示对应游戏
6. `/play/<slug>` 可通过 `iframe` 正常打开游戏
7. 服务器 `/var/www/aetherion` 已同步到最新构建产物

---

## 常见排查

### 1. Gitee Go 没触发

优先检查：

- 是否推送到了 Gitee 的 `main`
- `MasterPipeline.yml` 是否已被 Gitee 识别
- 主机组是否绑定当前仓库

### 2. 服务器拉代码失败

优先检查：

- `/opt/aetherion` 的 `origin` 是否还是 GitHub
- Gitee 部署公钥是否已经添加
- `ssh -T git@gitee.com` 是否通过

### 3. 站点未更新

优先检查：

- `SITE_DIR` 是否正确
- `rsync` 是否成功执行
- `Nginx` 根目录是否是 `/var/www/aetherion`

### 4. nginx reload 失败

优先检查：

```bash
sudo -n systemctl reload nginx
```

如果这里需要密码，流水线最后一步就会失败。
