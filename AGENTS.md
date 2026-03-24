# AGENTS.md

## 沟通与目标

1. 默认使用中文沟通。
2. 优先给出可执行结果，减少空泛描述。
3. 本项目目标是建设一个小游戏门户：
   - 门户技术栈为 `Vite + Vue 3 + TypeScript`
   - 根目录下的 `games/` 用于存放各个独立小游戏
   - 每个小游戏保持独立静态资源结构
   - 门户负责展示游戏列表与统一入口

---

## 项目结构

当前项目约定如下：

```text
Aetherion/
  src/                  # 门户前端源码
  public/               # 构建前同步生成的静态资源
  games/                # 各小游戏目录
  scripts/node/         # 构建辅助脚本
  dist/                 # 构建产物
  package.json          # 前端项目脚本与依赖
  vite.config.ts        # Vite 配置
```

### 目录职责

1. `src/`
   - 存放门户的 Vue 页面、路由、组件和样式。
   - 门户只负责展示和导航，不直接把小游戏改造成 Vue 子应用。

2. `games/`
   - 每个小游戏单独一个目录，例如 `games/snake/`。
   - 每个游戏目录至少必须包含：
     - `index.html`
     - `game.json`
   - 其他静态资源如 `js`、`css`、图片也放在对应游戏目录内部。

3. `scripts/node/`
   - 放构建辅助脚本。
   - 当前使用 `build-games.mjs` 扫描 `games/` 并生成门户清单，同时同步到 `public/games/`。

4. `public/`
   - 作为 Vite 静态资源目录使用。
   - 构建前会自动生成：
     - `public/game-manifest.json`
     - `public/games/*`
   - 该目录中的自动生成内容不要手工长期维护，优先修改 `games/` 和脚本。

5. `dist/`
   - 构建产物目录。
   - 最终部署到服务器的是这里的内容，不是源码目录。

---

## 小游戏接入规范

新增一个小游戏时，按以下格式组织：

```text
games/<slug>/
  index.html
  game.json
  style.css
  game.js
```

### `game.json` 最小结构

```json
{
  "slug": "snake",
  "title": "贪吃蛇",
  "description": "经典贪吃蛇小游戏"
}
```

### 规则

1. `slug` 应与目录名一致。
2. `index.html` 必须存在。
3. 游戏资源路径优先使用相对路径，避免写死本地绝对路径。
4. 门户通过 `/games/<slug>/index.html` 加载游戏。
5. 门户页中默认通过 `iframe` 嵌入游戏。

---

## 开发与构建命令

项目使用 `pnpm`。

### 常用命令

1. 安装依赖

```bash
pnpm install
```

2. 本地开发

```bash
pnpm dev
```

说明：

- `dev` 前会自动执行 `scripts/node/build-games.mjs`
- 这样门户开发时能直接读取最新的 `games/` 清单和静态资源

3. 生产构建

```bash
pnpm build
```

说明：

- `build` 前会自动执行 `scripts/node/build-games.mjs`
- `build` 会先做类型检查，再由 Vite 输出 `dist/`

4. 本地预览构建产物

```bash
pnpm preview
```

---

## 当前实现状态

当前 MVP 已经具备：

1. 门户首页
2. 游戏详情/游玩页
3. `games/` 自动扫描生成清单
4. 构建时自动把小游戏同步到发布目录
5. 示例游戏 `games/snake/`

当前门户关键页面：

1. `src/views/HomeView.vue`
2. `src/views/PlayView.vue`

当前构建脚本：

1. `scripts/node/build-games.mjs`

---

## MVP 发布方案

目标是把本项目部署到私有云服务器，并通过 `noah-bot.cloud` 对外访问。

### 技术方案

1. 代码托管：GitHub 私有仓库
2. 部署触发：`push` 到 `main` 自动触发
3. 服务器系统：Ubuntu / Debian
4. Web 服务：`Nginx`
5. 构建方式：服务器拉代码后执行 `pnpm build`
6. 发布方式：将 `dist/` 同步到 Nginx 站点目录

### 计划中的部署链路

```text
本地修改代码
-> git add / commit / push origin main
-> GitHub Actions 触发
-> Actions 通过 SSH 登录服务器
-> 服务器 git pull origin main
-> 服务器执行 pnpm build
-> 将 dist/ 同步到站点目录
-> reload nginx
-> noah-bot.cloud 更新
```

### 服务器建议目录

建议使用如下目录：

```text
/opt/aetherion           # Git 工作目录
/var/www/aetherion       # Nginx 对外发布目录
```

### 权限方案

使用两套 SSH 权限：

1. 服务器 -> GitHub
   - 使用仓库 `Deploy Key`
   - 用于服务器拉取私有仓库代码

2. GitHub Actions -> 服务器
   - 使用单独 SSH 私钥
   - 用于远程执行部署命令

### GitHub Secrets 规划

后续部署 workflow 预计需要：

1. `SERVER_HOST`
2. `SERVER_PORT`
3. `SERVER_USER`
4. `SERVER_SSH_KEY`

---

## 修改原则

1. 不要把小游戏直接塞进 `src/`，应放入 `games/`。
2. 不要手工维护 `public/games/` 下的同步产物，优先修改源目录 `games/`。
3. 若新增门户能力，优先保持对现有独立小游戏目录的兼容。
4. 若新增游戏展示字段，应优先扩展 `game.json` 和生成脚本。
5. 发布目标永远是 `dist/`，不要把源码目录直接作为线上站点根目录。

---

## 验收标准

提交涉及门户或游戏接入的变更时，至少应确认：

1. `pnpm build` 能成功执行
2. `dist/game-manifest.json` 已生成
3. `dist/games/<slug>/index.html` 存在
4. 门户首页能展示对应游戏
5. `/play/<slug>` 页面能正常通过 `iframe` 打开游戏

