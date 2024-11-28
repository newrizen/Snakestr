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
    this.eyeSize = 18;    
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
    //requestAnimationFrame(gameLoop);
  }

  
update() {
    // Insere os emojis de rock de forma aleatória
    // Gera uma nova pedra em intervalos aleatórios
    if (Math.random() < 0.02) { // 0.01 Ajuste a frequência de geração conforme necessário
        const randomX = Math.random() * (this.canvas.width * 1/2 - this.rockBlockSize) + this.canvas.width/4;
        const randomY = Math.random() * (this.canvas.height - this.rockBlockSize);

        this.rocks.push({
            x: randomX,
            y: randomY,
            size: this.rockBlockSize,
            spawnTime: performance.now()
        });
    }

    // Remove pedras que excederam 10 segundos
    const currentTime = performance.now();
    this.rocks = this.rocks.filter(rock => currentTime - rock.spawnTime < 10000);

    // Verifica colisão com a bola
    this.rocks = this.rocks.filter(rock => {
      
        const collidedX = 
          (this.ball.x >= rock.x + rock.size && 
          this.ball.x + this.ballSize <= rock.x && 
          this.ball.y + this.ballSize <= rock.y &&
          this.ball.y >= rock.y + rock.size); //|| 
          //(this.ball.x <= rock.x + rock.size && 
          //this.ball.x + this.ballSize => rock.x && 
          //this.ball.y <= rock.y + rock.size);

        const collidedY =
          (this.ball.y <= rock.y + rock.size && 
          this.ball.y + this.ballSize >= rock.y && 
          this.ball.x <= rock.x + rock.size &&
          this.ball.x + this.ballSize >= rock.x); //||
          //(this.ball.y < rock.y + rock.size && 
          //this.ball.y + this.ballSize > rock.y && 
          //this.ball.x + this.ballSize > rock.x);

        if (collidedX && collidedY) {
          // Inverte ambas as direções em caso de colisão total
          this.ball.dx *= -1;
          this.ball.dy *= -1;
          return false; // Remove a rocha
        }
        else if (collidedX) {
          // Ação quando a bola atinge a pedra (opcional) 
          this.ball.dx *= -1;
          return false;  // Remove a pedra se colidida
        }
        else if (collidedY) {
          // Ação quando a bola atinge a pedra (opcional)
          this.ball.dx *= -1;
          return false; // Remove a pedra se colidida
        }
      
        return true; // Mantem a pedra
    });
  
    // Update paddle positions
    this.leftPaddle.y += this.leftPaddle.dy;
    this.rightPaddle.y += this.rightPaddle.dy;

    // Prevent paddles from moving out of bounds
    this.leftPaddle.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, this.leftPaddle.y));
    this.rightPaddle.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, this.rightPaddle.y));
  
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
  
    // Update ball position
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Check if a point is scored
    if (this.ball.x <= 0) {
        this.rightScore++;
        this.resetBall();
    }

    if (this.ball.x + this.ballSize >= this.canvas.width) {
        this.leftScore++;
        this.resetBall();
    }

    // Ball collision with top and bottom walls
    if (this.ball.y <= 0 || this.ball.y + this.ballSize >= this.canvas.height) {
        this.ball.dy *= -1;
    }
  
    // Ball collision with paddles
    if (this.ball.x <= this.leftPaddle.x + this.paddleWidth && // Bola atinge o lado direito do paddle
        (
        (this.ball.y <= this.leftPaddle.y + this.paddleHeight && 
         this.ball.y + this.ballSize > this.leftPaddle.y + this.paddleHeight) || // Parte superior
        (this.ball.y + this.ballSize <= this.leftPaddle.y &&
         this.ball.y >= this.leftPaddle.y + this.paddleHeight)    // Parte inferior
        )
       ) 
    {
        this.ball.dx *= -1;
        this.ball.dy *= -1;
        // Ativa o electrified no paddle esquerdo
        this.leftPaddle.electrified = true;
        setTimeout(() => this.leftPaddle.electrified = false, 500); // Dura 0.5 segundos
    }
    else if (
        this.ball.x <= this.leftPaddle.x + this.paddleWidth && // Bola atinge o lado direito do paddle
        this.ball.x + this.ballSize >= this.leftPaddle.x &&    // Bola está abaixo do topo do paddle
        this.ball.y + this.ballSize >= this.leftPaddle.y &&
        this.ball.y <= this.leftPaddle.y + this.paddleHeight   // Bola está acima da base do paddle
    ) {
        this.ball.dx *= -1;
        // Ativa o electrified no paddle esquerdo
        this.leftPaddle.electrified = true;
        setTimeout(() => this.leftPaddle.electrified = false, 500); // Dura 0.5 segundos
    }

    if (this.ball.x + this.ballSize >= this.rightPaddle.x && // Bola atinge o lado direito do paddle
        (
        (this.ball.y <= this.rightPaddle.y + this.paddleHeight && 
         this.ball.y + this.ballSize > this.rightPaddle.y + this.paddleHeight) || // Parte superior
        (this.ball.y + this.ballSize <= this.rightPaddle.y &&
         this.ball.y >= this.rightPaddle.y + this.paddleHeight)    // Parte inferior
        )
       ) 
    {
        this.ball.dx *= -1;
        this.ball.dy *= -1;
        // Ativa o electrified no paddle direito
        this.rightPaddle.electrified = true;
        setTimeout(() => this.rightPaddle.electrified = false, 500); // Dura 0.5 segundos
    }
      
    else if (
        this.ball.x <= this.rightPaddle.x + this.paddleWidth &&
        this.ball.x + this.ballSize >= this.rightPaddle.x &&
        this.ball.y + this.ballSize >= this.rightPaddle.y &&
        this.ball.y <= this.rightPaddle.y + this.paddleHeight
    ) {
        this.ball.dx *= -1;
        // Ativa o electrified no paddle direito
        this.rightPaddle.electrified = true;
        setTimeout(() => this.rightPaddle.electrified = false, 500); // Dura 0.5 segundos
    }
}
  
  draw() {
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw scores
    this.ctx.font = "20px Arial";
    this.ctx.fillText(`Left: ${this.leftScore}`, 10, 20);
    this.ctx.fillText(`Right: ${this.rightScore}`, this.canvas.width - 100, 20);

    // Desenha as pedras
    this.rocks.forEach(rock => {
    this.ctx.fillText(CONFIG.ROCK_EMOJI, rock.x, rock.y + rock.size); // Emoji de pedra
        //this.ctx.fillStyle = "gray"; // Cor ou estilo da pedra
        //this.ctx.fillRect(rock.x, rock.y, rock.size, rock.size);
    });
    
    // Check if the current emoji is CONFIG.BOMB_EMOJI
    if (CONFIG.BOMB_EMOJI) {
      this.ctx.save(); // Save the current canvas state
    
      // Flip horizontally if the ball is moving to the right
      if (this.ball.dx > 0) {
        this.ctx.translate(this.ball.x + this.ballSize / 2, 0); // Translate to ball's position
        this.ctx.scale(-1, 1); // Flip horizontally
        this.ctx.translate(-(this.ball.x + this.ballSize / 2), 0); // Restore translation
      }
    
      // Flip vertically if the ball is moving downward
      if (this.ball.dy < 0) {
        this.ctx.translate(0, this.ball.y + this.ballSize / 2); // Translate to the ball's position
        this.ctx.scale(1, -1); // Flip vertically
        this.ctx.translate(0, -(this.ball.y + this.ballSize / 2)); // Restore translation
      }
    
      // Additional horizontal flip if the emoji is an explosion
      if (CONFIG.BOMB_EMOJI === CONFIG.EXPLOSION_EMOJI) {
        this.ctx.translate(this.ball.x + this.ballSize / 2, 0); // Move the reference point
        this.ctx.scale(-1, 1); // Flip horizontally
        this.ctx.translate(-(this.ball.x + this.ballSize / 2), 0); // Restore position
      }
    
      // Draw the BOMB_EMOJI with transformations applied
      this.ctx.fillText(
        CONFIG.BOMB_EMOJI,
        this.ball.x - 3,
        this.ball.y + (this.ballSize * 5) / 6
      );
    
      this.ctx.restore(); // Restore the original canvas state
    } else {
      // Draw the BOMB_EMOJI without transformations
      this.ctx.fillText(
        CONFIG.BOMB_EMOJI,
        this.ball.x - 3,
        this.ball.y + (this.ballSize * 5) / 6
      );
    }

    const leftEmoji = CONFIG.DEFAULT_EMOJI1;
    
    // Adicionar emoji ao final/início do paddle esquerdo e direito
    const leftEyeEmoji = CONFIG.EYE_EMOJI;
    const rightEyeEmoji = CONFIG.EYE_EMOJI;
    
    // Adicionar emoji ao final/início do paddle esquerdo
    const leftElectrifiedEmoji = CONFIG.ELECTRIFIED_EMOJI;
    const rightElectrifiedEmoji = CONFIG.ELECTRIFIED_EMOJI;
    
    // Espelhar verticalmente o paddle
    //this.ctx.translate(0, this.leftPaddle.y + this.paddleWidth / 2); // Centralizar no paddle
    //this.ctx.scale(1, -1); // Espelhar verticalmente
    //this.ctx.translate(0, -(this.leftPaddle.y + this.paddleWidth / 2)); // Reverter a centralização

    //if (leftEmoji) {
      //this.ctx.save(); // Salvar estado inicial do contexto

     // if (this.leftPaddle.dy > 0) {
     //   this.ctx.translate(this.leftPaddle.x + this.paddleWidth / 2, 0); // Move the reference point
     //   this.ctx.scale(-1, 1); // Flip horizontally
     //   this.ctx.translate(-(this.leftPaddle.x + this.paddleWidth / 2), 0); // Restore position
     //   }
        
     //   this.ctx.restore(); // Restaurar o estado original do contexto
    //}

    if (leftEmoji) {
      this.ctx.save(); // Salvar estado inicial do contexto

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
      
      //if (this.leftPaddle.dy > 0) {
        this.ctx.translate(this.leftPaddle.x + this.paddleWidth / 2, 0); // Move the reference point
        this.ctx.scale(-1, 1); // Flip horizontally
        this.ctx.translate(-(this.leftPaddle.x + this.paddleWidth / 2), 0); // Restore position
      //}

      // Draw left paddle as DEFAULT_EMOJI1
      for (let i = 0; i < this.paddleHeight / (this.peddleCellSize + 2) - 1; i++) { // 100/ (600/60 * 2)
        this.ctx.fillText(
          leftEmoji,
          this.leftPaddle.x - 5,
          this.leftPaddle.y + (2 + this.peddleCellSize + 3) * (i + 1) - 3 // spacingFactor
        );
      }
              
      // Desenha o paddle esquerdo com os olhos
      if (this.leftPaddle.dy > 0) { // Movendo para baixo
        this.ctx.fillText(
            leftEyeEmoji,
            this.leftPaddle.x - 5,
            this.leftPaddle.y + this.paddleHeight - this.peddleCellSize / 2 // Final do paddle
            );
      } 
      else if (this.leftPaddle.dy < 0) { // Movendo para cima
          this.ctx.fillText(
              leftEyeEmoji,
              this.leftPaddle.x - 5,
              this.leftPaddle.y + this.peddleCellSize // Início do paddle
          );
      }
      
      this.ctx.restore(); // Restaurar o estado original do contexto
      
    } else {
        // Draw left paddle as DEFAULT_EMOJI1
        for (let i = 0; i < this.paddleHeight / (this.peddleCellSize + 2) - 1; i++) { // 100/ (600/60 * 2)
          this.ctx.fillText(
            leftEmoji,
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
        } 
        else if (this.leftPaddle.dy < 0) { // Movendo para cima
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
        this.rightPaddle.y + this.paddleHeight + 2 // Na borda inferior do paddle
      );
    }
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

    if (this.ball.x <= 0) {
      this.rightScore++;
      this.updateScoreDisplay(); // Atualiza o placar
      this.resetBall();
    }

    if (this.ball.x + this.ballSize >= this.canvas.width) {
        this.leftScore++;
        this.updateScoreDisplay(); // Atualiza o placar
        this.resetBall();
    }
  }

  navigateToHighscores() {
    this.isPaused = false;
    this.gameOver = true;
    window.location.href = "highscores.html";
  }
  
updateScoreDisplay() {
    const leftScoreElement = document.getElementById("left-score");
    const rightScoreElement = document.getElementById("right-score");

    if (leftScoreElement && rightScoreElement) {
        leftScoreElement.textContent = this.leftScore;
        rightScoreElement.textContent = this.rightScore;
    } else {
        console.error("Elementos do placar não encontrados no DOM.");
    }

  console.log("Left Score:", this.leftScore, "Right Score:", this.rightScore);
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
