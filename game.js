import { CONFIG } from "./config.js";

export class SnakeGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = CONFIG.CANVAS_SIZE;
    this.canvas.height = CONFIG.CANVAS_SIZE;
    this.cellSize = CONFIG.CANVAS_SIZE / CONFIG.GAME_SIZE;
    this.reset();
    this.lastRenderTime = 0;
    this.gameLoopId = null;
    this.electrifiedUntil = 0;
    this.directionQueue = []; // Queue to store direction changes
    this.isPaused = false;
    this.pauseMenu = document.getElementById("pause-menu");
    this.lastDirection = { x: 0, y: 0 };
    this.nextDirection = { x: 0, y: 0 };
    this.directionQueue = [];
    // Touch event handling
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.addTouchListeners();

    this.paddleWidth = 20;
    this.paddleHeight = 100;
    this.ballSize = 20;

    // Keyboard controls
    window.addEventListener("keydown", this.handleKeydown.bind(this));
    window.addEventListener("keyup", this.handleKeyup.bind(this));
  }

  addTouchListeners() {
    this.canvas.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
      { passive: false }
    );
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this), {
      passive: false,
    });
  }

  handleTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  handleTouchMove(event) {
    event.preventDefault();
  }

  handleTouchEnd(event) {
    event.preventDefault();
    if (!this.touchStartX || !this.touchStartY) {
      return;
    }

    const touch = event.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;

    const dx = touchEndX - this.touchStartX;
    const dy = touchEndY - this.touchStartY;

    // Minimum swipe distance to trigger direction change
    const minSwipeDistance = 30;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipeDistance) {
      // Horizontal swipe
      this.changeDirection(dx > 0 ? "ArrowRight" : "ArrowLeft");
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > minSwipeDistance) {
      // Vertical swipe
      this.changeDirection(dy > 0 ? "ArrowDown" : "ArrowUp");
    }

    // Reset touch start coordinates
    this.touchStartX = 0;
    this.touchStartY = 0;
  }

  handleKeydown(event) {
    const key = event.key;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
      event.preventDefault();
      this.changeDirection(key);
    }
  }

  queueDirectionChange(newDirection) {
    const directionMap = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };

    if (directionMap[newDirection]) {
      this.nextDirection = directionMap[newDirection];
    }
  }



  

  reset() {
    // Paddle positions
    this.leftPaddle = { x: 0, y: this.canvas.height / 2 - this.paddleHeight / 2, dy: 0 };
    this.rightPaddle = { x: this.canvas.width - this.paddleWidth, y: this.canvas.height / 2 - this.paddleHeight / 2, dy: 0 };

    // Ball position and velocity
    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      dx: CONFIG.BALL_SPEED,
      dy: CONFIG.BALL_SPEED,
    };

    // Scores
    this.leftScore = 0;
    this.rightScore = 0;
    this.isPaused = false;
  }

  handleKeydown(event) {
    switch (event.key) {
      case "w":
        this.leftPaddle.dy = -CONFIG.PADDLE_SPEED;
        break;
      case "s":
        this.leftPaddle.dy = CONFIG.PADDLE_SPEED;
        break;
      case "ArrowUp":
        this.rightPaddle.dy = -CONFIG.PADDLE_SPEED;
        break;
      case "ArrowDown":
        this.rightPaddle.dy = CONFIG.PADDLE_SPEED;
        break;
    }
  }

  handleKeyup(event) {
    switch (event.key) {
      case "w":
      case "s":
        this.leftPaddle.dy = 0;
        break;
      case "ArrowUp":
      case "ArrowDown":
        this.rightPaddle.dy = 0;
        break;
    }
  }

  start() {
    this.reset();
    this.gameLoop();
  }

  gameLoop(currentTime = 0) {
    this.gameLoopId = window.requestAnimationFrame(this.gameLoop.bind(this));

    if (this.isPaused) return;

    const secondsSinceLastRender = (currentTime - this.lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / CONFIG.TICK_RATE) return;

    this.lastRenderTime = currentTime;

    this.update();
    this.draw();
  }

  update() {
    // Update paddle positions
    this.leftPaddle.y += this.leftPaddle.dy;
    this.rightPaddle.y += this.rightPaddle.dy;

    // Prevent paddles from moving out of bounds
    this.leftPaddle.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, this.leftPaddle.y));
    this.rightPaddle.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, this.rightPaddle.y));

    // Update ball position
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Ball collision with top and bottom walls
    if (this.ball.y <= 0 || this.ball.y + this.ballSize >= this.canvas.height) {
      this.ball.dy *= -1;
    }

    // Ball collision with paddles
    if (
      this.ball.x <= this.leftPaddle.x + this.paddleWidth &&
      this.ball.y + this.ballSize >= this.leftPaddle.y &&
      this.ball.y <= this.leftPaddle.y + this.paddleHeight
    ) {
      this.ball.dx *= -1;
    }

    if (
      this.ball.x + this.ballSize >= this.rightPaddle.x &&
      this.ball.y + this.ballSize >= this.rightPaddle.y &&
      this.ball.y <= this.rightPaddle.y + this.paddleHeight
    ) {
      this.ball.dx *= -1;
    }

    // Check if a point is scored
    if (this.ball.x <= 0) {
      this.rightScore++;
      this.resetBall();
    }

    if (this.ball.x + this.ballSize >= this.canvas.width) {
      this.leftScore++;
      this.resetBall();
    }
  }

  draw() {
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw left paddle as DEFAULT_EMOJI1
    for (let i = 0; i < this.paddleHeight / this.cellSize; i++) {
      this.ctx.fillText(
        CONFIG.DEFAULT_EMOJI1,
        this.leftPaddle.x,
        this.leftPaddle.y + i * this.cellSize - this.cellSize
      );
    }

    // Draw right paddle as DEFAULT_EMOJI2
    for (let i = 0; i < this.paddleHeight / this.cellSize; i++) {
      this.ctx.fillText(
        CONFIG.DEFAULT_EMOJI2,
        this.rightPaddle.x, // Align emoji properly
        this.rightPaddle.y + i * this.cellSize - this.cellSize
      );
    }

    // Draw ball as BOMB_EMOJI
    this.ctx.fillText(
      CONFIG.BOMB_EMOJI,
      this.ball.x,
      this.ball.y - this.ballSize
    );

    // Draw scores
    this.ctx.font = "20px Arial";
    this.ctx.fillText(`Left: ${this.leftScore}`, 10, 20);
    this.ctx.fillText(`Right: ${this.rightScore}`, this.canvas.width - 100, 20);
  }

  resetBall() {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    this.ball.dx *= -1;
  }
}
