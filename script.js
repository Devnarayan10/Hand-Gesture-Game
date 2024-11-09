const game = document.getElementById('game');
const car = document.getElementById('car');
const obstacles = document.getElementById('obstacles');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreDisplay = document.getElementById('finalScore');

let carPosition = 1; // 0: left lane, 1: middle lane, 2: right lane
const laneWidth = 109; // Width of each lane
const carHeight = 90; // Height of the car
let score = 0;
let gameInterval;
let obstacleSpeed = 2;
let activeObstacles = [];
let obstacleCreationInterval = 4000; // Increased to reduce frequency

async function startGame() {
    score = 0;
    obstacleSpeed = 2;
    activeObstacles = [];
    updateScore();
    carPosition = 1; // Start in the middle lane
    car.style.left = `${carPosition * laneWidth + (laneWidth - 55) / 2}px`;
    obstacles.innerHTML = '';
    game.style.display = 'block';
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';

    // Set up video streaming
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();

    gameInterval = setInterval(createObstacles, obstacleCreationInterval);
    detectHands(video); // Start detecting hands
}

function detectHands(video) {
    handpose.load().then(model => {
        setInterval(async () => {
            const predictions = await model.estimateHands(video);
            if (predictions.length > 0) {
                const hand = predictions[0].landmarks;
                const x = hand[0][0]; // X coordinate of the wrist

                // Divide the video feed into three sections for lanes
                if (x < video.clientWidth / 3) {
                    carPosition = 0; // Left lane
                } else if (x < (video.clientWidth / 3) * 2) {
                    carPosition = 1; // Middle lane
                } else {
                    carPosition = 2; // Right lane
                }

                // Update car position
                car.style.left = `${carPosition * laneWidth + (laneWidth - 55) / 2}px`;
            }
        }, 100);
    });
}

function updateScore() {
    scoreDisplay.textContent = `Score: ${score}`;
}

function restartGame() {
    score = 0;
    obstacleSpeed = 2;
    activeObstacles = [];
    updateScore();
    carPosition = 1; // Start in the middle lane
    car.style.left = `${carPosition * laneWidth + (laneWidth - 55) / 2}px`;
    obstacles.innerHTML = '';
    gameOverScreen.style.display = 'none';
    game.style.display = 'block';

    gameInterval = setInterval(createObstacles, obstacleCreationInterval);
}

function createObstacles() {
    const lanesOccupied = [];

    for (let i = 0; i < 2; i++) {
        let randomLane;

        do {
            randomLane = Math.floor(Math.random() * 3);
        } while (lanesOccupied.includes(randomLane));

        lanesOccupied.push(randomLane);

        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle');
        obstacle.style.left = `${randomLane * laneWidth + (laneWidth - 55) / 2}px`;
        obstacle.style.top = '0px';
        obstacles.appendChild(obstacle);
        activeObstacles.push(obstacle);
        moveObstacle(obstacle);
    }
}

function moveObstacle(obstacle) {
    let obstacleInterval = setInterval(() => {
        const obstacleTop = parseInt(obstacle.style.top);
        const carBottom = game.offsetHeight - 20; // Adjust car's bottom position
        const carTop = carBottom - carHeight;
        const carLeft = parseInt(car.style.left);
        const obstacleLeft = parseInt(obstacle.style.left);

        if (obstacleTop > game.offsetHeight) {
            clearInterval(obstacleInterval);
            obstacles.removeChild(obstacle);
            activeObstacles = activeObstacles.filter(o => o !== obstacle);
            score++;
            updateScore();

            if (score % 5 === 0) {
                obstacleSpeed += 0.1; // Increase speed every 5 points
            }
        } else if (
            obstacleTop + 90 >= carTop &&
            obstacleTop < carBottom &&
            obstacleLeft === carLeft
        ) {
            clearInterval(obstacleInterval);
            game.style.display = 'none';
            gameOverScreen.style.display = 'block';
            finalScoreDisplay.textContent = score;
            clearInterval(gameInterval);
        } else {
            obstacle.style.top = `${obstacleTop + obstacleSpeed}px`;
        }
    }, 20);
}

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', restartGame);
