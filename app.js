/**
 * AURO GOLD - Client App Controller & Simulation Engine
 */
(function () {
  'use strict';

  // State
  const state = {
    currentScreen: 'home',
    liveRate: 7248.50, // Rs per gram 24K 99.9%
    userGrams: 12.4580,
    buyMode: 'rupees', // 'rupees' | 'grams'
    buyAmount: 1000,
    sellGrams: 1.0000,
    otpCode: '7248',
    enteredDigits: [],
    timerSeconds: 285 // 4:45
  };

  // Products Database
  const products = {
    coin: {
      title: 'Auro 24K Lakshmi Gold Coin',
      price: '₹7,850',
      weight: '1.000 Grams',
      icon: '<i class="fa-solid fa-coins"></i>',
      purity: '24 Karat (999.9 Fine Gold)'
    },
    necklace: {
      title: 'Heritage Filigree Gold Choker',
      price: '₹1,12,400',
      weight: '15.50 Grams',
      icon: '<i class="fa-solid fa-gem"></i>',
      purity: '22 Karat (916 BIS Hallmarked)'
    },
    bangle: {
      title: 'Royal Peacock Gold Kada (Pair)',
      price: '₹1,74,200',
      weight: '24.00 Grams',
      icon: '<i class="fa-solid fa-circle-notch"></i>',
      purity: '22 Karat (916 BIS Hallmarked)'
    },
    coin5: {
      title: 'Auro 5g 24K Minted Bar',
      price: '₹37,900',
      weight: '5.000 Grams',
      icon: '<i class="fa-solid fa-crown"></i>',
      purity: '24 Karat (999.9 Fine Gold)'
    }
  };

  // Screen Navigation
  function navigate(screenId) {
    const screens = document.querySelectorAll('.screen');
    let target = document.getElementById(`screen-${screenId}`);

    if (!target) {
      console.warn(`Screen ${screenId} not found, defaulting to home`);
      target = document.getElementById('screen-home');
      screenId = 'home';
    }

    screens.forEach(s => s.classList.remove('active'));
    target.classList.add('active');
    state.currentScreen = screenId;

    // Scroll top of screen body
    const body = target.querySelector('.scroll-body') || target;
    if (body.scrollTop) body.scrollTop = 0;

    // Update bottom nav highlights if present
    document.querySelectorAll('.app-bottom-nav .nav-item').forEach(item => {
      item.classList.remove('active');
    });

    if (screenId === 'home') {
      const homeBtn = document.querySelector('.app-bottom-nav .nav-item:first-child');
      if (homeBtn) homeBtn.classList.add('active');
    } else if (screenId === 'portfolio') {
      const portBtn = document.querySelectorAll('.app-bottom-nav .nav-item')[1];
      if (portBtn) portBtn.classList.add('active');
    } else if (screenId === 'buyGold') {
      const buyBtn = document.querySelector('.buy-center-btn');
      if (buyBtn) buyBtn.classList.add('active');
    } else if (screenId === 'sipLanding') {
      const sipBtn = document.querySelectorAll('.app-bottom-nav .nav-item')[3];
      if (sipBtn) sipBtn.classList.add('active');
    } else if (screenId === 'profile') {
      const profBtn = document.querySelectorAll('.app-bottom-nav .nav-item')[4];
      if (profBtn) profBtn.classList.add('active');
    }

    // Update navigator active chips
    document.querySelectorAll('.screen-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-screen') === screenId);
    });

    // Close navigator drawer on mobile/click
    document.getElementById('flowDrawer')?.classList.remove('open');
  }

  // Buy Mode Toggle
  function setBuyMode(mode) {
    state.buyMode = mode;
    const tabRupees = document.getElementById('tabInRupees');
    const tabGrams = document.getElementById('tabInGrams');
    const prefix = document.getElementById('buyPrefix');
    const input = document.getElementById('buyAmountInput');

    if (mode === 'rupees') {
      tabRupees?.classList.add('active');
      tabGrams?.classList.remove('active');
      if (prefix) prefix.innerText = '₹';
      if (input) {
        input.value = 1000;
        input.step = 100;
      }
    } else {
      tabGrams?.classList.add('active');
      tabRupees?.classList.remove('active');
      if (prefix) prefix.innerText = 'g';
      if (input) {
        input.value = 0.5;
        input.step = 0.1;
      }
    }
    calcBuyEquiv();
  }

  // Set preset buy amount
  function setBuyAmount(val) {
    const input = document.getElementById('buyAmountInput');
    if (input) {
      input.value = val;
      state.buyAmount = val;
      calcBuyEquiv();
    }
    document.querySelectorAll('#quickAmountChips .chip').forEach(c => {
      c.classList.toggle('active', c.innerText.includes(val.toLocaleString()));
    });
  }

  // Calculate buy equivalent
  function calcBuyEquiv() {
    const input = document.getElementById('buyAmountInput');
    const equivLabel = document.getElementById('buyEquivLabel');
    const goldValEl = document.getElementById('calcGoldValue');
    const gstEl = document.getElementById('calcGst');
    const totalEl = document.getElementById('calcTotalPayable');
    const btnPay = document.getElementById('btnPayAmount');
    const reviewGrams = document.getElementById('reviewGrams');
    const reviewTotal = document.getElementById('reviewTotal');

    if (!input) return;
    const val = parseFloat(input.value) || 0;

    let grams = 0;
    let totalPay = 0;
    let netGoldVal = 0;
    let gst = 0;

    if (state.buyMode === 'rupees') {
      totalPay = val;
      netGoldVal = totalPay / 1.03;
      gst = totalPay - netGoldVal;
      grams = netGoldVal / state.liveRate;
      if (equivLabel) {
        equivLabel.innerHTML = `You will receive approx <strong>${grams.toFixed(4)} grams</strong> of 24K Gold`;
      }
    } else {
      grams = val;
      netGoldVal = grams * state.liveRate;
      gst = netGoldVal * 0.03;
      totalPay = netGoldVal + gst;
      if (equivLabel) {
        equivLabel.innerHTML = `Total cost for ${grams.toFixed(4)} gms is approx <strong>₹${totalPay.toFixed(2)}</strong>`;
      }
    }

    if (goldValEl) goldValEl.innerText = `₹${netGoldVal.toFixed(2)}`;
    if (gstEl) gstEl.innerText = `₹${gst.toFixed(2)}`;
    if (totalEl) totalEl.innerText = `₹${totalPay.toFixed(2)}`;
    if (btnPay) btnPay.innerText = `₹${Math.round(totalPay).toLocaleString()}`;
    if (reviewGrams) reviewGrams.innerText = grams.toFixed(4);
    if (reviewTotal) reviewTotal.innerText = `₹${totalPay.toFixed(2)}`;
  }

  // Complete purchase simulation
  function completePurchase() {
    const input = document.getElementById('buyAmountInput');
    const val = parseFloat(input?.value) || 1000;
    const addedGrams = (val / 1.03) / state.liveRate;

    state.userGrams += addedGrams;
    updateUserBalance();
    navigate('buySuccess');
  }

  // Set sell grams
  function setSellGrams(g) {
    const input = document.getElementById('sellGramsInput');
    if (input) {
      input.value = g;
      calcSellPayout();
    }
  }

  // Calc sell payout
  function calcSellPayout() {
    const input = document.getElementById('sellGramsInput');
    const grossEl = document.getElementById('sellGrossValue');
    const payoutEl = document.getElementById('sellPayoutAmount');
    if (!input) return;

    const g = parseFloat(input.value) || 0;
    const sellRate = 7210.00; // slightly lower than buy rate
    const payout = g * sellRate;

    if (grossEl) grossEl.innerText = `₹${payout.toFixed(2)}`;
    if (payoutEl) payoutEl.innerText = `₹${payout.toFixed(2)}`;
  }

  // Execute sell
  function executeSell() {
    const input = document.getElementById('sellGramsInput');
    const g = parseFloat(input?.value) || 0;
    if (g > state.userGrams) {
      alert('Cannot sell more gold than available in vault.');
      return;
    }
    state.userGrams -= g;
    updateUserBalance();
    alert(`Sold ${g.toFixed(4)} gms of gold successfully. ₹${(g * 7210).toFixed(2)} credited to your HDFC bank account!`);
    navigate('portfolio');
  }

  // Update user balance UI
  function updateUserBalance() {
    const gramsEl = document.getElementById('userGramsTotal');
    const valEl = document.getElementById('userCurrentValue');
    const vaultGrams = document.getElementById('vaultGramsDisplay');
    const sellAvailGrams = document.getElementById('sellAvailableGrams');
    const sellAvailVal = document.getElementById('sellAvailableValue');

    const totalVal = state.userGrams * state.liveRate;

    if (gramsEl) gramsEl.innerText = state.userGrams.toFixed(4);
    if (valEl) valEl.innerText = totalVal.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    if (vaultGrams) vaultGrams.innerText = state.userGrams.toFixed(4);
    if (sellAvailGrams) sellAvailGrams.innerText = state.userGrams.toFixed(4);
    if (sellAvailVal) sellAvailVal.innerText = Math.round(totalVal).toLocaleString('en-IN');
  }

  // SIP Calculator
  function calcSip() {
    const input = document.getElementById('sipAmountInput');
    const amt = parseFloat(input?.value) || 200;
    const mandateAmt = document.getElementById('mandateAmount');
    if (mandateAmt) mandateAmt.innerText = `₹${amt} / day`;
  }

  function confirmSip() {
    navigate('sipSuccess');
  }

  // Open Product Detail
  function openProduct(key) {
    const p = products[key];
    if (!p) return;

    const iconEl = document.getElementById('detailIcon');
    const titleEl = document.getElementById('detailTitle');
    const priceEl = document.getElementById('detailPrice');
    const weightEl = document.getElementById('detailWeight');

    if (iconEl) iconEl.innerHTML = p.icon;
    if (titleEl) titleEl.innerText = p.title;
    if (priceEl) priceEl.innerText = p.price;
    if (weightEl) weightEl.innerText = p.weight;

    navigate('productDetail');
  }

  // Keypad simulation for OTP
  function keyPress(num) {
    const inputs = document.querySelectorAll('.otp-digit');
    for (let i = 0; i < inputs.length; i++) {
      if (!inputs[i].value) {
        inputs[i].value = num;
        break;
      }
    }
  }

  function keyBackspace() {
    const inputs = document.querySelectorAll('.otp-digit');
    for (let i = inputs.length - 1; i >= 0; i--) {
      if (inputs[i].value) {
        inputs[i].value = '';
        break;
      }
    }
  }

  function submitPhone() {
    const phone = document.getElementById('loginPhoneInput')?.value || '9876543210';
    const otpDisplay = document.getElementById('otpDisplayPhone');
    if (otpDisplay) otpDisplay.innerText = `+91 ${phone}`;
    navigate('otp');
  }

  function verifyOtp() {
    navigate('home');
  }

  // Real-time Clock in Status Bar
  function startClock() {
    function tick() {
      const now = new Date();
      let hours = now.getHours();
      let mins = now.getMinutes();
      hours = hours < 10 ? '0' + hours : hours;
      mins = mins < 10 ? '0' + mins : mins;
      const el = document.getElementById('statusTime');
      if (el) el.innerText = `${hours}:${mins}`;
    }
    tick();
    setInterval(tick, 1000);
  }

  // Price Lock Countdown
  function startPriceTimer() {
    const timerEl = document.getElementById('priceLockTimer');
    setInterval(() => {
      if (state.timerSeconds > 0) {
        state.timerSeconds--;
        const mins = Math.floor(state.timerSeconds / 60);
        const secs = state.timerSeconds % 60;
        if (timerEl) {
          timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
      } else {
        state.timerSeconds = 300; // reset
        refreshPrice();
      }
    }, 1000);
  }

  // Slight Live Ticker Fluctuations
  function refreshPrice() {
    const delta = (Math.random() - 0.45) * 4; // slight upward bias
    state.liveRate = +(state.liveRate + delta).toFixed(2);

    const hdrRate = document.getElementById('headerLiveRate');
    const homeRate = document.getElementById('homeGoldRate');
    const buyRate = document.getElementById('buyScreenRate');

    if (hdrRate) hdrRate.innerText = state.liveRate.toFixed(2);
    if (homeRate) homeRate.innerText = state.liveRate.toFixed(2);
    if (buyRate) buyRate.innerText = state.liveRate.toFixed(2);

    updateUserBalance();
    calcBuyEquiv();
  }

  // Init Event Listeners
  function initListeners() {
    // Flow Navigator Drawer toggle
    const btnQuickFlows = document.getElementById('btnQuickFlows');
    const closeDrawer = document.getElementById('closeDrawer');
    const flowDrawer = document.getElementById('flowDrawer');

    btnQuickFlows?.addEventListener('click', () => {
      flowDrawer?.classList.toggle('open');
    });

    closeDrawer?.addEventListener('click', () => {
      flowDrawer?.classList.remove('open');
    });

    // Screen Chips click
    document.querySelectorAll('.screen-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const s = chip.getAttribute('data-screen');
        if (s) navigate(s);
      });
    });

    // View Toggles (App Frame vs Full Web)
    const btnPhoneView = document.getElementById('btnPhoneView');
    const btnExpandedView = document.getElementById('btnExpandedView');

    btnPhoneView?.addEventListener('click', () => {
      document.body.classList.remove('expanded-mode');
      btnPhoneView.classList.add('active');
      btnExpandedView.classList.remove('active');
    });

    btnExpandedView?.addEventListener('click', () => {
      document.body.classList.add('expanded-mode');
      btnExpandedView.classList.add('active');
      btnPhoneView.classList.remove('active');
    });

    // Artboard list item click
    document.querySelectorAll('.artboard-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.artboard-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  // DOM Content Loaded
  document.addEventListener('DOMContentLoaded', () => {
    initListeners();
    startClock();
    startPriceTimer();
    calcBuyEquiv();
    updateUserBalance();
    navigate('home');
    setInterval(refreshPrice, 12000); // Live price tick every 12s
  });

  // Expose Global App API
  window.AuroApp = {
    navigate,
    setBuyMode,
    setBuyAmount,
    calcBuyEquiv,
    completePurchase,
    setSellGrams,
    calcSellPayout,
    executeSell,
    calcSip,
    confirmSip,
    openProduct,
    keyPress,
    keyBackspace,
    submitPhone,
    verifyOtp,
    refreshPrice
  };

})();
