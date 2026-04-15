const symbols = ['🤖', '🎰', '💸', '📈', '🧠', '⚡'];
const SPIN_COST = 10;
let tokens = 100;
let totalBurned = 0;
let isSpinning = false;
let stopRequested = false;

const tokenDisplay = document.getElementById('token-count');
const burnDisplay = document.getElementById('burn-count');
const spinBtn = document.getElementById('spin-btn');
const stopBtn = document.getElementById('stop-btn');
const resetBtn = document.getElementById('reset-btn');
const statusMsg = document.getElementById('status-msg');
const reels = [document.getElementById('reel-1'), document.getElementById('reel-2'), document.getElementById('reel-3')];

function updateUI() {
    tokenDisplay.textContent = tokens;
    burnDisplay.textContent = totalBurned;
    spinBtn.disabled = tokens < SPIN_COST || isSpinning;
}

// Logic to stop the spin immediately
stopBtn.addEventListener('click', () => {
    stopRequested = true;
    statusMsg.textContent = "Initiating Emergency Halt...";
    stopBtn.disabled = true;
});

async function spin() {
    if (isSpinning || tokens < SPIN_COST) return;

    isSpinning = true;
    stopRequested = false;
    tokens -= SPIN_COST;
    totalBurned += SPIN_COST;
    updateUI();

    statusMsg.textContent = "Spinning...";
    statusMsg.className = "msg-system";
    
    stopBtn.disabled = false;
    spinBtn.disabled = true;

    reels.forEach(r => r.classList.add('spinning'));

    // We check for stopRequested during the "latency" period
    const waitTime = 2000;
    const checkInterval = 100;
    let elapsed = 0;

    while (elapsed < waitTime && !stopRequested) {
        await new Promise(r => setTimeout(r, checkInterval));
        elapsed += checkInterval;
    }

    const results = reels.map(r => {
        r.classList.remove('spinning');
        const res = symbols[Math.floor(Math.random() * symbols.length)];
        r.textContent = res;
        return res;
    });

    if (stopRequested) {
        statusMsg.textContent = "Manual override: Inference stopped safely.";
    } else {
        evaluate(results);
    }

    isSpinning = false;
    stopBtn.disabled = true;
    updateUI();
}

function evaluate(res) {
    const [s1, s2, s3] = res;
    let win = 0;
    if (s1 === s2 && s2 === s3) {
        win = 100;
        statusMsg.textContent = "BIG WIN! 🎉";
        statusMsg.className = "msg-win";
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        win = 20;
        statusMsg.textContent = "Small Win! 👍";
        statusMsg.className = "msg-win";
    } else {
        statusMsg.textContent = "No match this time. Try again!";
        statusMsg.className = "msg-error";
    }
    tokens += win;
}

function reset() {
    if (isSpinning) return;
    tokens = 100;
    totalBurned = 0;
    statusMsg.textContent = "Game reset. Good luck!";
    updateUI();
}

spinBtn.addEventListener('click', spin);
resetBtn.addEventListener('click', reset);