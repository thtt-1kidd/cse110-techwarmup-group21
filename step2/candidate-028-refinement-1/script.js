(() => {
    "use strict";
  
    const CONFIG = {
      startingTokens: 100,
      spinCost: 5,
      symbols: ["🤖", "🧠", "💸", "🔥", "📈", "🌀"],
      triplePayouts: {
        "🤖": 20,
        "🧠": 15,
        "💸": 12,
        "🔥": 10,
        "📈": 8,
        "🌀": 0
      },
      pairPayout: 2,
      reelCopies: 5,
      reelItemHeight: 112,
      spinDurationBase: 950
    };
  
    const state = {
      tokens: CONFIG.startingTokens,
      totalSpent: 0,
      totalWon: 0,
      spins: 0,
      wins: 0,
      isSpinning: false,
      lastPayout: null,
      lastNet: null,
      currentSymbols: ["🤖", "🤖", "🤖"]
    };
  
    const elements = {
      tokenBalance: document.getElementById("token-balance"),
      spinCost: document.getElementById("spin-cost"),
      totalSpent: document.getElementById("total-spent"),
      totalWon: document.getElementById("total-won"),
      lastPayout: document.getElementById("last-payout"),
      lastNet: document.getElementById("last-net"),
      statusLog: document.getElementById("status-log"),
      payoutMsg: document.getElementById("payout-msg"),
      rolledSymbols: document.getElementById("rolled-symbols"),
      spinButton: document.getElementById("spin-button"),
      resetButton: document.getElementById("reset-button"),
      reelElements: [
        document.getElementById("reel-1"),
        document.getElementById("reel-2"),
        document.getElementById("reel-3")
      ],
      winRate: document.getElementById("winRateDisplay")
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
  
    function setLog(message) {
      elements.statusLog.textContent = `> ${message}`;
    }
  
    function setPayoutMessage(type, message) {
      elements.payoutMsg.className = `payout-content ${type}`;
      elements.payoutMsg.textContent = message;
    }
  
    function setRolledSymbols(symbolsText) {
      elements.rolledSymbols.textContent = symbolsText;
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
        setReelToSymbol(elements.reelElements[index], symbol);
      });
    }
  
    function updateStats() {
      elements.tokenBalance.textContent = formatNumber(state.tokens);
      elements.spinCost.textContent = formatNumber(CONFIG.spinCost);
      elements.totalSpent.textContent = formatNumber(state.totalSpent);
      elements.totalWon.textContent = formatNumber(state.totalWon);
  
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
  
      const canSpin = state.tokens >= CONFIG.spinCost && !state.isSpinning;
      elements.spinButton.disabled = !canSpin;
  
      if (state.isSpinning) {
        elements.spinButton.textContent = "Running Inference...";
      } else if (state.tokens < CONFIG.spinCost) {
        elements.spinButton.textContent = "Insufficient Tokens";
      } else {
        elements.spinButton.textContent = `Run Inference (${CONFIG.spinCost} Tokens)`;
      }
    }
  
    function evaluateResult(symbols) {
      const [a, b, c] = symbols;
  
      if (a === b && b === c) {
        return {
          kind: "triple",
          symbol: a,
          payout: CONFIG.triplePayouts[a] ?? 0
        };
      }
  
      const counts = symbols.reduce((acc, symbol) => {
        acc[symbol] = (acc[symbol] || 0) + 1;
        return acc;
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
  
    function getOutcomeMessage(symbols, result, net) {
      const rolled = symbols.join(" ");
  
      if (result.kind === "triple") {
        if (result.payout > 0) {
          return {
            type: "win",
            log: `Inference complete. Triple ${result.symbol} detected.`,
            payout: `Payout +${formatNumber(result.payout)} tokens. Net ${formatSigned(net)}.`,
            rolled
          };
        }
  
        return {
          type: "loss",
          log: `Inference complete. Triple ${result.symbol} achieved catastrophic beauty.`,
          payout: `Payout +0 tokens. Net ${formatSigned(net)}.`,
          rolled
        };
      }
  
      if (result.kind === "pair") {
        return {
          type: "win",
          log: `Inference complete. Two ${result.symbol} symbols matched.`,
          payout: `Consolation payout +${formatNumber(result.payout)} tokens. Net ${formatSigned(net)}.`,
          rolled
        };
      }
  
      return {
        type: "loss",
        log: "Inference complete. No meaningful alignment detected.",
        payout: `Payout +0 tokens. Net ${formatSigned(net)}.`,
        rolled
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
      if (state.isSpinning || state.tokens < CONFIG.spinCost) {
        return;
      }
  
      state.isSpinning = true;
      state.spins += 1;
      state.tokens = clampNonNegative(state.tokens - CONFIG.spinCost);
      state.totalSpent += CONFIG.spinCost;
      state.lastPayout = 0;
      state.lastNet = -CONFIG.spinCost;
  
      updateStats();
      setLog("Inference started. Allocating questionable compute...");
      setPayoutMessage("neutral", `Spin cost applied: -${formatNumber(CONFIG.spinCost)} tokens.`);
      setRolledSymbols("Spinning...");
  
      const symbols = [randomSymbol(), randomSymbol(), randomSymbol()];
  
      await Promise.all(
        elements.reelElements.map((reelElement, index) =>
          animateReel(reelElement, symbols[index], index))
      );
  
      state.currentSymbols = symbols;
  
      const result = evaluateResult(symbols);
      const net = result.payout - CONFIG.spinCost;
  
      if (result.payout > 0) {
        state.tokens += result.payout;
        state.totalWon += result.payout;
        state.wins += 1;
        state.lastPayout = result.payout;
      } else {
        state.lastPayout = 0;
      }
  
      state.lastNet = net;
  
      const outcome = getOutcomeMessage(symbols, result, net);
  
      setLog(outcome.log);
      setPayoutMessage(outcome.type, outcome.payout);
      setRolledSymbols(`Rolled: ${outcome.rolled}`);
  
      if (state.tokens <= 0) {
        setLog("Funding depleted. Runtime terminated.");
        setPayoutMessage("loss", `${outcome.payout} Balance: 0.`);
      }
  
      state.isSpinning = false;
      updateStats();
    }
  
    function resetGame() {
      state.tokens = CONFIG.startingTokens;
      state.totalSpent = 0;
      state.totalWon = 0;
      state.spins = 0;
      state.wins = 0;
      state.isSpinning = false;
      state.lastPayout = null;
      state.lastNet = null;
      state.currentSymbols = ["🤖", "🤖", "🤖"];
  
      initializeReels();
      updateStats();
      setLog("System reset. Seed funding restored.");
      setPayoutMessage("neutral", "No inference run yet.");
      setRolledSymbols("—");
    }
  
    function bindEvents() {
      elements.spinButton.addEventListener("click", spin);
      elements.resetButton.addEventListener("click", resetGame);
  
      document.addEventListener("keydown", (event) => {
        if (event.code === "Space") {
          event.preventDefault();
          if (!elements.spinButton.disabled) {
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
      setLog("System initialized. Waiting for prompt...");
      setPayoutMessage("neutral", "No inference run yet.");
      setRolledSymbols("—");
    }
  
    init();
  })();