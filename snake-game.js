class SnakeGame {
    constructor(canvasId, scoreElementId, prizeElementId, onGameOver) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById(scoreElementId);
        this.prizeElement = document.getElementById(prizeElementId);
        this.onGameOver = onGameOver;
        
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        this.lastMoveSoundTime = 0;
        
        this.reset();
        this.setupControls();
    }
    
    reset() {
        this.snake = [{x: 10, y: 10}];
        this.direction = {x: 0, y: 0};
        this.nextDirection = {x: 0, y: 0};
        this.food = this.generateFood();
        this.tailLength = 1;
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.gameSpeed = 150;
        this.lastMoveSoundTime = Date.now();
        
        this.updateScore();
    }
    
    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        return food;
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    handleKeyDown(e) {
        if (this.gameOver) return;
        
        switch(e.key) {
            case 'ArrowUp':
                if (this.direction.y !== 1) {
                    this.nextDirection = {x: 0, y: -1};
                    audioManager.playSound('snakeMove');
                }
                break;
            case 'ArrowDown':
                if (this.direction.y !== -1) {
                    this.nextDirection = {x: 0, y: 1};
                    audioManager.playSound('snakeMove');
                }
                break;
            case 'ArrowLeft':
                if (this.direction.x !== 1) {
                    this.nextDirection = {x: -1, y: 0};
                    audioManager.playSound('snakeMove');
                }
                break;
            case 'ArrowRight':
                if (this.direction.x !== -1) {
                    this.nextDirection = {x: 1, y: 0};
                    audioManager.playSound('snakeMove');
                }
                break;
            case ' ':
                this.paused = !this.paused;
                audioManager.playSound('click');
                if (!this.paused) this.gameLoop();
                break;
        }
    }
    
    changeDirection(dir) {
        if (this.gameOver) return;
        
        switch(dir) {
            case 'up':
                if (this.direction.y !== 1) {
                    this.nextDirection = {x: 0, y: -1};
                    audioManager.playSound('snakeMove');
                }
                break;
            case 'down':
                if (this.direction.y !== -1) {
                    this.nextDirection = {x: 0, y: 1};
                    audioManager.playSound('snakeMove');
                }
                break;
            case 'left':
                if (this.direction.x !== 1) {
                    this.nextDirection = {x: -1, y: 0};
                    audioManager.playSound('snakeMove');
                }
                break;
            case 'right':
                if (this.direction.x !== -1) {
                    this.nextDirection = {x: 1, y: 0};
                    audioManager.playSound('snakeMove');
                }
                break;
        }
    }
    
    update() {
        if (this.gameOver || this.paused) return;
        
        this.direction = {...this.nextDirection};
        
        if (this.direction.x === 0 && this.direction.y === 0) return;
        
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };
        
        if (head.x < 0 || head.x >= this.tileCount || 
            head.y < 0 || head.y >= this.tileCount) {
            this.endGame();
            return;
        }
        
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.endGame();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        if (head.x === this.food.x && head.y === this.food.y) {
            audioManager.playSound('snakeEat');
            this.score++;
            this.tailLength++;
            this.food = this.generateFood();
            this.updateScore();
            
            if (this.gameSpeed > 50) {
                this.gameSpeed -= 2;
            }
        } else {
            const now = Date.now();
            if (now - this.lastMoveSoundTime > 100) {
                audioManager.playSound('snakeMove');
                this.lastMoveSoundTime = now;
            }
        }
        
        while (this.snake.length > this.tailLength) {
            this.snake.pop();
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#f0f9f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#c8e6c9';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < this.tileCount; i++) {
            for (let j = 0; j < this.tileCount; j++) {
                this.ctx.strokeRect(i * this.gridSize, j * this.gridSize, 
                                   this.gridSize, this.gridSize);
            }
        }
        
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            const size = isHead ? this.gridSize : this.gridSize * 0.8;
            const offset = isHead ? 0 : (this.gridSize - size) / 2;
            
            this.ctx.fillStyle = isHead ? '#ff9800' : 
                               (index % 2 === 0 ? '#4b8b3b' : '#81c784');
            this.ctx.fillRect(segment.x * this.gridSize + offset, 
                            segment.y * this.gridSize + offset, size, size);
            
            this.ctx.strokeStyle = isHead ? '#e65100' : '#2e7d32';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(segment.x * this.gridSize + offset, 
                              segment.y * this.gridSize + offset, size, size);
            
            if (isHead) {
                this.ctx.fillStyle = 'white';
                this.ctx.font = '14px Arial';
                this.ctx.fillText('🐇', segment.x * this.gridSize + 4, 
                                segment.y * this.gridSize + 15);
            }
        });
        
        this.ctx.fillStyle = '#e53935';
        const foodSize = this.gridSize * 0.9;
        const foodOffset = (this.gridSize - foodSize) / 2;
        this.ctx.fillRect(this.food.x * this.gridSize + foodOffset, 
                        this.food.y * this.gridSize + foodOffset, 
                        foodSize, foodSize);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('🥕', this.food.x * this.gridSize + 4, 
                        this.food.y * this.gridSize + 16);
        
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ПАУЗА', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = 'left';
        }
        
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ИГРА ОКОНЧЕНА', this.canvas.width / 2, 
                            this.canvas.height / 2 - 30);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText(`Собрано морковок: ${this.score}`, 
                            this.canvas.width / 2, this.canvas.height / 2 + 10);
            
            const prize = Math.min(this.score * 3, 30);
            this.ctx.fillText(`Приз: ${prize} монет`, 
                            this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.textAlign = 'left';
        }
    }
    
    updateScore() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
        if (this.prizeElement) {
            const prize = Math.min(this.score * 3, 30);
            this.prizeElement.textContent = prize;
        }
    }
    
    gameLoop() {
        if (this.gameOver || this.paused) return;
        
        this.update();
        this.draw();
        
        setTimeout(() => this.gameLoop(), this.gameSpeed);
    }
    
    start() {
        audioManager.playSound('click');
        this.reset();
        this.gameLoop();
    }
    
    pauseResume() {
        audioManager.playSound('click');
        this.paused = !this.paused;
        if (!this.paused && !this.gameOver) {
            this.gameLoop();
        }
    }
    
    endGame() {
        audioManager.playSound('error');
        this.gameOver = true;
        const prize = Math.min(this.score * 3, 30);
        
        if (this.onGameOver) {
            this.onGameOver(this.score, prize);
        }
    }
    
    getPrize() {
        return Math.min(this.score * 3, 30);
    }
}