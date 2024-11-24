import { CONFIG } from "./config.js";

export class SnakeGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = CONFIG.CANVAS_SIZE * 1.5;
    this.canvas.height = CONFIG.CANVAS_SIZE;
    this.cellSize = CONFIG.CANVAS_SIZE / CONFIG.GAME_SIZE;
    this.playerSide = null; // Escolha do jogador "left" ou "right"
    this.reset();
    this.lastRenderTime = 0;
    this.gameLoopId = null;
    this.electrifiedUntil = 0;
    this.directionQueue = [];
    this.isPaused = false;
    this.pauseMenu = document.getElementById("pause-menu");

    this.paddleWidth = 20;
    this.paddleHeight = 120;
    this.peddleCellSize = 18;
    this.ballSize = 18;
    this.rockBlockSize = 18;
    this.rocks = [];
  }

  showMenu() {
    const menu = document.createElement("div");
    menu.id = "game-menu";
    menu.style.position = "absolute";
    menu.style.top = "50%";
    menu.style.left = "50%";
    menu.style.transform = "translate(-50%, -50%)";
    menu.style.backgroundColor = "#fff";
    menu.style.padding = "20px";
    menu.style.border = "2px solid #000";
    menu.style.textAlign = "center";

    const title = document.createElement("h2");
    title.innerText = "Escolha o lado que você quer controlar";
    menu.appendChild(title);

    const leftButton = document.createElement("button");
    leftButton.innerText = "Controle o Paddle Esquerdo (W/S)";
    leftButton.onclick = () => {
      this.playerSide = "left";
      this.startGame(menu);
    };

    const rightButton = document.createElement("button");
    rightButton.innerText = "Controle o Paddle Direito (↑/↓)";
    rightButton.onclick = () => {
      this.playerSide = "right";
      this.startGame(menu);
    };

    menu.appendChild(leftButton);
    menu.appendChild(rightButton);

    document.body.appendChild(menu);
  }

  startGame(menu) {
    document.body.removeChild(menu); // Remove o menu da tela
    this.reset(); // Reinicia os estados do jogo
    this.gameLoop(); // Inicia o loop do jogo
  }

  reset() {
    this.leftPaddle = {
      x: 0,
      y: this.canvas.height / 2 - this.paddleHeight / 2,
      dy: 0,
    };
    this.rightPaddle = {
      x: this.canvas.width - this.paddleWidth,
      y: this.canvas.height / 2 - this.paddleHeight / 2,
      dy: 0,
    };

    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      dx: CONFIG.BALL_SPEED,
      dy: CONFIG.BALL_SPEED,
    };

    this.leftScore = 0;
    this.rightScore = 0;
    this.isPaused = false;

    // Configura controles com base na escolha do jogador
    window.addEventListener("keydown", (event) => this.handlePlayerControls(event));
    window.addEventListener("keyup", (event) => this.stopPaddle(event));
  }

  handlePlayerControls(event) {
    if (this.playerSide === "left") {
      if (event.key === "w") this.leftPaddle.dy = -CONFIG.PADDLE_SPEED;
      if (event.key === "s") this.leftPaddle.dy = CONFIG.PADDLE_SPEED;
    } else if (this.playerSide === "right") {
      if (event.key === "ArrowUp") this.rightPaddle.dy = -CONFIG.PADDLE_SPEED;
      if (event.key === "ArrowDown") this.rightPaddle.dy = CONFIG.PADDLE_SPEED;
    }
  }

  stopPaddle(event) {
    if (this.playerSide === "left" && (event.key === "w" || event.key === "s")) {
      this.leftPaddle.dy = 0;
    } else if (this.playerSide === "right" && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      this.rightPaddle.dy = 0;
    }
  }

  start() {
    this.reset();
    // Exibe o menu inicial
    this.showMenu();
    //this.gameLoop();
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

addRockEmoji() {
    // Gera uma nova pedra em intervalos aleatórios
    if (Math.random() < 0.01) { // Ajuste a frequência de geração conforme necessário
        const randomX = Math.random() * (this.canvas.width * 2/3 - this.rockBlockSize) + this.canvas.width/2;
        const randomY = Math.random() * (this.canvas.height - this.rockBlockSize);

        this.rocks.push({
            x: randomX,
            y: randomY,
            size: this.rockBlockSize,
            spawnTime: performance.now()
        });
    }

    // Remove pedras que excederam 30 segundos
    const currentTime = performance.now();
    this.rocks = this.rocks.filter(rock => currentTime - rock.spawnTime < 30000);

    // Verifica colisão com a bola
    this.rocks = this.rocks.filter(rock => {
        const collidedX = this.ball.x < rock.x + rock.size &&
                         this.ball.x + this.ballSize > rock.x;
        const collidedY = this.ball.y < rock.y + rock.size &&
                         this.ball.y + this.ballSize > rock.y;

        if (collidedX) {
            // Ação quando a bola atinge a pedra (opcional)
            this.ball.dx *= -1;
        }
        if (collidedY) {
            // Ação quando a bola atinge a pedra (opcional)
            this.ball.dy *= -1;
        }
      
        return !collided; // Remove a pedra se colidida
    });
}
  
update() {
    // Update paddle positions
    this.leftPaddle.y += this.leftPaddle.dy;
    this.rightPaddle.y += this.rightPaddle.dy;

    // Lógica para o paddle automático
    if (this.playerSide === "left") {
        // Move o paddle direito automaticamente
        if (this.ball.y + this.ballSize / 2 > this.rightPaddle.y + this.paddleHeight / 2) {
            this.rightPaddle.dy = CONFIG.PADDLE_SPEED; // Movimenta para baixo
        } else if (this.ball.y + this.ballSize / 2 < this.rightPaddle.y + this.paddleHeight / 2) {
            this.rightPaddle.dy = -CONFIG.PADDLE_SPEED; // Movimenta para cima
        } else {
            this.rightPaddle.dy = 0; // Fica parado se alinhado
        }
    } else if (this.playerSide === "right") {
        // Move o paddle esquerdo automaticamente
        if (this.ball.y + this.ballSize / 2 > this.leftPaddle.y + this.paddleHeight / 2) {
            this.leftPaddle.dy = CONFIG.PADDLE_SPEED; // Movimenta para baixo
        } else if (this.ball.y + this.ballSize / 2 < this.leftPaddle.y + this.paddleHeight / 2) {
            this.leftPaddle.dy = -CONFIG.PADDLE_SPEED; // Movimenta para cima
        } else {
            this.leftPaddle.dy = 0; // Fica parado se alinhado
        }
    }

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

      // Ativa o electrified no paddle esquerdo
      this.leftPaddle.electrified = true;
      setTimeout(() => this.leftPaddle.electrified = false, 2000); // Dura 2 segundos
    }

    if (
        this.ball.x + this.ballSize >= this.rightPaddle.x &&
        this.ball.y + this.ballSize >= this.rightPaddle.y &&
        this.ball.y <= this.rightPaddle.y + this.paddleHeight
    ) {
        this.ball.dx *= -1;

      // Ativa o electrified no paddle direito
      this.rightPaddle.electrified = true;
      setTimeout(() => this.rightPaddle.electrified = false, 2000); // Dura 2 segundos
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

    // Insere os emojis de rock de forma aleatória
    this.addRockEmoji();
}
  
  draw() {
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Adicionar emoji ao final/início do paddle esquerdo e direito
    const leftEyeEmoji = CONFIG.EYE_EMOJI;
    const rightEyeEmoji = CONFIG.EYE_EMOJI;
    // Adicionar emoji ao final/início do paddle esquerdo
    const leftElectrifiedEmoji = CONFIG.ELECTRIFIED_EMOJI;
    const rightElectrifiedEmoji = CONFIG.ELECTRIFIED_EMOJI;
    
    // Draw left paddle as DEFAULT_EMOJI1
    for (let i = 0; i < this.paddleHeight / (this.peddleCellSize + 2) - 1; i++) { // 100/ (600/60 * 2)
      this.ctx.fillText(
        CONFIG.DEFAULT_EMOJI1,
        this.leftPaddle.x,
        this.leftPaddle.y + (2 + this.peddleCellSize + 3) * (i + 1) - 3 // spacingFactor
      );
    }
    // Desenha o paddle esquerdo com os olhos
    if (this.leftPaddle.dy > 0) { // Movendo para baixo
    this.ctx.fillText(
        leftEyeEmoji,
        this.leftPaddle.x,
        this.leftPaddle.y + this.paddleHeight - this.peddleCellSize / 2 // Final do paddle
        );
    } else if (this.leftPaddle.dy < 0) { // Movendo para cima
        this.ctx.fillText(
            leftEyeEmoji,
            this.leftPaddle.x,
            this.leftPaddle.y + this.peddleCellSize // Início do paddle
        );
    }

    // Desenha o paddle esquerdo com electrified
    if (this.leftPaddle.electrified) {
      this.ctx.fillText(
        leftElectrifiedEmoji,
        this.leftPaddle.x + this.paddleWidth, // Centralizado no paddle
        this.leftPaddle.y + 7 // Na borda superior do paddle
      );
      this.ctx.fillText(
        leftElectrifiedEmoji,
        this.leftPaddle.x + this.paddleWidth,
        this.leftPaddle.y + this.paddleHeight + 2 // Na borda inferior do paddle
      );
    }
    
    // Draw right paddle as DEFAULT_EMOJI2
    for (let i = 0; i < this.paddleHeight / (this.peddleCellSize + 2) - 1; i++) {
      this.ctx.fillText(
        CONFIG.DEFAULT_EMOJI2,
        this.rightPaddle.x - 5, // Align emoji properly
        this.rightPaddle.y + (2 + this.peddleCellSize + 3) * (i + 1) - 3 // spacingFactor
      );
    }
    // Desenha o paddle direito com os olhos
    if (this.rightPaddle.dy > 0) { // Movendo para baixo
        this.ctx.fillText(
            rightEyeEmoji,
            this.rightPaddle.x - 5,
            this.rightPaddle.y + this.paddleHeight - this.peddleCellSize / 2 // Final do paddle
        );
    } else if (this.rightPaddle.dy < 0) { // Movendo para cima
        this.ctx.fillText(
            rightEyeEmoji,
            this.rightPaddle.x - 5,
            this.rightPaddle.y + this.peddleCellSize // Início do paddle
        );
    }
    
    // Desenha o paddle direito com electrified
    if (this.rightPaddle.electrified) {
      this.ctx.fillText(
        rightElectrifiedEmoji,
        this.rightPaddle.x - this.paddleWidth - 5, // Centralizado no paddle
        this.rightPaddle.y + 7 // Na borda superior do paddle
      );
      this.ctx.fillText(
        rightElectrifiedEmoji,
        this.rightPaddle.x - this.paddleWidth - 5,
        this.rightPaddle.y + this.paddleHeight + 2// Na borda inferior do paddle
      );
    }

    // Draw ball with horizontal flip if moving right
    this.ctx.save(); // Save the current canvas state
  
    if (this.ball.dx > 0) {
      this.ctx.translate(this.ball.x + this.ballSize / 2, 0); // Translate to ball's position
      this.ctx.scale(-1, 1); // Flip horizontally
      this.ctx.translate(-(this.ball.x + this.ballSize / 2), 0); // Restore translation
    }

    // Flip vertical if the ball is moving downward
    if (this.ball.dy < 0) {
      this.ctx.translate(0, this.ball.y + this.ballSize / 2); // Translate to the ball's position
      this.ctx.scale(1, -1); // Flip vertically
      this.ctx.translate(0, -(this.ball.y + this.ballSize / 2)); // Restore translation
    }

    // Inverter horizontalmente se for o emoji de explosão
    if (CONFIG.BOMB_EMOJI === CONFIG.EXPLOSION_EMOJI) {
      this.ctx.translate(this.ball.x + this.ballSize / 2, 0); // Mover o ponto de referência
      this.ctx.scale(-1, 1); // Espelhar horizontalmente
      this.ctx.translate(-(this.ball.x + this.ballSize / 2), 0); // Restaurar a posição
    }

    // Draw ball as BOMB_EMOJI
    this.ctx.fillText(
      CONFIG.BOMB_EMOJI,
      this.ball.x - 3,
      this.ball.y + this.ballSize * 5 / 6
    );

    // Desenha as pedras
    this.rocks.forEach(rock => {
        this.ctx.fillStyle = "gray"; // Cor ou estilo da pedra
        this.ctx.fillRect(rock.x, rock.y, rock.size, rock.size);
    });
    
    this.ctx.restore(); // Restore the original canvas state

    // Draw scores
    this.ctx.font = "20px Arial";
    this.ctx.fillText(`Left: ${this.leftScore}`, 10, 20);
    this.ctx.fillText(`Right: ${this.rightScore}`, this.canvas.width - 100, 20);
  }

  resetBall() {
    // Salvar o emoji original da bola
    const originalEmoji = CONFIG.BOMB_EMOJI;
    const originaldx = this.ball.dx;
    const originaldy = this.ball.dy;
  
    // Trocar para o emoji de explosão
    CONFIG.BOMB_EMOJI = CONFIG.EXPLOSION_EMOJI;
    this.isPaused = true; // Pausar a bola logicamente
    
    // Restaurar o emoji original após 2 segundos
    setTimeout(() => {
      CONFIG.BOMB_EMOJI = originalEmoji;
      this.isPaused = false; // Retomar o movimento da bola
      // Resetar a posição da bola
      this.ball.x = this.canvas.width / 2;
      this.ball.y = this.canvas.height / 2;
      this.ball.dx *= -1;
    }, 2000);
  }
  
  updateScoreDisplay() {
    // This method should be implemented to update the score display in your UI
    console.log(`Score: ${this.rightScore}`);
  }

  onGameOver(score) {
    // This method can be overridden from outside to handle game over events
    console.log(`Game Over. Final Score: ${score}`);
  }
  
  onScoreUpdate(score) {
    // This method can be overridden from outside to handle score updates
    console.log(`Score Updated: ${score}`);
  }
}
