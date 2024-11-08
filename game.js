const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const userMoveElement = document.getElementById('userMove');
const computerMoveElement = document.getElementById('computerMove');
const resultElement = document.getElementById('result');

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;

    // Ensure video plays only when ready
    return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            resolve();
        };
    });
}

function getRandomMove() {
    const moves = ['Rock', 'Paper', 'Scissors'];
    return moves[Math.floor(Math.random() * moves.length)];
}

function determineWinner(userMove, computerMove) {
    if (userMove === computerMove) return 'Draw';
    if (
        (userMove === 'Rock' && computerMove === 'Scissors') ||
        (userMove === 'Paper' && computerMove === 'Rock') ||
        (userMove === 'Scissors' && computerMove === 'Paper')
    ) return 'You Win!';
    return 'Computer Wins!';
}

function recognizeGesture(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    // Debug logs for landmarks
    console.log("Landmarks:", landmarks);

    // Basic gesture detection logic
    const isFist = indexTip.y > landmarks[5].y && middleTip.y > landmarks[9].y && ringTip.y > landmarks[13].y && pinkyTip.y > landmarks[17].y;
    const isOpenHand = indexTip.y < landmarks[6].y && middleTip.y < landmarks[10].y && ringTip.y < landmarks[14].y && pinkyTip.y < landmarks[18].y;
    const isTwoFingers = indexTip.y < landmarks[6].y && middleTip.y < landmarks[10].y && ringTip.y > landmarks[14].y && pinkyTip.y > landmarks[18].y;

    if (isFist) return 'Rock';
    if (isTwoFingers) return 'Scissors';
    if (isOpenHand) return 'Paper';
    return null;
}

async function main() {
    await setupCamera();

    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
        maxNumHands: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
        try {
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                const landmarks = results.multiHandLandmarks[0];
                const userMove = recognizeGesture(landmarks);

                // Update display elements
                userMoveElement.innerText = userMove || "Unrecognized";
                const computerMove = userMove ? getRandomMove() : "None";
                computerMoveElement.innerText = computerMove;
                resultElement.innerText = userMove ? determineWinner(userMove, computerMove) : "Waiting...";

                // Draw landmarks on canvas for debugging
                canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                for (const point of landmarks) {
                    canvasCtx.beginPath();
                    canvasCtx.arc(point.x * canvasElement.width, point.y * canvasElement.height, 5, 0, 2 * Math.PI);
                    canvasCtx.fillStyle = 'blue';
                    canvasCtx.fill();
                }
            } else {
                userMoveElement.innerText = "No Hand Detected";
                computerMoveElement.innerText = "None";
                resultElement.innerText = "Waiting...";
                canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            }
        } catch (error) {
            console.error("Error processing hand landmarks:", error);
        }
    });

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            try {
                await hands.send({ image: videoElement });
            } catch (error) {
                console.error("Error sending frame to hands:", error);
            }
        },
        width: 640,
        height: 480,
    });
    camera.start();
}

main();
