(() => {
    "use strict";

    const CONFIG = {
        startingCredits: 100,
        spinCost: 10,
        symbols: ["🤖", "📈", "💸", "🔥", "🌀"],
        triplePayouts: {
            "🤖": 40,
            "📈": 25,
            "💸": 20,
            "🔥": 15,
            "🌀": 0
        },
        pairPayout: 4,
        reelCopies: 5,
        reelItemHeight: 110,
        spinDurationBase: 950
    };

    const state = {
        credits: CONFIG.startingCredits,
        totalBurn: 0,
        totalWon: 0,
        spins: 0,
        wins: 0,
        isSpinning: false,
        lastPayout: null,
        lastNet: null,
        currentSymbols: ["🤖", "📈", "💸"]
    };

    const elements = {
        tokenCount: document.getElementById("token-count"),
        spinCost: document.getElementById("spin-cost"),
        burnCount: document.getElementById("burn-count"),
        wonCount: document.getElementById("won-count"),
        lastPayout: document.getElementById("last-payout"),
        lastNet: document.getElementById("last-net"),
        spinBtn: document.getElementById("spin-btn"),
        resetBtn: document.getElementById("reset-btn"),
        statusMsg: document.getElementById("status-msg"),
        resultPanel: document.getElementById("result-panel"),
        resultState: document.getElementById("result-state"),
        resultMessage: document.getElementById("result-message"),
        resultDetail: document.getElementById("result-detail"),
        rolledSymbols: document.getElementById("rolled-symbols"),
        reels: [
            document.getElementById("reel-1"),
            document.getElementById("reel-2"),
            document.getElementById("reel-3")
        ]
    };

    function formatNumber(value) {
        return new Intl.NumberFormat("en-US").format(value);
    }

    function formatSigned(value) {
        if (value === 0) {
            return "0";
        }
        return `${value > 0 ? "+" : "-"}${formatNumber(Math.abs(value))}`;
    }

    function randomSymbol() {
        const index = Math.floor(Math.random() * CONFIG.symbols.length);
        return CONFIG.symbols[index];
    }

    function clampNonNegative(value) {
        return Math.max(0, value);
    }

    function setStatus(message) {
        elements.statusMsg.textContent = `> ${message}`;
    }

    function setResultPanel(type, stateLabel, message, detail, symbolsText) {
        elements.resultPanel.classList.remove("neutral", "win", "loss", "flash-win", "flash-loss");
        elements.resultPanel.classList.add(type);

        elements.resultState.textContent = stateLabel;
        elements.resultMessage.textContent = message;
        elements.resultDetail.textContent = detail;
        elements.rolledSymbols.textContent = symbolsText;

        void elements.resultPanel.offsetWidth;

        if (type === "win") {
            elements.resultPanel.classList.add("flash-win");
        } else if (type === "loss") {
            elements.resultPanel.classList.add("flash-loss");
        }
    }

    function buildReelMarkup(targetSymbol) {
        const sequence = [];

        for (let copy = 0; copy < CONFIG.reelCopies; copy += 1) {
            for (const symbol of CONFIG.symbols) {
                sequence.push(symbol);
            }
        }

        sequence.push(targetSymbol);

        return sequence
            .map((symbol, index) => {
                const activeClass = index === sequence.length - 1 ? " active" : "";
                return `<div class="reel-item${activeClass}" data-symbol="${symbol}">${symbol}</div>`;
            })
            .join("");
    }

    function setReelToSymbol(reelElement, symbol) {
        reelElement.style.transition = "none";
        reelElement.innerHTML = `<div class="reel-item active" data-symbol="${symbol}">${symbol}</div>`;
        reelElement.style.transform = "translateY(0)";
        reelElement.offsetHeight;
        reelElement.style.transition = "";
    }

    function initializeReels() {
        state.currentSymbols.forEach((symbol, index) => {
            setReelToSymbol(elements.reels[index], symbol);
        });
    }

    function updateStats() {
        elements.tokenCount.textContent = formatNumber(state.credits);
        elements.spinCost.textContent = formatNumber(CONFIG.spinCost);
        elements.burnCount.textContent = formatNumber(state.totalBurn);
        elements.wonCount.textContent = formatNumber(state.totalWon);

        if (state.lastPayout === null) {
            elements.lastPayout.textContent = "—";
        } else {
            elements.lastPayout.textContent = formatNumber(state.lastPayout);
        }

        if (state.lastNet === null) {
            elements.lastNet.textContent = "—";
            elements.lastNet.className = "stat-value neutral";
        } else {
            elements.lastNet.textContent = formatSigned(state.lastNet);
            elements.lastNet.className = `stat-value ${state.lastNet > 0 ? "positive" : state.lastNet < 0 ? "negative" : "neutral"}`;
        }

        const canSpin = state.credits >= CONFIG.spinCost && !state.isSpinning;
        elements.spinBtn.disabled = !canSpin;

        if (state.isSpinning) {
            elements.spinBtn.textContent = "Running Inference...";
        } else if (state.credits < CONFIG.spinCost) {
            elements.spinBtn.textContent = "Insufficient Credits";
        } else {
            elements.spinBtn.textContent = `Run Inference (${CONFIG.spinCost} Tokens)`;
        }
    }

    function evaluateResult(symbols) {
        const [first, second, third] = symbols;

        if (first === second && second === third) {
            return {
                kind: "triple",
                symbol: first,
                payout: CONFIG.triplePayouts[first] ?? 0
            };
        }

        const counts = symbols.reduce((accumulator, symbol) => {
            accumulator[symbol] = (accumulator[symbol] || 0) + 1;
            return accumulator;
        }, {});

        const pairSymbol = Object.keys(counts).find((symbol) => counts[symbol] >= 2);

        if (pairSymbol) {
            return {
                kind: "pair",
                symbol: pairSymbol,
                payout: CONFIG.pairPayout
            };
        }

        return {
            kind: "none",
            symbol: null,
            payout: 0
        };
    }

    function buildOutcome(symbols, result, net) {
        const rolledText = `Rolled: ${symbols.join(" ")}`;

        if (result.kind === "triple") {
            if (result.payout > 0) {
                return {
                    panelType: "win",
                    stateLabel: "Win",
                    message: `Triple ${result.symbol}. Venture funding secured.`,
                    detail: `Payout +${formatNumber(result.payout)} credits · Net ${formatSigned(net)}.`,
                    log: `Inference complete. Triple ${result.symbol} produced a premium outcome.`,
                    rolledText
                };
            }

            return {
                panelType: "loss",
                stateLabel: "Loss",
                message: `Triple ${result.symbol}. Elegant failure mode detected.`,
                detail: `Payout +0 credits · Net ${formatSigned(net)}.`,
                log: `Inference complete. Triple ${result.symbol} collapsed expected value.`,
                rolledText
            };
        }

        if (result.kind === "pair") {
            return {
                panelType: "win",
                stateLabel: "Small Win",
                message: `Two ${result.symbol}s. A pity payout has been authorized.`,
                detail: `Payout +${formatNumber(result.payout)} credits · Net ${formatSigned(net)}.`,
                log: `Inference complete. Pair match on ${result.symbol}.`,
                rolledText
            };
        }

        return {
            panelType: "loss",
            stateLabel: "Loss",
            message: "No match. Your budget has been converted into roadmap energy.",
            detail: `Payout +0 credits · Net ${formatSigned(net)}.`,
            log: "Inference complete. No meaningful alignment detected.",
            rolledText
        };
    }

    function animateReel(reelElement, targetSymbol, reelIndex) {
        return new Promise((resolve) => {
            reelElement.innerHTML = buildReelMarkup(targetSymbol);
            reelElement.style.transition = "none";
            reelElement.style.transform = "translateY(0)";
            reelElement.offsetHeight;

            const finalIndex = CONFIG.reelCopies * CONFIG.symbols.length;
            const finalOffset = -(finalIndex * CONFIG.reelItemHeight);
            const duration = CONFIG.spinDurationBase + (reelIndex * 220);

            reelElement.style.transition = `transform ${duration}ms cubic-bezier(0.18, 0.84, 0.24, 1)`;
            reelElement.style.transform = `translateY(${finalOffset}px)`;

            window.setTimeout(() => {
                setReelToSymbol(reelElement, targetSymbol);
                resolve();
            }, duration + 40);
        });
    }

    async function spin() {
        if (state.isSpinning || state.credits < CONFIG.spinCost) {
            return;
        }

        state.isSpinning = true;
        state.spins += 1;
        state.credits = clampNonNegative(state.credits - CONFIG.spinCost);
        state.totalBurn += CONFIG.spinCost;
        state.lastPayout = 0;
        state.lastNet = -CONFIG.spinCost;

        updateStats();
        setStatus("Inference started. Allocating expensive uncertainty...");
        setResultPanel(
            "neutral",
            "Spinning",
            "Reels are spinning. The cluster is pretending to be useful.",
            `Spin cost applied: -${formatNumber(CONFIG.spinCost)} credits.`,
            "Rolled: ..."
        );

        const symbols = [randomSymbol(), randomSymbol(), randomSymbol()];

        await Promise.all(
            elements.reels.map((reelElement, index) => animateReel(reelElement, symbols[index], index))
        );

        state.currentSymbols = symbols;

        const result = evaluateResult(symbols);
        const net = result.payout - CONFIG.spinCost;

        if (result.payout > 0) {
            state.credits += result.payout;
            state.totalWon += result.payout;
            state.wins += 1;
            state.lastPayout = result.payout;
        } else {
            state.lastPayout = 0;
        }

        state.lastNet = net;

        const outcome = buildOutcome(symbols, result, net);

        setStatus(outcome.log);
        setResultPanel(
            outcome.panelType,
            outcome.stateLabel,
            outcome.message,
            outcome.detail,
            outcome.rolledText
        );

        if (state.credits <= 0) {
            setStatus("Funding depleted. Compute access revoked.");
            setResultPanel(
                "loss",
                "Game Over",
                "You are out of credits. The stochastic future has arrived.",
                `${outcome.detail} Balance: 0.`,
                outcome.rolledText
            );
        }

        state.isSpinning = false;
        updateStats();
    }

    function resetGame() {
        state.credits = CONFIG.startingCredits;
        state.totalBurn = 0;
        state.totalWon = 0;
        state.spins = 0;
        state.wins = 0;
        state.isSpinning = false;
        state.lastPayout = null;
        state.lastNet = null;
        state.currentSymbols = ["🤖", "📈", "💸"];

        initializeReels();
        updateStats();
        setStatus("System reset. Seed funding restored.");
        setResultPanel(
            "neutral",
            "Ready",
            "Awaiting prompt injection...",
            "No spin yet.",
            "—"
        );
    }

    function bindEvents() {
        elements.spinBtn.addEventListener("click", spin);
        elements.resetBtn.addEventListener("click", resetGame);

        document.addEventListener("keydown", (event) => {
            if (event.code === "Space") {
                event.preventDefault();
                if (!elements.spinBtn.disabled) {
                    spin();
                }
            }

            if (event.key.toLowerCase() === "r") {
                resetGame();
            }
        });
    }

    function init() {
        initializeReels();
        bindEvents();
        updateStats();
        setStatus("Awaiting prompt injection...");
        setResultPanel(
            "neutral",
            "Ready",
            "Awaiting prompt injection...",
            "No spin yet.",
            "—"
        );
    }

    init();
})();