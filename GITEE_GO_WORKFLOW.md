# GITEE_GO_WORKFLOW.md

## 文档目的

本文档用于替换旧的 GitHub Actions 部署方案，统一收敛到 `Gitee + Gitee Go + 服务器 Agent` 的发布链路。

核心目标只有一个：让 `push main` 之后，部署动作直接在你的云服务器上执行，避免 GitHub Actions 到云服务器 SSH 连接不稳定的问题。

---

## 新方案总览

新的发布链路如下：

```text
本地修改代码
-> git add / commit / push gitee main
-> Gitee Go 监听 main 分支 push
-> Gitee Go 调用云服务器上的 Agent 主机组
-> 云服务器执行 /opt/aetherion/scripts/server/deploy.sh
-> 服务器 git pull Gitee 仓库最新代码
-> pnpm install --frozen-lockfile
-> pnpm build
-> rsync dist/ 到 /var/www/aetherion/
-> reload nginx
-> noah-bot.cloud 更新
```

和旧方案相比，最关键的变化是：

- 不再需要 `GitHub Actions -> SSH -> 云服务器` 这条不稳定链路
- Gitee 只负责触发流水线
- 真正的部署动作直接在目标服务器本机执行
- 服务器仍然复用现有的 `scripts/server/deploy.sh`

---

## 仓库内的关键文件

### Gitee Go 流水线

文件：

[`/.workflow/MasterPipeline.yml`](C:/Users/Noah/Documents/vscode/Aetherion/.workflow/MasterPipeline.yml)

职责：

- 监听 `main` 分支 push
- 调用 Gitee Go `shell@agent`
- 在指定主机组上执行部署命令

### 服务器部署脚本

文件：

[`/scripts/server/deploy.sh`](C:/Users/Noah/Documents/vscode/Aetherion/scripts/server/deploy.sh)

职责：

- 检查 `git` / `node` / `pnpm` / `rsync`
- 进入 `APP_DIR`
- `git fetch` + `git pull --ff-only`
- `pnpm install --frozen-lockfile`
- `pnpm build`
- `rsync -av --delete dist/ SITE_DIR/`
- 可选 `sudo systemctl reload nginx`

### 旧 GitHub 文档

文件：

[`/GITHUB_ACTION_WORKFLOW.md`](C:/Users/Noah/Documents/vscode/Aetherion/GITHUB_ACTION_WORKFLOW.md)

职责：

- 仅保留为迁移说明入口
- 不再作为当前部署方案文档

---

## 迁移原则

这次迁移只替换“触发平台”，不替换你已经验证过的服务器构建与发布逻辑。

也就是说：

- 保留服务器目录结构：`/opt/aetherion`、`/var/www/aetherion`
- 保留 `deploy.sh`
- 保留 Nginx 静态站点发布方式
- 只把仓库托管与流水线触发从 GitHub 切到 Gitee

---

## 一次性迁移步骤

### 1. 在 Gitee 创建仓库

建议新建私有仓库，例如：

```text
git@gitee.com:<your-namespace>/Aetherion.git
```

如果你希望保留 GitHub 仓库，可以把 GitHub 当备份远端，不再作为生产部署触发源。

### 2. 本地把主推送远端切到 Gitee

如果当前 `origin` 还是 GitHub，可执行：

```bash
git remote rename origin github
git remote add origin git@gitee.com:<your-namespace>/Aetherion.git
git push -u origin main
```

如果你不想改名，也可以只把 `origin` 的 URL 改成 Gitee：

```bash
git remote set-url origin git@gitee.com:<your-namespace>/Aetherion.git
git push -u origin main
```

### 3. 服务器把代码源切到 Gitee

登录服务器后检查 `/opt/aetherion`：

```bash
cd /opt/aetherion
git remote -v
```

如果当前还是 GitHub，改成 Gitee：

```bash
git remote set-url origin git@gitee.com:<your-namespace>/Aetherion.git
```

### 4. 给服务器配置 Gitee 部署公钥

服务器生成一把给 Gitee 拉代码用的 SSH key：

```bash
ssh-keygen -t ed25519 -C "aetherion-server-gitee" -f ~/.ssh/aetherion_gitee_deploy -N ""
```

建议在服务器的 `~/.ssh/config` 中配置：

```sshconfig
Host gitee.com
  HostName gitee.com
  User git
  IdentityFile ~/.ssh/aetherion_gitee_deploy
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
```

然后把公钥内容添加到 Gitee 仓库的“部署公钥管理”。

验证：

```bash
ssh -T git@gitee.com
cd /opt/aetherion
git fetch origin main
```

### 5. 在 Gitee Go 中创建主机组

目标主机就是你的部署服务器。

建议：

- 主机组只绑定这一个仓库
- 直接把 `58.87.71.61` 这台机器纳入主机组
- Agent 安装在部署用户可操作的 Linux 环境中

### 6. 修改流水线里的主机组 ID

仓库中已经新增：

[`/.workflow/MasterPipeline.yml`](C:/Users/Noah/Documents/vscode/Aetherion/.workflow/MasterPipeline.yml)

你需要把里面的：

```yaml
hostGroupID: replace-with-your-host-group-id
```

改成 Gitee Go 主机管理里实际显示的主机组 ID。

如果你的部署目录或服务名不同，也可以直接改同一个文件里的这些变量：

```yaml
export APP_DIR="/opt/aetherion"
export SITE_DIR="/var/www/aetherion"
export BRANCH="main"
export NGINX_SERVICE_NAME="nginx"
export RELOAD_NGINX="true"
```

### 7. 在 Gitee 中保存并启用流水线

仓库提交 `/.workflow/MasterPipeline.yml` 后，到 Gitee 仓库内创建或导入该流水线。

推荐只保留这一条生产流水线，避免多个平台同时部署同一台服务器。

---

## 新流水线实际执行逻辑

`MasterPipeline.yml` 在服务器 Agent 上执行的核心命令是：

```bash
cd /opt/aetherion
bash scripts/server/deploy.sh
```

因此流水线本身非常薄，只负责触发，不负责堆积复杂部署逻辑。

真正的部署步骤仍由：

[`/scripts/server/deploy.sh`](C:/Users/Noah/Documents/vscode/Aetherion/scripts/server/deploy.sh)

完成。

这点很重要，因为后面如果你要加：

- 回滚
- 构建缓存
- 发布日志
- 多环境部署

都应该优先改服务器脚本，而不是把逻辑塞进 YAML。

---

## 当前推荐的日常发布方式

以后发布建议固定为：

```bash
pnpm build
git add .
git commit -m "your message"
git push origin main
```

其中：

- `origin` 指向 Gitee
- `main` 是生产分支
- Gitee Go 自动触发部署

---

## 验收清单

迁移完成后，至少验证以下内容：

1. 本地 `git push origin main` 确实推到 Gitee。
2. 服务器 `git remote -v` 已指向 Gitee。
3. 服务器可手动执行 `git fetch origin main`。
4. Gitee Go 流水线能在目标主机组上启动。
5. 手动在服务器执行 `bash scripts/server/deploy.sh` 仍然成功。
6. Gitee Go 触发后，`/var/www/aetherion` 得到最新 `dist/`。
7. `https://noah-bot.cloud` 首页正常。
8. `/play/snake` 可正常通过 `iframe` 打开游戏。

---

## 常见故障点

### 1. Gitee Go 能触发，但主机组执行失败

通常是：

- Agent 未在线
- 主机组未关联当前仓库
- `hostGroupID` 填错

### 2. 主机组执行成功，但 `git fetch` 失败

通常是：

- 服务器还在用 GitHub remote
- Gitee 部署公钥没加到仓库
- `~/.ssh/config` 没指定 Gitee 使用的私钥

### 3. 构建成功，但站点没更新

通常是：

- `SITE_DIR` 填错
- `rsync` 权限不够
- Nginx root 不是 `/var/www/aetherion`

### 4. 流水线执行到了最后，但 reload nginx 失败

通常是：

- 当前部署用户不能无密码执行：

```bash
sudo -n systemctl reload nginx
```

---

## 为什么这套方案更适合你当前环境

按你现在的实际情况，问题不是 `deploy.sh` 不稳定，而是跨平台远程触发不稳定。

所以这次调整没有去重写发布逻辑，而是直接切掉最脆弱的那一段：

```text
GitHub Actions -> SSH -> 云服务器
```

换成：

```text
Gitee Go -> 服务器 Agent 本机执行
```

这会更贴近国内网络环境，也更符合你现在“服务器本机构建、本机发布”的部署方式。

---

## 参考资料

以下是我对照过的 Gitee 官方帮助文档：

- Gitee Go 快速入门：<https://gitee.com/help/articles/4293>
- Gitee Go 流水线配置说明：<https://gitee.com/help/articles/4358>
- Gitee Go Shell 主机执行：<https://gitee.com/help/articles/4374>
- Gitee Go 主机组管理：<https://gitee.com/help/articles/4363?skip_mobile=true>
- Gitee 部署公钥：<https://gitee.com/help/articles/4180>
- Gitee 生成/添加 SSH 公钥：<https://gitee.com/help/articles/4181>
