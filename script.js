/**
 * AetherDEX — Decentralized Token Exchange Front-End
 * Pure Vanilla JavaScript implementation with state persistence and simulation engine.
 */

// ==========================================================================
// 1. TOKEN DATABASE & CONFIGURATION
// ==========================================================================
const DEFAULT_TOKENS = {
  ETH: { symbol: "ETH", name: "Ethereum", price: 3500.00, balance: 1.2450, color: "#627EEA" },
  USDC: { symbol: "USDC", name: "USD Coin", price: 1.00, balance: 4500.00, color: "#2775CA" },
  USDT: { symbol: "USDT", name: "Tether USD", price: 1.00, balance: 2300.00, color: "#26A17B" },
  BTC: { symbol: "BTC", name: "Bitcoin (Wrapped)", price: 68400.00, balance: 0.0820, color: "#F7931A" },
  DAI: { symbol: "DAI", name: "Dai Stablecoin", price: 1.00, balance: 1200.00, color: "#F5AC37" },
  BNB: { symbol: "BNB", name: "BNB Chain", price: 580.00, balance: 4.5000, color: "#F3BA2F" },
  SOL: { symbol: "SOL", name: "Solana", price: 145.00, balance: 12.800, color: "#14F195" },
  MATIC: { symbol: "MATIC", name: "Polygon", price: 0.72, balance: 850.00, color: "#8247E5" },
  LINK: { symbol: "LINK", name: "Chainlink", price: 18.50, balance: 45.000, color: "#375BD2" },
  UNI: { symbol: "UNI", name: "Uniswap", price: 9.80, balance: 60.000, color: "#FF007A" },
  AAVE: { symbol: "AAVE", name: "Aave Token", price: 92.00, balance: 8.2000, color: "#B6509E" }
};

const STORAGE_KEY = "AETHER_DEX_STATE_V1";

// ==========================================================================
// 2. CENTRALIZED APPLICATION STATE
// ==========================================================================
let appState = {
  walletConnected: false,
  walletAddress: null,
  fromToken: "ETH",
  toToken: "USDC",
  fromAmount: "",
  toAmount: "",
  slippage: 0.5,
  deadline: 20,
  tokens: JSON.parse(JSON.stringify(DEFAULT_TOKENS)),
  history: []
};

// Target identifier for token modal picker
let activeTokenSelectorTarget = "from"; // 'from' | 'to'

// ==========================================================================
// 3. DOM ELEMENTS REFERENCE
// ==========================================================================
const elements = {
  // Navigation
  navBtns: document.querySelectorAll(".nav-btn, .mobile-nav-btn"),
  tabPanes: document.querySelectorAll(".tab-pane"),
  mobileMenuBtn: document.getElementById("mobileMenuBtn"),
  mobileNavDrawer: document.getElementById("mobileNavDrawer"),
  walletConnectBtn: document.getElementById("walletConnectBtn"),
  walletBtnText: document.getElementById("walletBtnText"),
  
  // Swap Inputs & Displays
  fromAmountInput: document.getElementById("fromAmountInput"),
  toAmountInput: document.getElementById("toAmountInput"),
  fromTokenSymbol: document.getElementById("fromTokenSymbol"),
  toTokenSymbol: document.getElementById("toTokenSymbol"),
  fromTokenIcon: document.getElementById("fromTokenIcon"),
  toTokenIcon: document.getElementById("toTokenIcon"),
  fromTokenBalance: document.getElementById("fromTokenBalance"),
  toTokenBalance: document.getElementById("toTokenBalance"),
  fromFiatValue: document.getElementById("fromFiatValue"),
  toFiatValue: document.getElementById("toFiatValue"),
  fromTokenSelectBtn: document.getElementById("fromTokenSelectBtn"),
  toTokenSelectBtn: document.getElementById("toTokenSelectBtn"),
  switchTokensBtn: document.getElementById("switchTokensBtn"),
  maxBtn: document.getElementById("maxBtn"),
  mainSwapActionBtn: document.getElementById("mainSwapActionBtn"),
  
  // Meta Details
  rateDisplay: document.getElementById("rateDisplay"),
  priceImpactDisplay: document.getElementById("priceImpactDisplay"),
  routeLiquidityDisplay: document.getElementById("routeLiquidityDisplay"),
  networkFeeDisplay: document.getElementById("networkFeeDisplay"),
  refreshRatesBtn: document.getElementById("refreshRatesBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  
  // Market & Portfolio & Liquidity
  marketList: document.getElementById("marketList"),
  portfolioTotalValue: document.getElementById("portfolioTotalValue"),
  portfolioTableBody: document.getElementById("portfolioTableBody"),
  historyListContainer: document.getElementById("historyListContainer"),
  resetBalancesBtn: document.getElementById("resetBalancesBtn"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  addLiquidityBtn: document.getElementById("addLiquidityBtn"),
  liqFirstAmount: document.getElementById("liqFirstAmount"),
  liqSecondAmount: document.getElementById("liqSecondAmount"),
  liqFirstBalance: document.getElementById("liqFirstBalance"),
  liqSecondBalance: document.getElementById("liqSecondBalance"),
  liqFirstIcon: document.getElementById("liqFirstIcon"),
  liqSecondIcon: document.getElementById("liqSecondIcon"),
  
  // Modals
  tokenModal: document.getElementById("tokenModal"),
  tokenSearchInput: document.getElementById("tokenSearchInput"),
  modalTokenList: document.getElementById("modalTokenList"),
  walletModal: document.getElementById("walletModal"),
  connectDemoWalletBtn: document.getElementById("connectDemoWalletBtn"),
  connectInjectedWalletBtn: document.getElementById("connectInjectedWalletBtn"),
  settingsModal: document.getElementById("settingsModal"),
  customSlippageInput: document.getElementById("customSlippageInput"),
  slippagePresets: document.querySelectorAll(".btn-preset"),
  slippageWarning: document.getElementById("slippageWarning"),
  deadlineInput: document.getElementById("deadlineInput"),
  
  // Confirmation Modal
  confirmModal: document.getElementById("confirmModal"),
  confirmPayAmount: document.getElementById("confirmPayAmount"),
  confirmPaySymbol: document.getElementById("confirmPaySymbol"),
  confirmReceiveAmount: document.getElementById("confirmReceiveAmount"),
  confirmReceiveSymbol: document.getElementById("confirmReceiveSymbol"),
  confirmRate: document.getElementById("confirmRate"),
  confirmSlippage: document.getElementById("confirmSlippage"),
  confirmMinReceived: document.getElementById("confirmMinReceived"),
  executeSwapBtn: document.getElementById("executeSwapBtn"),
  
  // Success Modal
  successModal: document.getElementById("successModal"),
  successSummaryText: document.getElementById("successSummaryText"),
  
  // Toast
  toastContainer: document.getElementById("toastContainer")
};

// ==========================================================================
// 4. STORAGE & INITIALIZATION
// ==========================================================================
function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      appState = { ...appState, ...parsed };
      if (!appState.tokens || typeof appState.tokens !== "object") {
        appState.tokens = JSON.parse(JSON.stringify(DEFAULT_TOKENS));
      }
      if (!Array.isArray(appState.history)) appState.history = [];
      if (!appState.tokens[appState.fromToken]) appState.fromToken = "ETH";
      if (!appState.tokens[appState.toToken]) appState.toToken = "USDC";
    }
  } catch (err) {
    console.warn("Storage parse error, resetting state:", err);
  }
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      walletConnected: appState.walletConnected,
      walletAddress: appState.walletAddress,
      fromToken: appState.fromToken,
      toToken: appState.toToken,
      slippage: appState.slippage,
      deadline: appState.deadline,
      tokens: appState.tokens,
      history: appState.history
    }));
  } catch (err) {
    console.error("Storage persistence error:", err);
  }
}

function initializeApp() {
  loadPersistedState();
  setupEventListeners();
  renderAll();
}

// ==========================================================================
// 5. EVENT LISTENERS
// ==========================================================================
function setupEventListeners() {
  // Tab Switching
  elements.navBtns.forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Mobile Drawer
  elements.mobileMenuBtn.addEventListener("click", () => {
    elements.mobileNavDrawer.classList.toggle("open");
  });

  // Wallet
  elements.walletConnectBtn.addEventListener("click", () => {
    if (appState.walletConnected) {
      disconnectWallet();
    } else {
      openModal("walletModal");
    }
  });

  elements.connectDemoWalletBtn.addEventListener("click", () => {
    connectWallet("0x71A8...9F21");
    closeModal("walletModal");
  });

  elements.connectInjectedWalletBtn.addEventListener("click", () => {
    // Graceful fallback simulation if no real provider exists
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_requestAccounts" })
        .then(accs => {
          if (accs.length > 0) {
            const shortAddr = accs[0].slice(0, 6) + "..." + accs[0].slice(-4);
            connectWallet(shortAddr);
            closeModal("walletModal");
          }
        })
        .catch(() => showToast("Injected wallet connection declined"));
    } else {
      connectWallet("0x3C44...B820");
      showToast("No Web3 Provider detected. Connected Demo Wallet.");
      closeModal("walletModal");
    }
  });

  // Token Modal Openers
  elements.fromTokenSelectBtn.addEventListener("click", () => {
    activeTokenSelectorTarget = "from";
    openTokenModal();
  });

  elements.toTokenSelectBtn.addEventListener("click", () => {
    activeTokenSelectorTarget = "to";
    openTokenModal();
  });

  // Token Search Input
  elements.tokenSearchInput.addEventListener("input", (e) => {
    renderTokenList(e.target.value);
  });

  // Amount Input Changes
  elements.fromAmountInput.addEventListener("input", handleAmountInputChange);

  // MAX Button
  elements.maxBtn.addEventListener("click", () => {
    if (!appState.walletConnected) {
      openModal("walletModal");
      return;
    }
    const currentBalance = appState.tokens[appState.fromToken].balance;
    elements.fromAmountInput.value = currentBalance;
    handleAmountInputChange();
  });

  // Switch Direction Button
  elements.switchTokensBtn.addEventListener("click", () => {
    const temp = appState.fromToken;
    appState.fromToken = appState.toToken;
    appState.toToken = temp;
    persistState();
    renderTokenSelections();
    handleAmountInputChange();
  });

  // Primary Action Button (Connect / Enter Amount / Swap)
  elements.mainSwapActionBtn.addEventListener("click", handleMainActionClick);

  // Settings
  elements.settingsBtn.addEventListener("click", () => openModal("settingsModal"));

  elements.slippagePresets.forEach(btn => {
    btn.addEventListener("click", () => {
      elements.slippagePresets.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      elements.customSlippageInput.value = "";
      appState.slippage = parseFloat(btn.dataset.slippage);
      elements.slippageWarning.hidden = true;
      persistState();
      renderSwapCalculations();
    });
  });

  elements.customSlippageInput.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0 && val <= 50) {
      elements.slippagePresets.forEach(b => b.classList.remove("active"));
      appState.slippage = val;
      elements.slippageWarning.hidden = val <= 5.0;
      persistState();
      renderSwapCalculations();
    }
  });

  elements.deadlineInput.addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      appState.deadline = val;
      persistState();
    }
  });

  // Refresh Rates Button
  elements.refreshRatesBtn.addEventListener("click", () => {
    showToast("Demo Market Rates refreshed");
    renderSwapCalculations();
  });

  // Confirmation & Execution
  elements.executeSwapBtn.addEventListener("click", executeDemoSwap);

  // Reset & Clear Controls
  elements.resetBalancesBtn.addEventListener("click", () => {
    appState.tokens = JSON.parse(JSON.stringify(DEFAULT_TOKENS));
    persistState();
    renderAll();
    showToast("Demo balances reset to initial values");
  });

  elements.clearHistoryBtn.addEventListener("click", () => {
    appState.history = [];
    persistState();
    renderHistory();
    showToast("Transaction history cleared");
  });

  // Liquidity Simulation Action
  elements.addLiquidityBtn.addEventListener("click", handleAddLiquidity);

  // Generic Modal Close Triggers
  document.querySelectorAll("[data-close]").forEach(el => {
    el.addEventListener("click", () => closeModal(el.dataset.close));
  });

  // Close modals on clicking backdrop
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal(backdrop.id);
    });
  });

  // Escape key closes modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-backdrop.active").forEach(m => closeModal(m.id));
    }
  });
}

// ==========================================================================
// 6. UI RENDERING & LOGIC
// ==========================================================================
function renderAll() {
  renderWalletState();
  renderTokenSelections();
  renderMarketOverview();
  renderPortfolio();
  renderHistory();
  renderLiquidityTab();
  renderSwapCalculations();
}

function switchTab(tabId) {
  elements.navBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  elements.tabPanes.forEach(pane => {
    pane.classList.toggle("active", pane.id === `tab-${tabId}`);
  });
  elements.mobileNavDrawer.classList.remove("open");
}

function renderWalletState() {
  if (appState.walletConnected) {
    elements.walletConnectBtn.classList.add("connected");
    elements.walletBtnText.textContent = appState.walletAddress;
  } else {
    elements.walletConnectBtn.classList.remove("connected");
    elements.walletBtnText.textContent = "Connect Wallet";
  }
  updateSwapButtonState();
}

function connectWallet(address) {
  appState.walletConnected = true;
  appState.walletAddress = address;
  persistState();
  renderWalletState();
  showToast("Demo Wallet Connected");
}

function disconnectWallet() {
  appState.walletConnected = false;
  appState.walletAddress = null;
  persistState();
  renderWalletState();
  showToast("Wallet Disconnected");
}

function renderTokenSelections() {
  const fromT = appState.tokens[appState.fromToken];
  const toT = appState.tokens[appState.toToken];

  elements.fromTokenSymbol.textContent = fromT.symbol;
  elements.toTokenSymbol.textContent = toT.symbol;

  applyTokenIcon(elements.fromTokenIcon, fromT);
  applyTokenIcon(elements.toTokenIcon, toT);

  elements.fromTokenBalance.textContent = formatCrypto(fromT.balance);
  elements.toTokenBalance.textContent = formatCrypto(toT.balance);

  renderRouteMeta();
}

function applyTokenIcon(container, token) {
  container.style.backgroundColor = token.color;
  container.textContent = token.symbol.slice(0, 1);
  container.style.color = "#FFFFFF";
}

function handleAmountInputChange() {
  const raw = elements.fromAmountInput.value;
  appState.fromAmount = raw;
  renderSwapCalculations();
}

function renderSwapCalculations() {
  const fromT = appState.tokens[appState.fromToken];
  const toT = appState.tokens[appState.toToken];
  const amount = parseFloat(elements.fromAmountInput.value);

  if (isNaN(amount) || amount <= 0) {
    elements.toAmountInput.value = "";
    elements.fromFiatValue.textContent = "~$0.00";
    elements.toFiatValue.textContent = "~$0.00";
    elements.priceImpactDisplay.textContent = "< 0.01%";
  } else {
    // Calculate output amount
    const exchangeRate = fromT.price / toT.price;
    const computedOutput = amount * exchangeRate;
    elements.toAmountInput.value = formatCrypto(computedOutput, 6);

    elements.fromFiatValue.textContent = `~$${formatFiat(amount * fromT.price)}`;
    elements.toFiatValue.textContent = `~$${formatFiat(computedOutput * toT.price)}`;

    // Simulated price impact based on trade size
    const tradeUsdValue = amount * fromT.price;
    let impact = (tradeUsdValue / 500000) * 100;
    impact = impact < 0.01 ? "< 0.01%" : `${impact.toFixed(2)}%`;
    elements.priceImpactDisplay.textContent = impact;
  }

  // Update Exchange Rate Text
  const unitRate = fromT.price / toT.price;
  elements.rateDisplay.textContent = `1 ${fromT.symbol} = ${formatCrypto(unitRate, 4)} ${toT.symbol}`;

  updateSwapButtonState();
}

function renderRouteMeta() {
  elements.routeLiquidityDisplay.textContent = `$24.8M (${appState.fromToken} → ${appState.toToken})`;
}

function updateSwapButtonState() {
  const btn = elements.mainSwapActionBtn;
  const fromT = appState.tokens[appState.fromToken];
  const amount = parseFloat(elements.fromAmountInput.value);

  if (!appState.walletConnected) {
    btn.textContent = "Connect Wallet";
    btn.disabled = false;
    return;
  }

  if (appState.fromToken === appState.toToken) {
    btn.textContent = "Select Different Tokens";
    btn.disabled = true;
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    btn.textContent = "Enter an Amount";
    btn.disabled = true;
    return;
  }

  if (amount > fromT.balance) {
    btn.textContent = `Insufficient ${fromT.symbol} Balance`;
    btn.disabled = true;
    return;
  }

  btn.textContent = "Swap";
  btn.disabled = false;
}

function handleMainActionClick() {
  if (!appState.walletConnected) {
    openModal("walletModal");
    return;
  }

  // Open Confirmation Modal
  const fromT = appState.tokens[appState.fromToken];
  const toT = appState.tokens[appState.toToken];
  const amount = parseFloat(elements.fromAmountInput.value);
  const outAmount = parseFloat(elements.toAmountInput.value);

  elements.confirmPayAmount.textContent = formatCrypto(amount);
  elements.confirmPaySymbol.textContent = fromT.symbol;
  elements.confirmReceiveAmount.textContent = formatCrypto(outAmount);
  elements.confirmReceiveSymbol.textContent = toT.symbol;
  elements.confirmRate.textContent = `1 ${fromT.symbol} = ${formatCrypto(fromT.price / toT.price, 4)} ${toT.symbol}`;
  elements.confirmSlippage.textContent = `${appState.slippage}%`;

  const minReceived = outAmount * (1 - appState.slippage / 100);
  elements.confirmMinReceived.textContent = `${formatCrypto(minReceived)} ${toT.symbol}`;

  openModal("confirmModal");
}

function executeDemoSwap() {
  const fromT = appState.tokens[appState.fromToken];
  const toT = appState.tokens[appState.toToken];
  const amount = parseFloat(elements.fromAmountInput.value);
  const outAmount = parseFloat(elements.toAmountInput.value);

  // Safety check
  if (amount > fromT.balance) {
    showToast("Error: Balance changed before execution");
    closeModal("confirmModal");
    return;
  }

  // Update Balances
  fromT.balance -= amount;
  toT.balance += outAmount;

  // Append to Transaction History
  appState.history.unshift({
    id: Date.now(),
    fromSymbol: fromT.symbol,
    toSymbol: toT.symbol,
    fromAmount: amount,
    toAmount: outAmount,
    timestamp: "Just now"
  });

  persistState();
  closeModal("confirmModal");

  // Show Success Modal
  elements.successSummaryText.textContent = `${formatCrypto(amount)} ${fromT.symbol} → ${formatCrypto(outAmount)} ${toT.symbol}`;
  openModal("successModal");

  // Reset inputs
  elements.fromAmountInput.value = "";
  renderAll();
  showToast("Demo Swap Executed Successfully");
}

// ==========================================================================
// 7. LIQUIDITY SIMULATION
// ==========================================================================
function renderLiquidityTab() {
  const ethToken = appState.tokens.ETH;
  const usdcToken = appState.tokens.USDC;

  elements.liqFirstBalance.textContent = `${formatCrypto(ethToken.balance)} ETH`;
  elements.liqSecondBalance.textContent = `${formatCrypto(usdcToken.balance)} USDC`;

  applyTokenIcon(elements.liqFirstIcon, ethToken);
  applyTokenIcon(elements.liqSecondIcon, usdcToken);
}

function handleAddLiquidity() {
  if (!appState.walletConnected) {
    openModal("walletModal");
    return;
  }

  const firstAmt = parseFloat(elements.liqFirstAmount.value);
  const secondAmt = parseFloat(elements.liqSecondAmount.value);

  if (isNaN(firstAmt) || isNaN(secondAmt) || firstAmt <= 0 || secondAmt <= 0) {
    showToast("Please enter valid liquidity amounts");
    return;
  }

  if (firstAmt > appState.tokens.ETH.balance || secondAmt > appState.tokens.USDC.balance) {
    showToast("Insufficient demo balance for pool supply");
    return;
  }

  appState.tokens.ETH.balance -= firstAmt;
  appState.tokens.USDC.balance -= secondAmt;

  appState.history.unshift({
    id: Date.now(),
    fromSymbol: "LP Supply",
    toSymbol: "ETH/USDC",
    fromAmount: firstAmt,
    toAmount: secondAmt,
    timestamp: "Just now"
  });

  elements.liqFirstAmount.value = "";
  elements.liqSecondAmount.value = "";

  persistState();
  renderAll();
  showToast("Supplied Demo Liquidity into Pool");
}

// ==========================================================================
// 8. MARKET, PORTFOLIO & HISTORY RENDERING
// ==========================================================================
function renderMarketOverview() {
  elements.marketList.innerHTML = "";
  Object.values(appState.tokens).slice(0, 6).forEach(token => {
    const item = document.createElement("div");
    item.className = "market-item";
    item.innerHTML = `
      <div class="market-item-left">
        <span class="token-icon" style="background-color:${token.color}">${token.symbol.slice(0,1)}</span>
        <div>
          <div class="market-item-symbol">${token.symbol}</div>
          <div class="market-item-name">${token.name}</div>
        </div>
      </div>
      <div class="market-item-right">
        <div class="market-item-price font-mono">$${formatFiat(token.price)}</div>
        <div class="market-item-change text-success">+1.85%</div>
      </div>
    `;
    item.addEventListener("click", () => {
      appState.fromToken = token.symbol;
      persistState();
      renderTokenSelections();
      handleAmountInputChange();
      switchTab("swap");
    });
    elements.marketList.appendChild(item);
  });
}

function renderPortfolio() {
  let totalNetWorth = 0;
  elements.portfolioTableBody.innerHTML = "";

  Object.values(appState.tokens).forEach(token => {
    const value = token.balance * token.price;
    totalNetWorth += value;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="token-item-info">
          <span class="token-icon" style="background-color:${token.color}">${token.symbol.slice(0,1)}</span>
          <div>
            <strong>${token.symbol}</strong>
            <div class="token-item-desc">${token.name}</div>
          </div>
        </div>
      </td>
      <td class="font-mono">$${formatFiat(token.price)}</td>
      <td class="font-mono">${formatCrypto(token.balance)}</td>
      <td class="font-mono text-right font-bold">$${formatFiat(value)}</td>
    `;
    elements.portfolioTableBody.appendChild(row);
  });

  elements.portfolioTotalValue.textContent = `$${formatFiat(totalNetWorth)}`;
}

function renderHistory() {
  elements.historyListContainer.innerHTML = "";
  if (appState.history.length === 0) {
    elements.historyListContainer.innerHTML = `<div class="empty-state">No simulated transactions yet.</div>`;
    return;
  }

  appState.history.forEach(tx => {
    const el = document.createElement("div");
    el.className = "history-item";
    el.innerHTML = `
      <div class="history-item-left">
        <span class="history-title">${tx.fromAmount} ${tx.fromSymbol} → ${tx.toAmount} ${tx.toSymbol}</span>
        <span class="history-time font-mono">${tx.timestamp}</span>
      </div>
      <span class="history-status-badge">Completed</span>
    `;
    elements.historyListContainer.appendChild(el);
  });
}

// ==========================================================================
// 9. TOKEN SELECTION MODAL
// ==========================================================================
function openTokenModal() {
  elements.tokenSearchInput.value = "";
  renderTokenList("");
  openModal("tokenModal");
  setTimeout(() => elements.tokenSearchInput.focus(), 50);
}

function renderTokenList(searchQuery) {
  elements.modalTokenList.innerHTML = "";
  const query = searchQuery.toLowerCase().trim();
  const tokenList = Object.values(appState.tokens).filter(t => 
    t.symbol.toLowerCase().includes(query) || t.name.toLowerCase().includes(query)
  );

  if (tokenList.length === 0) {
    elements.modalTokenList.innerHTML = `<div class="empty-state">No tokens found</div>`;
    return;
  }

  tokenList.forEach(token => {
    const item = document.createElement("div");
    item.className = "token-list-item";
    item.innerHTML = `
      <div class="token-item-info">
        <span class="token-icon" style="background-color:${token.color}">${token.symbol.slice(0,1)}</span>
        <div>
          <div class="token-item-name">${token.symbol}</div>
          <div class="token-item-desc">${token.name}</div>
        </div>
      </div>
      <div class="text-right font-mono">
        <div>${formatCrypto(token.balance)}</div>
        <div class="token-item-desc">~$${formatFiat(token.balance * token.price)}</div>
      </div>
    `;

    item.addEventListener("click", () => {
      if (activeTokenSelectorTarget === "from") {
        if (appState.toToken === token.symbol) {
          appState.toToken = appState.fromToken;
        }
        appState.fromToken = token.symbol;
      } else {
        if (appState.fromToken === token.symbol) {
          appState.fromToken = appState.toToken;
        }
        appState.toToken = token.symbol;
      }

      persistState();
      closeModal("tokenModal");
      renderTokenSelections();
      handleAmountInputChange();
    });

    elements.modalTokenList.appendChild(item);
  });
}

// ==========================================================================
// 10. MODAL & TOAST HELPERS
// ==========================================================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(30px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==========================================================================
// 11. NUMBER FORMATTING UTILITIES
// ==========================================================================
function formatCrypto(val, maxDecimals = 4) {
  const num = Number(val);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals
  });
}

function formatFiat(val) {
  const num = Number(val);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Initialize Application on Page Load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}