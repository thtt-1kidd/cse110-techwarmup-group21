const symbols = ['💸', '🎰', '📈', '🔮', '💰'];
const spinCost = 5;
let tokens = 100;
let isSpinning = false;
let stopRequested = false;

const spinBtn = document.getElementById('spin-button');
const stopBtn = document.getElementById('stop-button');
const resetBtn = document.getElementById('reset-button');
const balanceDisplay = document.getElementById('token-balance');
const logDisplay = document.getElementById('status-log');
const payoutDisplay = document.getElementById('payout-msg');
const reels = [
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
    document.getElementById('reel-3')
];

function updateDisplay() {
    balanceDisplay.textContent = tokens;
    spinBtn.disabled = tokens < spinCost || isSpinning;
}

// Logic for the Pause/Stop button
stopBtn.addEventListener('click', () => {
    stopRequested = true;
});

async function runInference() {
    if (tokens < spinCost) return;

    // Reset state
    isSpinning = true;
    stopRequested = false;
    tokens -= spinCost;
    updateDisplay();
    
    payoutDisplay.textContent = "";
    logDisplay.textContent = "Processing...";
    
    // Toggle buttons
    spinBtn.style.display = 'none';
    stopBtn.style.display = 'block';

    reels.forEach(reel => reel.classList.add('spinning'));

    // Wait for 2 seconds OR until stop is clicked
    for (let i = 0; i < 20; i++) {
        if (stopRequested) break;
        await new Promise(r => setTimeout(r, 100));
    }

    // Stop animation
    const results = reels.map(reel => {
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        reel.classList.remove('spinning');
        reel.textContent = randomSymbol;
        return randomSymbol;
    });

    calculatePayout(results);
    
    // Reset buttons
    isSpinning = false;
    spinBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    updateDisplay();
}

function calculatePayout(results) {
    const [s1, s2, s3] = results;
    let winAmount = 0;

    if (s1 === s2 && s2 === s3) {
        winAmount = 50; 
        logDisplay.textContent = "Jackpot! Perfect alignment.";
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        winAmount = 10;
        logDisplay.textContent = "Nice! A partial match.";
    } else {
        logDisplay.textContent = "No match this time.";
    }

    if (winAmount > 0) {
        tokens += winAmount;
        payoutDisplay.textContent = `+${winAmount} Tokens!`;
        updateDisplay();
    }
}

function resetGame() {
    if (confirm("Reset your tokens to 100?")) {
        tokens = 100;
        reels.forEach(reel => reel.textContent = '🤖');
        logDisplay.textContent = "Ready to play!";
        payoutDisplay.textContent = "";
        updateDisplay();
    }
}

spinBtn.addEventListener('click', runInference);
resetBtn.addEventListener('click', resetGame);
updateDisplay();