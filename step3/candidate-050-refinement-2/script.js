document.addEventListener('DOMContentLoaded', () => {
    let tokens = 100;
    const spinCost = 5;
    const symbols = ['🌈', '🦄', '🎨', '🍭', '🍕'];
    let isSpinning = false;
    let spinTimeout;

    const balanceEl = document.getElementById('token-balance');
    const reels = [document.getElementById('reel-1'), document.getElementById('reel-2'), document.getElementById('reel-3')];
    const spinBtn = document.getElementById('spin-button');
    const stopBtn = document.getElementById('stop-button');
    const logContent = document.getElementById('log-content');

    function updateLog(msg) {
        const div = document.createElement('div');
        div.textContent = `• ${msg}`;
        logContent.prepend(div);
    }

    // Stop/Pause Logic
    stopBtn.addEventListener('click', () => {
        if (isSpinning) {
            clearTimeout(spinTimeout);
            stopSpinningUI();
            updateLog("STOPPED: Inference cancelled by user.");
            // Give back half the tokens as a "user-friendly" gesture
            tokens += Math.floor(spinCost / 2);
            balanceEl.textContent = tokens;
        }
    });

    function stopSpinningUI() {
        isSpinning = false;
        reels.forEach(r => r.classList.remove('spinning'));
        spinBtn.disabled = false;
        stopBtn.disabled = true;
        spinBtn.textContent = "🚀 START INFERENCE";
    }

    async function spin() {
        if (tokens < spinCost) return;

        tokens -= spinCost;
        balanceEl.textContent = tokens;
        
        isSpinning = true;
        spinBtn.disabled = true;
        stopBtn.disabled = false;
        spinBtn.textContent = "PROCESSING...";

        reels.forEach(reel => reel.classList.add('spinning'));
        updateLog("Initializing creative engine...");

        // Simulate delay that can be cancelled
        spinTimeout = setTimeout(() => {
            const results = reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]);
            reels.forEach((reel, i) => {
                reel.textContent = results[i];
            });
            stopSpinningUI();
            handleResults(results);
        }, 1500);
    }

    function handleResults(res) {
        const unique = new Set(res).size;
        let win = 0;
        if (unique === 1) {
            win = 50;
            updateLog("WOW! Perfect alignment! +50");
        } else if (unique === 2) {
            win = 10;
            updateLog("Great job! Almost there! +10");
        } else {
            updateLog("No match this time. Try again!");
        }
        tokens += win;
        balanceEl.textContent = tokens;
    }

    spinBtn.addEventListener('click', spin);
});