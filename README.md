# Aetherion

Aetherion 是一个基于 Vite + Vue 3 + TypeScript 的小游戏门户项目。

当前特性：

- 门户首页展示游戏列表
- `iframe` 方式统一接入独立静态小游戏
- 构建前自动扫描 `games/` 并生成游戏清单
- 当前已接入 `Snake`、`2048`、`Flappy Bird`
- 已预留 GitHub Actions 自动部署流程

## 跨系统开发说明

如果同一份工作区会在 Windows 和 Ubuntu / WSL 间切换，`vite` / `rollup` / `esbuild` 这类原生依赖不能直接共用另一套系统生成的 `node_modules`。

建议做法：

- 切换系统后优先重新执行一次 `pnpm install`
- 本项目脚本会优先修复 `rollup` 与 `esbuild` 的当前平台原生依赖
- 若你在 WSL 中开发，尽量使用 Linux 环境下安装出来的依赖后再执行 `pnpm dev` / `pnpm build`
