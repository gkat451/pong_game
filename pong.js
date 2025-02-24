const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const scoreDisplay = document.getElementById('scoreDisplay');
const toggleButton = document.getElementById('toggleButton');

// Load assets with fallbacks
const paddleImg = new Image();
paddleImg.src = 'assets/paddle.png';
paddleImg.onerror = () => {
    console.log('Paddle image not found, using rectangle');
    paddleImg.loaded = false;
};
paddleImg.onload = () => paddleImg.loaded = true;

const ballImg = new Image();
ballImg.src = 'assets/ball.png';
ballImg.onerror = () => {
    console.log('Ball image not found, using square');
    ballImg.loaded = false;
};
ballImg.onload = () => ballImg.loaded = true;

const hitSound = new Audio('assets/hit.wav');
hitSound.onerror = () => console.log('Hit sound not found');
const scoreSound = new Audio('assets/score.wav');
scoreSound.onerror = () => console.log('Score sound not found');

// Game objects
const paddleWidth = 30;
const paddleHeight = 120;
const ballSize = 10;
const player1 = { x: 10, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, score: 0 };
const player2 = { x: canvas.width - paddleWidth - 10, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, score: 0 };
const ball = { x: canvas.width / 2, y: canvas.height / 2, width: ballSize, height: ballSize, dx: 3, dy: 3 };

// Game state
let isRunning = false;
let animationFrameId = null;

// Input handling
document.addEventListener('keydown', (e) => {
    if (!isRunning) return;
    switch (e.key) {
        case 'w': player1.y -= 25; break;
        case 's': player1.y += 25; break;
        case 'ArrowUp': player2.y -= 25; break;
        case 'ArrowDown': player2.y += 25; break;
    }
});

function keepPaddleInBounds(paddle) {
    if (paddle.y < 0) paddle.y = 0;
    if (paddle.y + paddle.height > canvas.height) paddle.y = canvas.height - paddle.height;
}

// Collision and movement
function checkCollision(ball, paddle) {
    return ball.x < paddle.x + paddle.width &&
           ball.x + ball.width > paddle.x &&
           ball.y < paddle.y + paddle.height &&
           ball.y + ball.height > paddle.y;
}

function updateBall() {
    if (!isRunning) return;
    ball.x += ball.dx;
    ball.y += ball.dy;
    if (ball.y <= 0 || ball.y + ball.height >= canvas.height) ball.dy = -ball.dy;
    if (checkCollision(ball, player1) || checkCollision(ball, player2)) {
        ball.dx = -ball.dx * 1.05;
        hitSound.play().catch(() => console.log('Hit sound play failed'));
    }
    if (ball.x <= 0) {
        player2.score++;
        scoreSound.play().catch(() => console.log('Score sound play failed'));
        resetBall();
    } else if (ball.x + ball.width >= canvas.width) {
        player1.score++;
        scoreSound.play().catch(() => console.log('Score sound play failed'));
        resetBall();
    }
    updateScore();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 3 : -3);
    ball.dy = (Math.random() > 0.5 ? 3 : -3);
}

// Update score display
function updateScore() {
    scoreDisplay.textContent = `Player 1: ${player1.score} - Player 2: ${player2.score}`;
}

// Rendering
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line (dashed)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    for (let y = 0; y < canvas.height; y += 20) {
        ctx.fillRect(canvas.width / 2 - 1, y, 2, 10);
    }
    ctx.closePath();

    // Draw paddles
    if (paddleImg.loaded) {
        ctx.drawImage(paddleImg, player1.x, player1.y, player1.width, player1.height);
        ctx.drawImage(paddleImg, player2.x, player2.y, player2.width, player2.height);
    } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
        ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
    }

    // Draw ball
    if (ballImg.loaded) {
        ctx.drawImage(ballImg, ball.x, ball.y, ball.width, ball.height);
    } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(ball.x, ball.y, ball.width, ball.height);
    }
}

// Game loop
function gameLoop() {
    keepPaddleInBounds(player1);
    keepPaddleInBounds(player2);
    updateBall();
    render();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Toggle game state
toggleButton.addEventListener('click', () => {
    if (isRunning) {
        isRunning = false;
        toggleButton.textContent = 'START';
        toggleButton.classList.remove('running');
        cancelAnimationFrame(animationFrameId);
    } else {
        isRunning = true;
        toggleButton.textContent = 'STOP';
        toggleButton.classList.add('running');
        gameLoop();
    }
});

// Initialize game
Promise.all([
    new Promise(resolve => paddleImg.onload = resolve),
    new Promise(resolve => ballImg.onload = resolve)
]).then(() => {
    render(); // Initial render
    updateScore(); // Initial score
}).catch(() => {
    console.log('Assets failed to load, starting with fallbacks');
    paddleImg.loaded = false;
    ballImg.loaded = false;
    render();
    updateScore();
});