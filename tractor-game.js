class TractorGame {
    constructor(canvasId, scoreId, prizeId, onGameEnd) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById(scoreId);
        this.prizeElement = document.getElementById(prizeId);
        this.onGameEnd = onGameEnd;
        
        this.gameWidth = this.canvas.width;
        this.gameHeight = this.canvas.height;
        
        this.tractor = {
            x: 50,
            y: this.gameHeight - 80,
            width: 60,
            height: 40,
            velocityY: 0,
            jumpPower: -15,
            gravity: 0.8,
            isJumping: false,
            color: '#FF9800'
        };
        
        this.obstacles = [];
        this.clouds = [];
        this.score = 0;
        this.prize = 0;
        this.gameSpeed = 5;
        this.gameOver = false;
        this.isPaused = false;
        this.animationId = null;
        this.obstacleTimer = 0;
        this.cloudTimer = 0;
        
        this.keys = {};
        this.init();
    }
    
    init() {
        for (let i = 0; i < 3; i++) {
            this.clouds.push({
                x: Math.random() * this.gameWidth,
                y: Math.random() * 100 + 30,
                width: 60 + Math.random() * 40,
                speed: 0.5 + Math.random() * 1
            });
        }
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(e) {
        this.keys[e.code] = true;
        
        if (e.code === 'Space' && !this.tractor.isJumping && !this.gameOver && !this.isPaused) {
            audioManager.playSound('jump');
            this.tractor.velocityY = this.tractor.jumpPower;
            this.tractor.isJumping = true;
        }
        
        if (e.code === 'KeyP') {
            this.pauseResume();
        }
        
        if (e.code === 'KeyR' && this.gameOver) {
            this.restart();
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    jump() {
        if (!this.tractor.isJumping) {
            audioManager.playSound('jump');
            this.tractor.velocityY = this.tractor.jumpPower;
            this.tractor.isJumping = true;
        }
    }
    
    update() {
        if (this.gameOver || this.isPaused) return;
        
        this.tractor.velocityY += this.tractor.gravity;
        this.tractor.y += this.tractor.velocityY;
        
        if (this.tractor.y > this.gameHeight - 80) {
            this.tractor.y = this.gameHeight - 80;
            this.tractor.velocityY = 0;
            this.tractor.isJumping = false;
        }
        
        if (this.tractor.y < 0) {
            this.tractor.y = 0;
            this.tractor.velocityY = 0;
        }
        
        this.obstacleTimer++;
        if (this.obstacleTimer > 60 - Math.min(this.score / 10, 40)) {
            this.obstacleTimer = 0;
            this.addObstacle();
        }
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].x -= this.gameSpeed;
            
            if (this.obstacles[i].x + this.obstacles[i].width < 0) {
                this.obstacles.splice(i, 1);
                this.score++;
                this.scoreElement.textContent = this.score;
                audioManager.playSound('coin');
            }
            
            if (this.checkCollision(this.tractor, this.obstacles[i])) {
                this.gameOver = true;
                this.calculatePrize();
                audioManager.playSound('crash');
                if (this.onGameEnd) {
                    this.onGameEnd(this.score, this.prize);
                }
            }
        }
        
        for (let cloud of this.clouds) {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.gameWidth;
                cloud.y = Math.random() * 100 + 30;
            }
        }
        
        this.gameSpeed = 5 + Math.floor(this.score / 10);
    }
    
    addObstacle() {
        const types = [
            { width: 30, height: 30, color: '#795548', emoji: '🪨' },
            { width: 40, height: 25, color: '#8D6E63', emoji: '🪵' },
            { width: 50, height: 20, color: '#A1887F', emoji: '🚧' }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        const obstacle = {
            x: this.gameWidth,
            y: this.gameHeight - 80,
            width: type.width,
            height: type.height,
            color: type.color,
            emoji: type.emoji,
            type: 'obstacle'
        };
        
        this.obstacles.push(obstacle);
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    calculatePrize() {
        this.prize = Math.floor(this.score * 2);
        this.prizeElement.textContent = this.prize;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        this.drawSky();
        this.drawGround();
        this.drawClouds();
        this.drawTractor();
        this.drawObstacles();
        this.drawUI();
    }
    
    drawSky() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.gameHeight);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F7FA');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
    }
    
    drawGround() {
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(0, this.gameHeight - 40, this.gameWidth, 40);
        
        this.ctx.fillStyle = '#795548';
        this.ctx.fillRect(0, this.gameHeight - 40, this.gameWidth, 5);
        
        for (let i = 0; i < this.gameWidth; i += 20) {
            this.ctx.fillStyle = '#5D4037';
            this.ctx.fillRect(i, this.gameHeight - 40, 10, 3);
        }
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let cloud of this.clouds) {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.width / 3, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width / 3, cloud.y - 10, cloud.width / 4, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width / 2, cloud.y, cloud.width / 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawTractor() {
        this.ctx.fillStyle = this.tractor.color;
        this.ctx.fillRect(this.tractor.x, this.tractor.y, this.tractor.width, this.tractor.height);
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.tractor.x + 5, this.tractor.y + 5, 20, 15);
        
        this.ctx.fillStyle = '#FF5722';
        this.ctx.fillRect(this.tractor.x + 40, this.tractor.y + 15, 15, 10);
        
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(this.tractor.x + 15, this.tractor.y + 40, 10, 0, Math.PI * 2);
        this.ctx.arc(this.tractor.x + 45, this.tractor.y + 40, 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('🚜', this.tractor.x + 15, this.tractor.y + 25);
    }
    
    drawObstacles() {
        for (let obstacle of this.obstacles) {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = `${Math.min(obstacle.width, obstacle.height) - 5}px Arial`;
            this.ctx.fillText(obstacle.emoji, obstacle.x + 5, obstacle.y + obstacle.height - 5);
        }
    }
    
    drawUI() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 150, 60);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Очки: ${this.score}`, 20, 30);
        this.ctx.fillText(`Приз: ${this.prize} монет`, 20, 50);
        this.ctx.fillText(`Скорость: ${this.gameSpeed}`, 20, 70);
        
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            
            this.ctx.fillStyle = '#FF5722';
            this.ctx.font = '40px Arial';
            this.ctx.fillText('ИГРА ОКОНЧЕНА', this.gameWidth / 2 - 140, this.gameHeight / 2 - 40);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Итоговый счет: ${this.score}`, this.gameWidth / 2 - 100, this.gameHeight / 2);
            this.ctx.fillText(`Выигрыш: ${this.prize} монет`, this.gameWidth / 2 - 100, this.gameHeight / 2 + 40);
            this.ctx.fillText('Нажми R для перезапуска', this.gameWidth / 2 - 130, this.gameHeight / 2 + 80);
        }
        
        if (this.isPaused && !this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '40px Arial';
            this.ctx.fillText('ПАУЗА', this.gameWidth / 2 - 60, this.gameHeight / 2);
        }
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Управление: ПРОБЕЛ - прыжок, P - пауза, R - перезапуск', 10, this.gameHeight - 10);
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        if (!this.gameOver) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    start() {
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.prize = 0;
        this.gameSpeed = 5;
        this.obstacles = [];
        this.obstacleTimer = 0;
        
        this.tractor.x = 50;
        this.tractor.y = this.gameHeight - 80;
        this.tractor.velocityY = 0;
        this.tractor.isJumping = false;
        
        this.scoreElement.textContent = this.score;
        this.prizeElement.textContent = this.prize;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.gameLoop();
    }
    
    pauseResume() {
        this.isPaused = !this.isPaused;
        audioManager.playSound('click');
        
        if (!this.isPaused && !this.gameOver) {
            this.gameLoop();
        }
    }
    
    restart() {
        audioManager.playSound('click');
        this.start();
    }
}