// 游戏配置
const CONFIG = {
    canvas: {
        width: 800,
        height: 600
    },
    paddle: {
        width: 120,
        height: 15,
        speed: 8,
        color: '#00d4ff'
    },
    ball: {
        radius: 10,
        speed: 5,
        color: '#ffffff'
    },
    brick: {
        rows: 5,
        cols: 10,
        width: 70,
        height: 25,
        padding: 8,
        offsetTop: 60,
        offsetLeft: 35,
        colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff']
    }
};

// 游戏状态
const game = {
    canvas: null,
    ctx: null,
    score: 0,
    lives: 3,
    isRunning: false,
    animationId: null,
    paddle: null,
    ball: null,
    bricks: []
};

// 挡板对象
class Paddle {
    constructor() {
        this.width = CONFIG.paddle.width;
        this.height = CONFIG.paddle.height;
        this.x = (CONFIG.canvas.width - this.width) / 2;
        this.y = CONFIG.canvas.height - this.height - 20;
        this.speed = CONFIG.paddle.speed;
        this.color = CONFIG.paddle.color;
        this.dx = 0;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 5);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // 添加高光效果
        ctx.beginPath();
        ctx.roundRect(this.x + 5, this.y + 2, this.width - 10, 5, 3);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.x += this.dx;

        // 边界检测
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CONFIG.canvas.width) {
            this.x = CONFIG.canvas.width - this.width;
        }
    }

    moveLeft() {
        this.dx = -this.speed;
    }

    moveRight() {
        this.dx = this.speed;
    }

    stop() {
        this.dx = 0;
    }
}

// 球对象
class Ball {
    constructor() {
        this.radius = CONFIG.ball.radius;
        this.x = CONFIG.canvas.width / 2;
        this.y = CONFIG.canvas.height - 50;
        this.speed = CONFIG.ball.speed;
        this.dx = this.speed;
        this.dy = -this.speed;
        this.color = CONFIG.ball.color;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // 添加高光效果
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, this.radius / 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
        ctx.closePath();
    }

    update(paddle, bricks) {
        this.x += this.dx;
        this.y += this.dy;

        // 左右墙壁碰撞
        if (this.x + this.radius > CONFIG.canvas.width || this.x - this.radius < 0) {
            this.dx = -this.dx;
        }

        // 顶部墙壁碰撞
        if (this.y - this.radius < 0) {
            this.dy = -this.dy;
        }

        // 挡板碰撞检测
        if (this.y + this.radius > paddle.y &&
            this.y - this.radius < paddle.y + paddle.height &&
            this.x > paddle.x &&
            this.x < paddle.x + paddle.width) {
            
            // 根据击中挡板的位置调整角度
            const hitPoint = (this.x - paddle.x) / paddle.width;
            const angle = (hitPoint - 0.5) * Math.PI * 0.7;
            const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            
            this.dx = Math.sin(angle) * speed;
            this.dy = -Math.abs(Math.cos(angle) * speed);
        }

        // 底部出界
        if (this.y + this.radius > CONFIG.canvas.height) {
            return 'dead';
        }

        // 砖块碰撞检测
        for (let row = 0; row < bricks.length; row++) {
            for (let col = 0; col < bricks[row].length; col++) {
                const brick = bricks[row][col];
                if (!brick.destroyed) {
                    if (this.x + this.radius > brick.x &&
                        this.x - this.radius < brick.x + brick.width &&
                        this.y + this.radius > brick.y &&
                        this.y - this.radius < brick.y + brick.height) {
                        
                        this.dy = -this.dy;
                        brick.destroyed = true;
                        return { hit: true, score: brick.points };
                    }
                }
            }
        }

        return { hit: false };
    }
}

// 砖块对象
class Brick {
    constructor(x, y, color, points) {
        this.width = CONFIG.brick.width;
        this.height = CONFIG.brick.height;
        this.x = x;
        this.y = y;
        this.color = color;
        this.points = points;
        this.destroyed = false;
    }

    draw(ctx) {
        if (this.destroyed) return;

        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 5);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // 添加边框
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 5);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // 添加高光效果
        ctx.beginPath();
        ctx.roundRect(this.x + 3, this.y + 3, this.width - 6, 8, 3);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.closePath();
    }
}

// 初始化游戏
function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    
    resetGame();
    setupEventListeners();
}

// 重置游戏
function resetGame() {
    game.score = 0;
    game.lives = 3;
    game.isRunning = false;
    
    game.paddle = new Paddle();
    game.ball = new Ball();
    game.bricks = createBricks();
    
    updateUI();
    showOverlay('打砖块', '使用左右箭头键或鼠标移动挡板', '开始游戏');
}

// 创建砖块
function createBricks() {
    const bricks = [];
    const { rows, cols, width, height, padding, offsetTop, offsetLeft, colors } = CONFIG.brick;
    
    for (let row = 0; row < rows; row++) {
        bricks[row] = [];
        for (let col = 0; col < cols; col++) {
            const x = col * (width + padding) + offsetLeft;
            const y = row * (height + padding) + offsetTop;
            const color = colors[row % colors.length];
            const points = (rows - row) * 10; // 上面的砖块分数更高
            bricks[row][col] = new Brick(x, y, color, points);
        }
    }
    
    return bricks;
}

// 事件监听
function setupEventListeners() {
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (!game.isRunning) return;
        
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            game.paddle.moveLeft();
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            game.paddle.moveRight();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || 
            e.key === 'ArrowRight' || e.key === 'd') {
            game.paddle.stop();
        }
    });

    // 鼠标控制
    game.canvas.addEventListener('mousemove', (e) => {
        if (!game.isRunning) return;
        
        const rect = game.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const scaleX = game.canvas.width / rect.width;
        const actualX = mouseX * scaleX;
        
        game.paddle.x = actualX - game.paddle.width / 2;
        
        if (game.paddle.x < 0) game.paddle.x = 0;
        if (game.paddle.x + game.paddle.width > CONFIG.canvas.width) {
            game.paddle.x = CONFIG.canvas.width - game.paddle.width;
        }
    });

    // 触摸控制
    game.canvas.addEventListener('touchmove', (e) => {
        if (!game.isRunning) return;
        e.preventDefault();
        
        const rect = game.canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const scaleX = game.canvas.width / rect.width;
        const actualX = touchX * scaleX;
        
        game.paddle.x = actualX - game.paddle.width / 2;
        
        if (game.paddle.x < 0) game.paddle.x = 0;
        if (game.paddle.x + game.paddle.width > CONFIG.canvas.width) {
            game.paddle.x = CONFIG.canvas.width - game.paddle.width;
        }
    }, { passive: false });

    // 开始按钮
    document.getElementById('startBtn').addEventListener('click', startGame);
}

// 开始游戏
function startGame() {
    hideOverlay();
    game.isRunning = true;
    gameLoop();
}

// 游戏主循环
function gameLoop() {
    if (!game.isRunning) return;
    
    // 清空画布
    game.ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    
    // 更新和绘制挡板
    game.paddle.update();
    game.paddle.draw(game.ctx);
    
    // 更新和绘制球
    const result = game.ball.update(game.paddle, game.bricks);
    game.ball.draw(game.ctx);
    
    // 处理球的状态
    if (result === 'dead') {
        game.lives--;
        updateUI();
        
        if (game.lives <= 0) {
            gameOver();
            return;
        } else {
            // 重置球的位置
            game.ball = new Ball();
        }
    } else if (result.hit) {
        game.score += result.score;
        updateUI();
        
        // 检查是否胜利
        if (checkWin()) {
            victory();
            return;
        }
    }
    
    // 绘制砖块
    for (let row = 0; row < game.bricks.length; row++) {
        for (let col = 0; col < game.bricks[row].length; col++) {
            game.bricks[row][col].draw(game.ctx);
        }
    }
    
    game.animationId = requestAnimationFrame(gameLoop);
}

// 检查是否胜利
function checkWin() {
    for (let row = 0; row < game.bricks.length; row++) {
        for (let col = 0; col < game.bricks[row].length; col++) {
            if (!game.bricks[row][col].destroyed) {
                return false;
            }
        }
    }
    return true;
}

// 游戏结束
function gameOver() {
    game.isRunning = false;
    cancelAnimationFrame(game.animationId);
    showOverlay('游戏结束', `最终得分: ${game.score}`, '重新开始');
}

// 胜利
function victory() {
    game.isRunning = false;
    cancelAnimationFrame(game.animationId);
    showOverlay('恭喜通关！', `最终得分: ${game.score}`, '再玩一次');
}

// 显示覆盖层
function showOverlay(title, message, buttonText) {
    document.getElementById('overlayTitle').textContent = title;
    document.getElementById('overlayMessage').textContent = message;
    document.getElementById('startBtn').textContent = buttonText;
    document.getElementById('gameOverlay').classList.remove('hidden');
}

// 隐藏覆盖层
function hideOverlay() {
    document.getElementById('gameOverlay').classList.add('hidden');
}

// 更新 UI
function updateUI() {
    document.getElementById('score').textContent = game.score;
    document.getElementById('lives').textContent = game.lives;
}

// 页面加载完成后初始化
window.addEventListener('load', init);
