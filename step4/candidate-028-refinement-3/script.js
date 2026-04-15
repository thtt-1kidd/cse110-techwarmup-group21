const symbols = ['💸', '🎰', '📈', '🔮', '💰', '🚀', '💎'];
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

stopBtn.addEventListener('click', () => {
    stopRequested = true;
    stopBtn.disabled = true;
    stopBtn.textContent = "STOPPING...";
});

async function runInference() {
    if (tokens < spinCost) return;

    isSpinning = true;
    stopRequested = false;
    tokens -= spinCost;
    updateDisplay();
    
    payoutDisplay.textContent = "";
    logDisplay.textContent = "AI is thinking...";
    
    spinBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    stopBtn.disabled = false;
    stopBtn.textContent = "🛑 STOP NOW";

    reels.forEach(reel => reel.classList.add('spinning'));

    // Spin for at least 800ms, max 3 seconds
    for (let i = 0; i < 30; i++) {
        if (stopRequested && i > 8) break; 
        await new Promise(r => setTimeout(r, 100));
    }

    // Stop reels one by one with a tiny delay
    const results = [];
    for (let i = 0; i < reels.length; i++) {
        await new Promise(r => setTimeout(r, 150)); // stagger effect
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        reels[i].classList.remove('spinning');
        reels[i].textContent = randomSymbol;
        results.push(randomSymbol);
    }

    calculatePayout(results);
    
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
        logDisplay.textContent = "🚀 MEGA JACKPOT!";
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        winAmount = 10;
        logDisplay.textContent = "✨ Nice Match!";
    } else {
        logDisplay.textContent = "Try again!";
    }

    if (winAmount > 0) {
        tokens += winAmount;
        payoutDisplay.innerHTML = `<span class="win-text">+${winAmount} Tokens!</span>`;
    }
}

function resetGame() {
    tokens = 100;
    reels.forEach(reel => reel.textContent = '🤖');
    logDisplay.textContent = "Ready to play!";
    payoutDisplay.textContent = "";
    updateDisplay();
}

spinBtn.addEventListener('click', runInference);
resetBtn.addEventListener('click', resetGame);
updateDisplay();