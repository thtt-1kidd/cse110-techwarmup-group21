(() => {
    "use strict";
  
    const CONFIG = {
      startingTokens: 1000,
      spinCost: 50,
      reelItemHeight: 84,
      spinDurationBase: 900,
      symbols: [
        "HALLUCINATION",
        "INFERENCE",
        "TOKENS",
        "BIAS",
        "HYPE",
        "PROMPT"
      ],
      payouts: {
        TOKENS: 500,
        PROMPT: 200,
        HYPE: 150,
        INFERENCE: 100
      },
      twoMatchPayout: 25,
      visibleCopiesPerReel: 4
    };
  
    const state = {
      tokens: CONFIG.startingTokens,
      totalSpent: 0,
      totalWon: 0,
      spins: 0,
      wins: 0,
      isSpinning: false,
      lastNet: null,
      currentSymbols: ["HALLUCINATION", "INFERENCE", "TOKENS"]
    };
  
    const elements = {
      tokenDisplay: document.getElementById("tokenDisplay"),
      totalSpentDisplay: document.getElementById("totalSpentDisplay"),
      totalWonDisplay: document.getElementById("totalWonDisplay"),
      winRateDisplay: document.getElementById("winRateDisplay"),
      spinCostDisplay: document.getElementById("spinCostDisplay"),
      lastNetDisplay: document.getElementById("lastNetDisplay"),
      statusDisplay: document.getElementById("statusDisplay"),
      spinButton: document.getElementById("spinButton"),
      resetButton: document.getElementById("resetButton"),
      resultPanel: document.getElementById("resultPanel"),
      resultMessage: document.getElementById("resultMessage"),
      resultPayout: document.getElementById("resultPayout"),
      resultSymbols: document.getElementById("resultSymbols"),
      reel1: document.getElementById("reel1"),
      reel2: document.getElementById("reel2"),
      reel3: document.getElementById("reel3")
    };
  
    const reelElements = [elements.reel1, elements.reel2, elements.reel3];
  
    function formatNumber(value) {
      return new Intl.NumberFormat("en-US").format(value);
    }
  
    function formatSigned(value) {
      if (value === 0) {
        return "0 tokens";
      }
  
      const sign = value > 0 ? "+" : "-";
      return `${sign}${formatNumber(Math.abs(value))} tokens`;
    }
  
    function clampNonNegative(value) {
      return Math.max(0, value);
    }
  
    function randomInt(max) {
      return Math.floor(Math.random() * max);
    }
  
    function getRandomSymbol() {
      return CONFIG.symbols[randomInt(CONFIG.symbols.length)];
    }
  
    function buildReelMarkup(targetSymbol) {
      const sequence = [];
  
      for (let copy = 0; copy < CONFIG.visibleCopiesPerReel; copy += 1) {
        for (const symbol of CONFIG.symbols) {
          sequence.push(symbol);
        }
      }
  
      sequence.push(targetSymbol);
  
      return sequence
        .map((symbol, index) => {
          const isFinal = index === sequence.length - 1;
          const activeClass = isFinal ? " active" : "";
          return `<div class="reel-item${activeClass}" data-symbol="${symbol}">${symbol}</div>`;
        })
        .join("");
    }
  
    function setReelToSymbol(reelElement, symbol) {
      reelElement.style.transition = "none";
      reelElement.innerHTML = `<div class="reel-item active" data-symbol="${symbol}">${symbol}</div>`;
      reelElement.style.transform = "translateY(0)";
      reelElement.offsetHeight; // force reflow
      reelElement.style.transition = "";
    }
  
    function initializeReels() {
      state.currentSymbols.forEach((symbol, index) => {
        setReelToSymbol(reelElements[index], symbol);
      });
    }
  
    function updateStats() {
      elements.tokenDisplay.textContent = formatNumber(state.tokens);
      elements.totalSpentDisplay.textContent = formatNumber(state.totalSpent);
      elements.totalWonDisplay.textContent = formatNumber(state.totalWon);
  
      const winRate = state.spins === 0
        ? 0
        : Math.round((state.wins / state.spins) * 100);
  
      elements.winRateDisplay.textContent = `${winRate}%`;
      elements.spinCostDisplay.textContent = `${CONFIG.spinCost} tokens`;
  
      if (state.lastNet === null) {
        elements.lastNetDisplay.textContent = "—";
        elements.lastNetDisplay.className = "bet-value neutral";
      } else {
        elements.lastNetDisplay.textContent = formatSigned(state.lastNet);
        elements.lastNetDisplay.className = `bet-value ${state.lastNet > 0 ? "positive" : state.lastNet < 0 ? "negative" : "neutral"}`;
      }
  
      const canAffordSpin = state.tokens >= CONFIG.spinCost && !state.isSpinning;
      elements.spinButton.disabled = !canAffordSpin;
      elements.spinButton.textContent = canAffordSpin
        ? `Spin for ${CONFIG.spinCost} tokens`
        : state.isSpinning
          ? "Spinning..."
          : "Not enough tokens to spin";
    }
  
    function setStatus(message) {
      elements.statusDisplay.textContent = message;
    }
  
    function updateResultPanel(type, message, payoutText, symbolsText) {
      elements.resultPanel.classList.remove("neutral", "win", "loss", "flash-win", "flash-loss");
      elements.resultPanel.classList.add(type);
  
      elements.resultMessage.textContent = message;
      elements.resultPayout.textContent = payoutText;
      elements.resultSymbols.textContent = symbolsText;
  
      // restart flash animation
      void elements.resultPanel.offsetWidth;
  
      if (type === "win") {
        elements.resultPanel.classList.add("flash-win");
      } else if (type === "loss") {
        elements.resultPanel.classList.add("flash-loss");
      }
    }
  
    function getPayout(symbols) {
      const [a, b, c] = symbols;
      const isTriple = a === b && b === c;
  
      if (isTriple) {
        return {
          amount: CONFIG.payouts[a] || 0,
          kind: "triple",
          symbol: a
        };
      }
  
      const counts = symbols.reduce((map, symbol) => {
        map[symbol] = (map[symbol] || 0) + 1;
        return map;
      }, {});
  
      const hasPair = Object.values(counts).some((count) => count >= 2);
  
      if (hasPair) {
        return {
          amount: CONFIG.twoMatchPayout,
          kind: "pair",
          symbol: Object.keys(counts).find((symbol) => counts[symbol] >= 2) || null
        };
      }
  
      return {
        amount: 0,
        kind: "none",
        symbol: null
      };
    }
  
    function getResultMessage(symbols, payout, net) {
      const label = symbols.join(" • ");
  
      if (payout.kind === "triple" && payout.amount > 0) {
        return {
          type: "win",
          message: `Jackpot-ish: ${label}. The house blinked first.`,
          payoutText: `Payout: +${formatNumber(payout.amount)} tokens · Net: ${formatSigned(net)}`,
          symbolsText: label
        };
      }
  
      if (payout.kind === "triple" && payout.amount === 0) {
        return {
          type: net >= 0 ? "neutral" : "loss",
          message: `Three ${payout.symbol}s. Inspirational, but not profitable.`,
          payoutText: `Payout: +0 tokens · Net: ${formatSigned(net)}`,
          symbolsText: label
        };
      }
  
      if (payout.kind === "pair") {
        return {
          type: "win",
          message: `Two ${payout.symbol}s. The machine offers a tiny mercy.`,
          payoutText: `Payout: +${formatNumber(payout.amount)} tokens · Net: ${formatSigned(net)}`,
          symbolsText: label
        };
      }
  
      return {
        type: "loss",
        message: "No match. Your budget has been successfully optimized away.",
        payoutText: `Payout: +0 tokens · Net: ${formatSigned(net)}`,
        symbolsText: label
      };
    }
  
    function animateReel(reelElement, targetSymbol, reelIndex) {
      return new Promise((resolve) => {
        reelElement.innerHTML = buildReelMarkup(targetSymbol);
        reelElement.style.transition = "none";
        reelElement.style.transform = "translateY(0)";
        reelElement.offsetHeight; // force reflow
  
        const finalIndex = (CONFIG.visibleCopiesPerReel * CONFIG.symbols.length);
        const finalOffset = -(finalIndex * CONFIG.reelItemHeight);
        const duration = CONFIG.spinDurationBase + reelIndex * 250;
  
        reelElement.style.transition = `transform ${duration}ms cubic-bezier(0.16, 0.84, 0.24, 1)`;
        reelElement.style.transform = `translateY(${finalOffset}px)`;
  
        window.setTimeout(() => {
          setReelToSymbol(reelElement, targetSymbol);
          resolve();
        }, duration + 30);
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
      state.lastNet = -CONFIG.spinCost;
  
      updateStats();
      setStatus("Spinning...");
      updateResultPanel(
        "neutral",
        "Reels spinning. Please blame latency.",
        `Spin cost: -${formatNumber(CONFIG.spinCost)} tokens`,
        "…"
      );
  
      const resultSymbols = [
        getRandomSymbol(),
        getRandomSymbol(),
        getRandomSymbol()
      ];
  
      await Promise.all(
        reelElements.map((reelElement, index) =>
          animateReel(reelElement, resultSymbols[index], index))
      );
  
      state.currentSymbols = resultSymbols;
  
      const payout = getPayout(resultSymbols);
      const net = payout.amount - CONFIG.spinCost;
  
      if (payout.amount > 0) {
        state.tokens += payout.amount;
        state.totalWon += payout.amount;
        state.wins += 1;
      }
  
      state.lastNet = net;
  
      const result = getResultMessage(resultSymbols, payout, net);
  
      if (state.tokens <= 0) {
        setStatus("Game over");
        updateResultPanel(
          state.wins > 0 ? "loss" : result.type,
          "You are out of tokens. The disruption is complete.",
          `${result.payoutText} · Balance: 0`,
          result.symbolsText
        );
      } else {
        setStatus(result.type === "win" ? "You won this spin" : "Ready to spin again");
        updateResultPanel(result.type, result.message, result.payoutText, result.symbolsText);
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
      state.lastNet = null;
      state.currentSymbols = ["HALLUCINATION", "INFERENCE", "TOKENS"];
  
      initializeReels();
      updateStats();
      setStatus("Ready to spin");
      updateResultPanel(
        "neutral",
        "Game reset. Fresh budget, same reckless energy.",
        "No spin yet",
        "—"
      );
    }
  
    function attachEvents() {
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
      attachEvents();
      updateStats();
      setStatus("Ready to spin");
      updateResultPanel(
        "neutral",
        "Pull the lever and hope the model respects your budget.",
        "No spin yet",
        "—"
      );
    }
  
    init();
  })();