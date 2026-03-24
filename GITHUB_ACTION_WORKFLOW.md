# GITHUB_ACTION_WORKFLOW.md

## 状态说明

原 GitHub Actions 部署方案已停用。

原因很直接：

- 现有问题出在 `GitHub -> 云服务器` 的远程触发链路不稳定
- 当前项目真正稳定的部分，其实是服务器本机的 `deploy.sh`
- 因此仓库已改为 `Gitee Go + 主机组 Agent + 服务器本机部署`

---

## 当前应查看的文档

请改看：

[`/GITEE_GO_WORKFLOW.md`](C:/Users/Noah/Documents/vscode/Aetherion/GITEE_GO_WORKFLOW.md)

该文档包含：

- 新的部署链路
- Gitee 仓库迁移步骤
- Gitee Go 主机组接入方式
- `/.workflow/MasterPipeline.yml` 的使用说明

---

## 旧方案废弃点

以下内容不再是当前生产部署入口：

- GitHub Actions
- `SERVER_SSH_KEY` 这类 GitHub Actions Secrets
- `.github/workflows/deploy.yml`

保留未变的部分只有：

- 服务器目录结构
- `scripts/server/deploy.sh`
- `pnpm build`
- `dist/ -> /var/www/aetherion/`
- `nginx` 发布模式
