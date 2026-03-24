# 游戏门户图片优化更新

## 更新时间
2026-03-25

## 更新内容

### 1. 创建了游戏封面图片
为所有6个游戏创建了美观的SVG格式封面图片，存放在 `public/images/` 目录：

- **2048.svg** - 橙红渐变背景，大号"2048"数字
- **breakout.svg** - 青绿渐变背景，彩色砖块和挡板
- **flappy-bird.svg** - 紫色渐变背景，可爱的小鸟和绿色管道
- **jump-game.svg** - 粉色渐变背景，跳跃的小人和平台
- **minesweeper.svg** - 深灰渐变背景，经典扫雷界面
- **snake.svg** - 绿色渐变背景，可爱的贪吃蛇

### 2. 更新了游戏清单文件
在 `public/game-manifest.json` 和 `dist/game-manifest.json` 中为每个游戏添加了 `cover` 字段，指向对应的SVG图片。

### 3. 图片特点
- **SVG格式**：矢量图，任意缩放不失真
- **文件小**：总共不到8KB
- **美观**：每个游戏都有独特的渐变背景和代表性图形
- **兼容性好**：所有现代浏览器都支持SVG

## 效果
现在游戏卡片将显示精美的封面图片，而不是之前显示游戏名字第一个字的占位符。

## 文件结构
```
public/
├── images/
│   ├── 2048.svg
│   ├── breakout.svg
│   ├── flappy-bird.svg
│   ├── jump-game.svg
│   ├── minesweeper.svg
│   └── snake.svg
└── game-manifest.json (已更新)

dist/
├── images/ (已复制)
│   ├── 2048.svg
│   ├── breakout.svg
│   ├── flappy-bird.svg
│   ├── jump-game.svg
│   ├── minesweeper.svg
│   └── snake.svg
└── game-manifest.json (已更新)
```

## 后续建议
1. 如果需要重新构建项目，运行 `npm run build` 或 `pnpm build`
2. SVG图片可以根据需要进一步优化或替换
3. 如需使用真实游戏截图，可以替换SVG文件为PNG/JPG格式