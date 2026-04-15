(() => {
    "use strict";
  
    const CONFIG = {
      startingTokens: 1000,
      spinCost: 100,
      symbols: [
        "Hallucination",
        "Inference Cost",
        "Token Limit",
        "Training Data",
        "Model Collapse",
        "Prompt Injection",
        "Marketing Hype",
        "Context Window"
      ],
      triplePayouts: {
        "Hallucination": 250,
        "Inference Cost": 500,
        "Token Limit": 180,
        "Training Data": 120,
        "Model Collapse": 0,
        "Prompt Injection": 140,
        "Marketing Hype": 150,
        "Context Window": 100
      },
      pairPayout: 40,
      reelItemHeight: 88,
      reelCopies: 4,
      spinDurationBase: 950
    };
  
    const state = {
      tokens: CONFIG.startingTokens,
      totalSpent: 0,
      totalWon: 0,
      spins: 0,
      wins: 0,
      isSpinning: false,
      lastWin: null,
      lastNet: null,
      currentSymbols: ["Hallucination", "Inference Cost", "Token Limit"]
    };
  
    const elements = {
      tokenDisplay: document.getElementById("tokenDisplay"),
      spinCostDisplay: document.getElementById("spinCostDisplay"),
      lastWinDisplay: document.getElementById("lastWinDisplay"),
      lastNetDisplay: document.getElementById("lastNetDisplay"),
      statusDisplay: document.getElementById("statusDisplay"),
      totalSpentDisplay: document.getElementById("totalSpentDisplay"),
      totalWonDisplay: document.getElementById("totalWonDisplay"),
      winRateDisplay: document.getElementById("winRateDisplay"),
      spinBtn: document.getElementById("spinBtn"),
      resetBtn: document.getElementById("resetBtn"),
      resultsPanel: document.getElementById("resultsPanel"),
      resultMessage: document.getElementById("resultMessage"),
      resultDetails: document.getElementById("resultDetails"),
      resultSymbols: document.getElementById("resultSymbols"),
      reels: [
        document.getElementById("reel1"),
        document.getElementById("reel2"),
        document.getElementById("reel3")
      ]
    };
  
    function formatNumber(value) {
      return new Intl.NumberFormat("en-US").format(value);
    }
  
    function formatSignedTokens(value) {
      if (value === 0) return "0 tokens";
      return `${value > 0 ? "+" : "-"}${formatNumber(Math.abs(value))} tokens`;
    }
  
    function randomSymbol() {
      const index = Math.floor(Math.random() * CONFIG.symbols.length);
      return CONFIG.symbols[index];
    }
  
    function clampToZero(value) {
      return Math.max(0, value);
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
          const isTarget = index === sequence.length - 1;
          return `<div class="symbol${isTarget ? " active" : ""}" data-symbol="${symbol}">${symbol}</div>`;
        })
        .join("");
    }
  
    function setReelToSymbol(reelElement, symbol) {
      reelElement.style.transition = "none";
      reelElement.innerHTML = `<div class="symbol active" data-symbol="${symbol}">${symbol}</div>`;
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
      elements.tokenDisplay.textContent = formatNumber(state.tokens);
      elements.spinCostDisplay.textContent = formatNumber(CONFIG.spinCost);
      elements.totalSpentDisplay.textContent = formatNumber(state.totalSpent);
      elements.totalWonDisplay.textContent = formatNumber(state.totalWon);
  
      const winRate = state.spins === 0
        ? 0
        : Math.round((state.wins / state.spins) * 100);
  
      elements.winRateDisplay.textContent = `${winRate}%`;
  
      if (state.lastWin === null) {
        elements.lastWinDisplay.textContent = "—";
      } else {
        elements.lastWinDisplay.textContent = `${formatNumber(state.lastWin)} tokens`;
      }
  
      if (state.lastNet === null) {
        elements.lastNetDisplay.textContent = "—";
        elements.lastNetDisplay.className = "stat-value neutral";
      } else {
        elements.lastNetDisplay.textContent = formatSignedTokens(state.lastNet);
        elements.lastNetDisplay.className = `stat-value ${state.lastNet > 0 ? "positive" : state.lastNet < 0 ? "negative" : "neutral"}`;
      }
  
      const canSpin = state.tokens >= CONFIG.spinCost && !state.isSpinning;
      elements.spinBtn.disabled = !canSpin;
  
      if (state.isSpinning) {
        elements.spinBtn.textContent = "SPINNING...";
      } else if (state.tokens < CONFIG.spinCost) {
        elements.spinBtn.textContent = "NOT ENOUGH TOKENS";
      } else {
        elements.spinBtn.textContent = `SPIN FOR ${CONFIG.spinCost} TOKENS ✨`;
      }
    }
  
    function setStatus(text) {
      elements.statusDisplay.textContent = text;
    }
  
    function updateResultPanel(type, message, details, symbolsText) {
      elements.resultsPanel.classList.remove("neutral", "win", "loss", "flash-win", "flash-loss");
      elements.resultsPanel.classList.add(type);
  
      elements.resultMessage.textContent = message;
      elements.resultDetails.textContent = details;
      elements.resultSymbols.textContent = symbolsText;
  
      void elements.resultsPanel.offsetWidth;
  
      if (type === "win") {
        elements.resultsPanel.classList.add("flash-win");
      }
  
      if (type === "loss") {
        elements.resultsPanel.classList.add("flash-loss");
      }
    }
  
    function evaluateSpin(symbols) {
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
  
    function describeOutcome(symbols, result, net) {
      const rolled = symbols.join(" • ");
  
      if (result.kind === "triple") {
        if (result.payout > 0) {
          return {
            panelType: "win",
            message: `Triple ${result.symbol}. Suspiciously fortunate.`,
            details: `Payout: +${formatNumber(result.payout)} tokens · Net: ${formatSignedTokens(net)}`,
            symbols: rolled
          };
        }
  
        return {
          panelType: "loss",
          message: `Triple ${result.symbol}. The machine respects the bit.`,
          details: `Payout: +0 tokens · Net: ${formatSignedTokens(net)}`,
          symbols: rolled
        };
      }
  
      if (result.kind === "pair") {
        return {
          panelType: "win",
          message: `Two ${result.symbol}s. A tiny reward for your optimism.`,
          details: `Payout: +${formatNumber(result.payout)} tokens · Net: ${formatSignedTokens(net)}`,
          symbols: rolled
        };
      }
  
      return {
        panelType: "loss",
        message: "No match. Your tokens have been converted into confidence.",
        details: `Payout: +0 tokens · Net: ${formatSignedTokens(net)}`,
        symbols: rolled
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
      state.tokens = clampToZero(state.tokens - CONFIG.spinCost);
      state.totalSpent += CONFIG.spinCost;
      state.lastWin = 0;
      state.lastNet = -CONFIG.spinCost;
  
      updateStats();
      setStatus("Spinning...");
      updateResultPanel(
        "neutral",
        "Reels spinning. Please hold while we monetize uncertainty.",
        `Spin cost: -${formatNumber(CONFIG.spinCost)} tokens`,
        "…"
      );
  
      const symbols = [randomSymbol(), randomSymbol(), randomSymbol()];
  
      await Promise.all(
        elements.reels.map((reel, index) => animateReel(reel, symbols[index], index))
      );
  
      state.currentSymbols = symbols;
  
      const result = evaluateSpin(symbols);
      const net = result.payout - CONFIG.spinCost;
  
      if (result.payout > 0) {
        state.tokens += result.payout;
        state.totalWon += result.payout;
        state.wins += 1;
        state.lastWin = result.payout;
      } else {
        state.lastWin = 0;
      }
  
      state.lastNet = net;
  
      const outcome = describeOutcome(symbols, result, net);
  
      if (state.tokens <= 0) {
        setStatus("Game over");
        updateResultPanel(
          "loss",
          "You are out of tokens. The casino has achieved alignment.",
          `${outcome.details} · Balance: 0`,
          outcome.symbols
        );
      } else {
        setStatus(outcome.panelType === "win" ? "Spin complete: payout awarded" : "Ready to spin");
        updateResultPanel(outcome.panelType, outcome.message, outcome.details, outcome.symbols);
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
      state.lastWin = null;
      state.lastNet = null;
      state.currentSymbols = ["Hallucination", "Inference Cost", "Token Limit"];
  
      initializeReels();
      updateStats();
      setStatus("Ready to spin");
      updateResultPanel(
        "neutral",
        "Game reset. Fresh tokens, same questionable incentives.",
        "No spin yet",
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
      setStatus("Ready to spin");
      updateResultPanel(
        "neutral",
        "Pull the lever and let the market decide your fate.",
        "No spin yet",
        "—"
      );
    }
  
    init();
  })();