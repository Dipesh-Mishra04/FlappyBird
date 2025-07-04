// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size
canvas.width = 400;
canvas.height = 500;

// Load assets
const birdImg = new Image();
birdImg.src = "bird.png";

const dayBgImg = new Image();
dayBgImg.src = "background.png";

const nightBgImg = new Image();
nightBgImg.src = "BG_NIGHT.png";

const coinImg = new Image();
coinImg.src = "coin.gif";

const backgroundMusic = new Audio("bgm.mp3");
const hitSound = new Audio("hit.mp3");
const gameOverSound = new Audio("gameover.mp3");
const pointSound = new Audio("point.mp3");

// Game variables
let bird, pipes, frames, score, gameOver, gameStarted, animationFrame, isPaused = false;
let coins = [], snowflakes = [], snowActive = false;
let isNightMode = false;

// Bird class
class Bird {
    constructor() {
        this.x = 50;
        this.y = canvas.height / 2;
        this.width = 34;
        this.height = 24;
        this.velocity = 0;
        this.gravity = 0.12;
        this.lift = -3.5;
    }

    draw() {
        ctx.drawImage(birdImg, this.x, this.y, this.width, this.height);
    }

    update() {
        if (!gameStarted || isPaused) return;
        this.velocity += this.gravity;
        this.y += this.velocity;

        if (this.y + this.height >= canvas.height) {
            endGame();
        }
    }

    flap() {
        this.velocity = this.lift;
    }
}

// Coin Class
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.collected = false;
    }

    draw() {
        if (!this.collected) {
            ctx.drawImage(coinImg, this.x, this.y, this.width, this.height);
        }
    }

    update() {
        if (isPaused) return;
        this.x -= 2;

        if (!this.collected &&
            bird.x < this.x + this.width &&
            bird.x + bird.width > this.x &&
            bird.y < this.y + this.height &&
            bird.y + bird.height > this.y) {
            this.collected = true;
            score += 2;
            pointSound.play();
        }
    }
}

// Pipe class
class Pipe {
    constructor() {
        this.width = 50;
        this.gap = 120 + Math.random() * 30;
        this.x = canvas.width;
        this.topHeight = Math.random() * (canvas.height / 2);
        this.bottomHeight = canvas.height - this.topHeight - this.gap;
        this.speed = 2;
        this.passed = false;
        this.coin = new Coin(this.x + this.width / 2, this.topHeight + this.gap / 2);
    }

    draw() {
        ctx.fillStyle = "green";
        ctx.fillRect(this.x, 0, this.width, this.topHeight);
        ctx.fillRect(this.x, canvas.height - this.bottomHeight, this.width, this.bottomHeight);
        this.coin.draw();
    }

    update() {
        if (isPaused) return;
        this.x -= this.speed;
        this.coin.update();

        if (this.x + this.width < bird.x && !this.passed) {
            this.passed = true;
            score++;
        }

        if (
            bird.x < this.x + this.width &&
            bird.x + bird.width > this.x &&
            (bird.y < this.topHeight || bird.y + bird.height > canvas.height - this.bottomHeight)
        ) {
            endGame();
        }
    }
}

// Snowflake class
class Snowflake {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * -canvas.height;
        this.radius = Math.random() * 3 + 2;
        this.speed = Math.random() * 1.5 + 0.5;
    }

    draw() {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        if (isPaused) return;
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = Math.random() * -canvas.height;
            this.x = Math.random() * canvas.width;
        }
    }
}

// Initialize game
function init() {
    bird = new Bird();
    pipes = [];
    coins = [];
    frames = 0;
    score = 0;
    gameOver = false;
    gameStarted = false;
    isPaused = false;
    snowflakes = [];
    snowActive = false;
    isNightMode = false; // Reset Night/Day mode
}

// Game loop
function gameLoop() {
    if (gameOver || isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Night/Day toggle logic every 20-25 seconds
    ctx.drawImage(isNightMode ? nightBgImg : dayBgImg, 0, 0, canvas.width, canvas.height);

    // Draw and update pipes
    if (frames % 170 === 0) {
        pipes.push(new Pipe());
    }

    pipes.forEach(pipe => {
        pipe.draw();
        pipe.update();
    });

    // Draw and update snowflakes if active
    if (snowActive) {
        snowflakes.forEach(snowflake => {
            snowflake.draw();
            snowflake.update();
        });
    }

    // Draw and update bird
    bird.draw();
    bird.update();

    // Update score
    document.getElementById("score").innerText = `Score: ${score}`;

    frames++;
    animationFrame = requestAnimationFrame(gameLoop);

    // Night/Day mode toggling every 1200 frames (~20-25 sec)
    if (frames % 1200 === 0) {
        isNightMode = !isNightMode;
    }

    // Snow effect logic
    if (frames % 2000 === 1000) {
        startSnow();
    }
    if (frames % 2000 === 1800) {
        stopSnow();
    }
}

// Start snow
function startSnow() {
    snowActive = true;
    snowflakes = [];
    for (let i = 0; i < 50; i++) {
        snowflakes.push(new Snowflake());
    }
}

// Stop snow
function stopSnow() {
    snowActive = false;
}

// Start game
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        startGame();
    } else if (event.code === "KeyP") {
        togglePause();
    }
});

function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        backgroundMusic.loop = true;
        backgroundMusic.play();
        document.getElementById("start-screen").style.display = "none";
        gameLoop();
    }
    bird.flap();
}

// Pause & Resume Game
function togglePause() {
    if (!gameStarted || gameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
        cancelAnimationFrame(animationFrame);
    } else {
        gameLoop();
    }
}

// End game
function endGame() {
    hitSound.play();
    gameOverSound.play();
    backgroundMusic.pause();
    gameOver = true;
    cancelAnimationFrame(animationFrame);
    document.getElementById("game-over-screen").style.display = "block";
    document.getElementById("final-score").innerText = score;  // Update final score display
}

// Restart game
function restartGame() {
    document.getElementById("game-over-screen").style.display = "none";
    init();
    gameStarted = true;
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
    gameLoop();
}

// Initialize game on load
init();
