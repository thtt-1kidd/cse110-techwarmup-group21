document.addEventListener('DOMContentLoaded', () => {
    let tokens = 100;
    const spinCost = 5;
    const symbols = ['🌈', '🦄', '🎨', '🍭', '🍕'];
    let isSpinning = false;
    let spinTimeout;

    const balanceEl = document.getElementById('token-balance');
    const reels = [
        document.getElementById('reel-1'), 
        document.getElementById('reel-2'), 
        document.getElementById('reel-3')
    ];
    const spinBtn = document.getElementById('spin-button');
    const stopBtn = document.getElementById('stop-button');
    const logContent = document.getElementById('log-content');
    const terminal = document.querySelector('.terminal');

    /**
     * Updates the activity log with a friendly animation
     */
    function updateLog(msg) {
        // Automatically expand the terminal widget if it's hidden
        terminal.classList.add('active');
        
        const div = document.createElement('div');
        div.style.padding = "4px 0";
        div.style.borderBottom = "1px solid #eee";
        div.style.fontSize = "0.85rem";
        div.innerHTML = `<span style="color: #6c5ce7; font-weight: bold;">•</span> ${msg}`;
        
        logContent.prepend(div);
    }

    /**
     * Resets UI states after a spin or stop
     */
    function stopSpinningUI() {
        isSpinning = false;
        reels.forEach(r => r.classList.remove('spinning'));
        spinBtn.disabled = false;
        stopBtn.disabled = true;
        spinBtn.textContent = "🚀 START INFERENCE";
        spinBtn.style.opacity = "1";
    }

    /**
     * Logic for the "Emergency Stop"
     */
    stopBtn.addEventListener('click', () => {
        if (isSpinning) {
            clearTimeout(spinTimeout);
            stopSpinningUI();
            updateLog("STOPPED: Inference cancelled. Half-refund issued! 🎁");
            
            // User-friendly refund gesture
            tokens += Math.floor(spinCost / 2);
            balanceEl.textContent = tokens;
            
            // Reset reel scale
            reels.forEach(r => r.style.transform = "scale(1)");
        }
    });

    /**
     * Main Spin Logic
     */
    async function spin() {
        if (tokens < spinCost) {
            updateLog("Oh no! You're out of tokens. Refresh to reset! 🪙");
            return;
        }

        // Deduct cost and update UI
        tokens -= spinCost;
        balanceEl.textContent = tokens;
        
        isSpinning = true;
        spinBtn.disabled = true;
        stopBtn.disabled = false;
        spinBtn.textContent = "PROCESSING...";
        spinBtn.style.opacity = "0.7";

        // Visual feedback
        reels.forEach(reel => {
            reel.classList.add('spinning');
            reel.style.transform = "scale(1)"; // Reset any previous win scale
        });
        
        updateLog("Initializing creative engine...");

        // Simulate network/inference delay
        spinTimeout = setTimeout(() => {
            const results = reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]);
            
            reels.forEach((reel, i) => {
                reel.textContent = results[i];
                // Add a playful "finish" pop
                reel.style.transform = "scale(1.1)";
            });

            stopSpinningUI();
            handleResults(results);
        }, 1500);
    }

    /**
     * Determines win/loss and updates balance
     */
    function handleResults(res) {
        const unique = new Set(res).size;
        let win = 0;

        if (unique === 1) {
            win = 50;
            updateLog("✨ AMAZING! Triple Match! +50 Tokens ✨");
            triggerWinEffect();
        } else if (unique === 2) {
            win = 10;
            updateLog("Nice! A double match. +10 Tokens!");
        } else {
            updateLog("No match this time, but the AI loved the attempt!");
        }

        tokens += win;
        balanceEl.textContent = tokens;
    }

    /**
     * Optional visual flair for big wins
     */
    function triggerWinEffect() {
        terminal.style.backgroundColor = "#e1ffed";
        setTimeout(() => {
            terminal.style.backgroundColor = "#fdf6ff";
        }, 500);
    }

    spinBtn.addEventListener('click', spin);
});