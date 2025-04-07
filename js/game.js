// Game configuration
const config = {
    gridSize: 20,
    cellSize: 25,
    initialSpeed: 130, // milliseconds per move
    speedIncrease: 2,  // ms faster per food eaten
    minSpeed: 50,      // fastest possible speed
    colors: {
        background: '#16213e',
        snake: {
            head: '#e94560',
            body: '#0f3460'
        },
        food: '#e94560',
        grid: '#233458'
    }
};

// Game state
let canvas, ctx;
let snake = [];
let food = { x: 0, y: 0 };
let direction = 'right';
let nextDirection = 'right';
let gameInterval;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let isPaused = false;
let isGameOver = false;
let isGameStarted = false;

// Initialize the game
function init() {
    // Set up canvas
    canvas = document.getElementById('game-board');
    canvas.width = config.gridSize * config.cellSize;
    canvas.height = config.gridSize * config.cellSize;
    ctx = canvas.getContext('2d');

    // Initialize high score display
    document.getElementById('high-score').textContent = highScore;

    // Set up event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('play-again-btn').addEventListener('click', restartGame);
    
    // Mobile controls
    document.getElementById('up-btn').addEventListener('click', () => changeDirection('up'));
    document.getElementById('down-btn').addEventListener('click', () => changeDirection('down'));
    document.getElementById('left-btn').addEventListener('click', () => changeDirection('left'));
    document.getElementById('right-btn').addEventListener('click', () => changeDirection('right'));
    
    // Handle touch events for swipe controls
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, false);
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, false);
    
    canvas.addEventListener('touchend', (e) => {
        if (!isGameStarted) {
            startGame();
            return;
        }
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // Determine direction based on which axis had the larger movement
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) {
                changeDirection('right');
            } else {
                changeDirection('left');
            }
        } else {
            if (diffY > 0) {
                changeDirection('down');
            } else {
                changeDirection('up');
            }
        }
    }, false);
    
    // Initially draw grid
    drawGame();
}

// Change the direction of the snake
function changeDirection(newDirection) {
    // Prevent 180-degree turns
    if (
        (direction === 'right' && newDirection === 'left') ||
        (direction === 'left' && newDirection === 'right') ||
        (direction === 'up' && newDirection === 'down') ||
        (direction === 'down' && newDirection === 'up')
    ) {
        return;
    }
    
    nextDirection = newDirection;
}

// Handle keyboard input
function handleKeyDown(event) {
    if (!isGameStarted && event.key.includes('Arrow')) {
        startGame();
        return;
    }
    
    // Game controls
    switch (event.key) {
        case 'ArrowUp':
            changeDirection('up');
            break;
        case 'ArrowDown':
            changeDirection('down');
            break;
        case 'ArrowLeft':
            changeDirection('left');
            break;
        case 'ArrowRight':
            changeDirection('right');
            break;
        case ' ':
            togglePause();
            break;
    }
}

// Start the game
function startGame() {
    if (isGameStarted) return;
    
    // Initialize snake
    snake = [
        { x: 3, y: 10 },
        { x: 2, y: 10 },
        { x: 1, y: 10 }
    ];
    
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    isGameOver = false;
    isPaused = false;
    isGameStarted = true;
    
    // Update score display
    document.getElementById('score').textContent = score;
    
    // Create first food
    createFood();
    
    // Start game loop
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, config.initialSpeed);
    
    // Update UI
    document.getElementById('start-btn').disabled = true;
    document.getElementById('game-over').style.display = 'none';
}

// Pause or resume the game
function togglePause() {
    if (!isGameStarted || isGameOver) return;
    
    isPaused = !isPaused;
    document.getElementById('pause-btn').textContent = isPaused ? 'Resume' : 'Pause';
}

// Main game loop
function gameLoop() {
    if (isPaused || isGameOver) return;
    
    // Update direction
    direction = nextDirection;
    
    // Move snake
    moveSnake();
    
    // Check for collisions
    if (checkCollision()) {
        handleGameOver();
        return;
    }
    
    // Check if food is eaten
    checkFood();
    
    // Draw everything
    drawGame();
}

// Move the snake
function moveSnake() {
    // Get the current head position
    const head = { ...snake[0] };
    
    // Calculate new head position
    switch (direction) {
        case 'right':
            head.x++;
            break;
        case 'left':
            head.x--;
            break;
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
    }
    
    // Add new head to the beginning of the snake array
    snake.unshift(head);
    
    // Remove tail if we didn't eat food
    if (head.x !== food.x || head.y !== food.y) {
        snake.pop();
    }
}

// Check for collisions with walls or self
function checkCollision() {
    const head = snake[0];
    
    // Check wall collision
    if (
        head.x < 0 || 
        head.x >= config.gridSize || 
        head.y < 0 || 
        head.y >= config.gridSize
    ) {
        return true;
    }
    
    // Check self collision (start from index 1 to skip the head)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Check if food is eaten
function checkFood() {
    const head = snake[0];
    
    if (head.x === food.x && head.y === food.y) {
        // Increase score
        score++;
        document.getElementById('score').textContent = score;
        
        // Create new food
        createFood();
        
        // Increase speed
        if (config.initialSpeed - (score * config.speedIncrease) > config.minSpeed) {
            clearInterval(gameInterval);
            const newSpeed = config.initialSpeed - (score * config.speedIncrease);
            gameInterval = setInterval(gameLoop, newSpeed);
        }
    }
}

// Create new food at random position
function createFood() {
    // Find available position
    let newFood;
    let isOccupied = true;
    
    while (isOccupied) {
        newFood = {
            x: Math.floor(Math.random() * config.gridSize),
            y: Math.floor(Math.random() * config.gridSize)
        };
        
        // Check if position is occupied by snake
        isOccupied = snake.some(segment => 
            segment.x === newFood.x && segment.y === newFood.y
        );
    }
    
    food = newFood;
}

// Draw everything on canvas
function drawGame() {
    // Clear canvas
    ctx.fillStyle = config.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw food
    drawFood();
    
    // Draw snake
    drawSnake();
}

// Draw grid lines
function drawGrid() {
    ctx.strokeStyle = config.colors.grid;
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += config.cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += config.cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Draw food
function drawFood() {
    const x = food.x * config.cellSize;
    const y = food.y * config.cellSize;
    
    ctx.fillStyle = config.colors.food;
    
    // Draw a circle for food
    ctx.beginPath();
    ctx.arc(
        x + config.cellSize / 2,
        y + config.cellSize / 2,
        config.cellSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Add a shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(
        x + config.cellSize / 3,
        y + config.cellSize / 3,
        config.cellSize / 5,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// Draw snake
function drawSnake() {
    // Draw each segment
    snake.forEach((segment, index) => {
        const x = segment.x * config.cellSize;
        const y = segment.y * config.cellSize;
        
        // Different style for head
        if (index === 0) {
            drawSnakeHead(x, y);
        } else {
            drawSnakeSegment(x, y, index);
        }
    });
}

// Draw snake head
function drawSnakeHead(x, y) {
    const padding = 1;
    
    // Draw head
    ctx.fillStyle = config.colors.snake.head;
    ctx.fillRect(
        x + padding,
        y + padding,
        config.cellSize - padding * 2,
        config.cellSize - padding * 2
    );
    
    // Draw eyes
    ctx.fillStyle = 'white';
    
    // Eye positions depend on direction
    let eyeOffset1, eyeOffset2;
    
    switch (direction) {
        case 'right':
            eyeOffset1 = { x: config.cellSize * 0.7, y: config.cellSize * 0.3 };
            eyeOffset2 = { x: config.cellSize * 0.7, y: config.cellSize * 0.7 };
            break;
        case 'left':
            eyeOffset1 = { x: config.cellSize * 0.3, y: config.cellSize * 0.3 };
            eyeOffset2 = { x: config.cellSize * 0.3, y: config.cellSize * 0.7 };
            break;
        case 'up':
            eyeOffset1 = { x: config.cellSize * 0.3, y: config.cellSize * 0.3 };
            eyeOffset2 = { x: config.cellSize * 0.7, y: config.cellSize * 0.3 };
            break;
        case 'down':
            eyeOffset1 = { x: config.cellSize * 0.3, y: config.cellSize * 0.7 };
            eyeOffset2 = { x: config.cellSize * 0.7, y: config.cellSize * 0.7 };
            break;
    }
    
    // Draw the eyes
    ctx.beginPath();
    ctx.arc(x + eyeOffset1.x, y + eyeOffset1.y, config.cellSize * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x + eyeOffset2.x, y + eyeOffset2.y, config.cellSize * 0.12, 0, Math.PI * 2);
    ctx.fill();
}

// Draw snake body segment
function drawSnakeSegment(x, y, index) {
    const padding = 1;
    
    // Create a gradient from body to tail
    const gradient = ctx.createLinearGradient(
        x,
        y,
        x + config.cellSize,
        y + config.cellSize
    );
    
    // Adjust the segment color based on position to create a gradient effect
    const position = index / snake.length;
    const interpolatedColor = interpolateColor(
        hexToRgb(config.colors.snake.head),
        hexToRgb(config.colors.snake.body),
        position * 0.8
    );
    
    gradient.addColorStop(0, rgbToHex(interpolatedColor));
    gradient.addColorStop(1, config.colors.snake.body);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
        x + padding,
        y + padding,
        config.cellSize - padding * 2,
        config.cellSize - padding * 2
    );
}

// Handle game over
function handleGameOver() {
    isGameOver = true;
    isGameStarted = false;
    clearInterval(gameInterval);
    
    // Update high score if needed
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('high-score').textContent = highScore;
    }
    
    // Show game over screen
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-high-score').textContent = highScore;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('start-btn').disabled = false;
}

// Restart the game
function restartGame() {
    document.getElementById('game-over').style.display = 'none';
    startGame();
}

// Helper functions for colors
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function rgbToHex(rgb) {
    return `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1)}`;
}

function interpolateColor(color1, color2, factor) {
    return {
        r: Math.round(color1.r + factor * (color2.r - color1.r)),
        g: Math.round(color1.g + factor * (color2.g - color1.g)),
        b: Math.round(color1.b + factor * (color2.b - color1.b))
    };
}

// Start the game
window.onload = init; 