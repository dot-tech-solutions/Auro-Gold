/**
 * AURO GOLD - FULL WEB APPLICATION CONTROLLER (EXTENDED)
 * Includes User & Employee Authentication, Bespoke Jewelry Design Studio,
 * Gemologist Consultation, Physical Redemption, and Real-Time Trading Engine.
 */
(function () {
  'use strict';

  // Global App State
  const state = {
    liveBuyRate: 7248.50, // Rs per gram 24K 99.9%
    liveSellRate: 7210.00,
    userGrams: 12.4580,
    currentUser: null, // null | { name: 'Santhosh G', role: 'user' | 'employee' }
    tradeAction: 'buy', // 'buy' | 'sell'
    unitMode: 'rupees', // 'rupees' | 'grams'
    tradeInputVal: 1000,
    lockTimerSeconds: 285,
    sipDurationYears: 3,
    activeTimeframe: '1D',
    
    // Custom Studio State
    studioType: 'ring',
    studioMetalClass: 'gold-yellow',
    studioMetalMultiplier: 1.0,
    studioGemType: 'diamond',
    studioGemPrice: 15000,
    studioBaseGoldGrams: 5.25
  };

  // Products Database
  const products = {
    coin1: { title: 'Auro 24K Lakshmi Gold Coin', weight: '1.000 g', grams: 1.0, purity: '24K 999.9' },
    neck15: { title: 'Heritage Filigree Gold Choker', weight: '15.50 g', grams: 15.5, purity: '22K 916' },
    kada24: { title: 'Royal Peacock Gold Kada (Pair)', weight: '24.00 g', grams: 24.0, purity: '22K 916' },
    bar5: { title: 'Auro 5g Minted Gold Bar', weight: '5.000 g', grams: 5.0, purity: '24K 999.9' },
    haar32: { title: 'Navratna Kasumala Royal Haar', weight: '32.00 g', grams: 32.0, purity: '22K 916' },
    ring4: { title: 'Eternal Solitaire Diamond Ring', weight: '4.80 g', grams: 4.8, purity: '18K Solitaire' },
    bangle18: { title: 'Aura Floral Studded Gold Bangles', weight: '18.20 g', grams: 18.2, purity: '22K 916' },
    coin10: { title: 'Auro 10g Lord Ganesha Coin', weight: '10.000 g', grams: 10.0, purity: '24K 999.9' }
  };

  // Switch Trade Action (Buy vs Sell)
  function setTradeAction(action) {
    state.tradeAction = action;
    const tabBuy = document.getElementById('tabBuyGold');
    const tabSell = document.getElementById('tabSellGold');
    const labelRow = document.getElementById('tradeActionLabel');
    const widgetRate = document.getElementById('widgetRate');
    const gstRow = document.getElementById('gstRow');
    const labelRow1 = document.getElementById('labelRow1');
    const labelTotal = document.getElementById('labelTotal');
    const input = document.getElementById('tradeInput');

    if (action === 'buy') {
      tabBuy?.classList.add('active');
      tabSell?.classList.remove('active');
      if (labelRow) labelRow.innerText = 'LIVE BUYING RATE';
      if (widgetRate) widgetRate.innerText = state.liveBuyRate.toFixed(2);
      if (gstRow) gstRow.style.display = 'flex';
      if (labelRow1) labelRow1.innerText = 'Gold Value:';
      if (labelTotal) labelTotal.innerText = 'Total Payable:';
      if (input) {
        input.value = 1000;
        input.min = 10;
        input.step = 50;
      }
      setUnitMode('rupees');
    } else {
      tabSell?.classList.add('active');
      tabBuy?.classList.remove('active');
      if (labelRow) labelRow.innerText = 'LIVE SELLING RATE';
      if (widgetRate) widgetRate.innerText = state.liveSellRate.toFixed(2);
      if (gstRow) gstRow.style.display = 'none';
      if (labelRow1) labelRow1.innerText = 'Gross Payout:';
      if (labelTotal) labelTotal.innerText = 'Instant Bank Credit:';
      setUnitMode('grams');
      if (input) {
        input.value = 1.0;
        input.min = 0.1;
        input.max = state.userGrams;
        input.step = 0.1;
      }
    }
    calcTrade();
  }

  // Set Unit Mode
  function setUnitMode(mode) {
    state.unitMode = mode;
    const btnRupees = document.getElementById('btnModeRupees');
    const btnGrams = document.getElementById('btnModeGrams');
    const prefix = document.getElementById('inputPrefix');
    const chipsContainer = document.getElementById('presetChipsContainer');

    if (mode === 'rupees') {
      btnRupees?.classList.add('active');
      btnGrams?.classList.remove('active');
      if (prefix) prefix.innerText = '₹';
      if (chipsContainer) {
        chipsContainer.innerHTML = `
          <button class="p-chip" onclick="window.AuroWeb.setPresetAmount(500)">+₹500</button>
          <button class="p-chip active" onclick="window.AuroWeb.setPresetAmount(1000)">₹1,000</button>
          <button class="p-chip" onclick="window.AuroWeb.setPresetAmount(2500)">₹2,500</button>
          <button class="p-chip" onclick="window.AuroWeb.setPresetAmount(5000)">₹5,000</button>
        `;
      }
    } else {
      btnGrams?.classList.add('active');
      btnRupees?.classList.remove('active');
      if (prefix) prefix.innerText = 'g';
      if (chipsContainer) {
        chipsContainer.innerHTML = `
          <button class="p-chip" onclick="window.AuroWeb.setPresetAmount(0.5)">0.5g</button>
          <button class="p-chip active" onclick="window.AuroWeb.setPresetAmount(1.0)">1.0g</button>
          <button class="p-chip" onclick="window.AuroWeb.setPresetAmount(2.0)">2.0g</button>
          <button class="p-chip" onclick="window.AuroWeb.setPresetAmount(5.0)">5.0g</button>
        `;
      }
    }
    calcTrade();
  }

  function setPresetAmount(val) {
    const input = document.getElementById('tradeInput');
    if (input) {
      input.value = val;
      calcTrade();
    }
    document.querySelectorAll('.p-chip').forEach(c => {
      c.classList.toggle('active', c.innerText.includes(val.toString()));
    });
  }

  function calcTrade() {
    const input = document.getElementById('tradeInput');
    const val = parseFloat(input?.value) || 0;
    const equivNote = document.getElementById('equivNote');
    const valRow1 = document.getElementById('valRow1');
    const valGst = document.getElementById('valGst');
    const valTotal = document.getElementById('valTotalPayable');
    const btnText = document.getElementById('btnTradeText');

    if (state.tradeAction === 'buy') {
      let grams = 0;
      let totalPayable = 0;
      let netGold = 0;
      let gst = 0;

      if (state.unitMode === 'rupees') {
        totalPayable = val;
        netGold = totalPayable / 1.03;
        gst = totalPayable - netGold;
        grams = netGold / state.liveBuyRate;
        if (equivNote) equivNote.innerHTML = `You will receive approx <strong id="calcGramsResult">${grams.toFixed(4)} grams</strong> of pure 24K Gold`;
      } else {
        grams = val;
        netGold = grams * state.liveBuyRate;
        gst = netGold * 0.03;
        totalPayable = netGold + gst;
        if (equivNote) equivNote.innerHTML = `Total cost for <strong>${grams.toFixed(4)} grams</strong> of 24K Gold`;
      }

      if (valRow1) valRow1.innerText = `₹${netGold.toFixed(2)}`;
      if (valGst) valGst.innerText = `₹${gst.toFixed(2)}`;
      if (valTotal) valTotal.innerText = `₹${totalPayable.toFixed(2)}`;
      if (btnText) btnText.innerText = `Pay ₹${Math.round(totalPayable).toLocaleString('en-IN')} & Deposit to Vault`;

    } else {
      let grams = 0;
      let payout = 0;

      if (state.unitMode === 'grams') {
        grams = val;
        payout = grams * state.liveSellRate;
      } else {
        payout = val;
        grams = payout / state.liveSellRate;
      }

      if (equivNote) equivNote.innerHTML = `Selling <strong id="calcGramsResult">${grams.toFixed(4)} grams</strong> from available vault (${state.userGrams.toFixed(4)}g)`;
      if (valRow1) valRow1.innerText = `₹${payout.toFixed(2)}`;
      if (valTotal) valTotal.innerText = `₹${payout.toFixed(2)}`;
      if (btnText) btnText.innerText = `Confirm Sell • Instant Transfer ₹${Math.round(payout).toLocaleString('en-IN')}`;
    }
  }

  function initiatePayment() {
    const input = document.getElementById('tradeInput');
    const val = parseFloat(input?.value) || 0;
    const modal = document.getElementById('paymentModal');
    const modalTitle = document.getElementById('paymentModalTitle');
    const payGrams = document.getElementById('payModalGrams');
    const payAmount = document.getElementById('payModalAmount');

    if (state.tradeAction === 'buy') {
      if (modalTitle) modalTitle.innerText = 'Authorize Gold Purchase';
      let grams = state.unitMode === 'rupees' ? (val / 1.03) / state.liveBuyRate : val;
      let total = state.unitMode === 'rupees' ? val : (val * state.liveBuyRate * 1.03);
      if (payGrams) payGrams.innerText = grams.toFixed(4);
      if (payAmount) payAmount.innerText = total.toFixed(2);
      modal?.classList.add('open');
    } else {
      if (val > state.userGrams) {
        alert(`Cannot sell more than ${state.userGrams.toFixed(4)} grams available in vault.`);
        return;
      }
      state.userGrams -= val;
      updateVaultUI();
      alert(`Success! Sold ${val.toFixed(4)} gms of gold. Payout credited to your bank account in 60s.`);
    }
  }

  function processPaymentConfirm() {
    const payGrams = parseFloat(document.getElementById('payModalGrams')?.innerText) || 0;
    const payAmount = document.getElementById('payModalAmount')?.innerText || '1,000';

    state.userGrams += payGrams;
    updateVaultUI();
    closeModals();

    const ledger = document.getElementById('modalPassbookLedger');
    if (ledger) {
      const newEntry = document.createElement('div');
      newEntry.style.cssText = 'display:flex; justify-content:space-between; padding:10px 12px; background:#D1FAE5; border-radius:8px; border:1px solid #108E58;';
      newEntry.innerHTML = `
        <div>
          <strong style="font-size:0.85rem; color:#064E3B; display:block;">Bought 24K Digital Gold (Verified)</strong>
          <small style="color:#047857;">Just Now • UPI Payment • Tx: #AUG-${Math.floor(Math.random()*90000 + 10000)}</small>
        </div>
        <div style="text-align:right;">
          <strong style="color:#059669; font-size:0.9rem;">+${payGrams.toFixed(4)} g</strong>
          <small style="display:block; color:#047857;">₹${payAmount}</small>
        </div>
      `;
      ledger.prepend(newEntry);
    }

    alert(`Payment Successful! ${payGrams.toFixed(4)} grams of 24K 999.9 Pure Gold has been vaulted with Brink's India on your behalf.`);
    openVaultModal();
  }

  // PHYSICAL REDEMPTION
  let selectedRedeemProduct = 'coin1';
  function openRedeemModal(prodKey) {
    selectedRedeemProduct = prodKey;
    const p = products[prodKey];
    if (!p) return;

    const titleEl = document.getElementById('redeemItemTitle');
    const weightEl = document.getElementById('redeemItemWeight');
    if (titleEl) titleEl.innerText = p.title;
    if (weightEl) weightEl.innerText = `Weight: ${p.weight} • ${p.purity} BIS Hallmarked`;

    document.getElementById('redeemModal')?.classList.add('open');
  }

  function confirmDispatch() {
    const p = products[selectedRedeemProduct];
    if (!p) return;

    if (p.grams > state.userGrams) {
      alert(`Insufficient vault balance to redeem ${p.weight}. You have ${state.userGrams.toFixed(4)}g. Please buy more digital gold first!`);
      closeModals();
      scrollToBuy();
      return;
    }

    state.userGrams -= p.grams;
    updateVaultUI();
    closeModals();
    alert(`Order Confirmed! Your ${p.title} has been queued for insured BlueDart delivery with tracking #BD-${Math.floor(Math.random()*900000 + 100000)}.`);
  }

  // CUSTOM JEWELRY DESIGN STUDIO ENGINE
  function setStudioType(type, iconClass, btn) {
    state.studioType = type;
    document.querySelectorAll('.opt-pill-btn').forEach(b => {
      if (b.parentNode === btn.parentNode) b.classList.remove('active');
    });
    btn.classList.add('active');

    const iconEl = document.getElementById('studioJewelIcon');
    if (iconEl) {
      iconEl.className = `fa-solid ${iconClass}`;
    }

    if (type === 'ring') state.studioBaseGoldGrams = 5.25;
    else if (type === 'pendant') state.studioBaseGoldGrams = 8.50;
    else if (type === 'bangle') state.studioBaseGoldGrams = 22.00;

    updateStudioCalculations();
  }

  function setStudioMetal(colorClass, multiplier, btn) {
    state.studioMetalClass = colorClass;
    state.studioMetalMultiplier = multiplier;
    document.querySelectorAll('.opt-pill-btn').forEach(b => {
      if (b.parentNode === btn.parentNode) b.classList.remove('active');
    });
    btn.classList.add('active');

    const canvas = document.getElementById('studioMockCanvas');
    if (canvas) {
      canvas.className = `jewel-canvas-mock ${colorClass}`;
    }

    updateStudioCalculations();
  }

  function setStudioGem(gemType, gemPrice, btn) {
    state.studioGemType = gemType;
    state.studioGemPrice = gemPrice;
    document.querySelectorAll('.opt-pill-btn').forEach(b => {
      if (b.parentNode === btn.parentNode) b.classList.remove('active');
    });
    btn.classList.add('active');

    const gemIcon = document.getElementById('gemOverlayIcon');
    if (gemIcon) {
      if (gemType === 'none') {
        gemIcon.style.display = 'none';
      } else {
        gemIcon.style.display = 'block';
        if (gemType === 'diamond') {
          gemIcon.className = 'fa-solid fa-diamond gem-accent-overlay';
          gemIcon.style.color = '#38BDF8';
        } else if (gemType === 'ruby') {
          gemIcon.className = 'fa-solid fa-gem gem-accent-overlay';
          gemIcon.style.color = '#EF4444';
        }
      }
    }

    updateStudioCalculations();
  }

  function updateStudioCalculations() {
    const goldGrams = state.studioBaseGoldGrams;
    const goldCost = goldGrams * state.liveBuyRate * state.studioMetalMultiplier;
    const makingCharges = 3500;
    const totalEst = goldCost + state.studioGemPrice + makingCharges;

    const priceEl = document.getElementById('specEstimatedPrice');
    const goldEl = document.getElementById('specRequiredGold');
    const itemEl = document.getElementById('specItemName');

    if (priceEl) priceEl.innerText = `₹${Math.round(totalEst).toLocaleString('en-IN')}`;
    if (goldEl) goldEl.innerText = `${goldGrams.toFixed(2)} gms`;
    if (itemEl) {
      const typeName = state.studioType === 'ring' ? 'Custom Solitaire Ring' : state.studioType === 'pendant' ? 'Bespoke Royal Pendant' : 'Royal Kada / Bangle';
      itemEl.innerText = typeName;
    }
  }

  function submitCustomDesignOrder() {
    const engraving = document.getElementById('engraveInput')?.value;
    const goldGrams = state.studioBaseGoldGrams;

    if (goldGrams > state.userGrams) {
      alert(`Custom order requires ${goldGrams} grams of gold from your vault. Current balance is ${state.userGrams.toFixed(4)}g. Please buy more digital gold first!`);
      scrollToBuy();
      return;
    }

    state.userGrams -= goldGrams;
    updateVaultUI();
    
    // Add to employee console queue
    const empTable = document.getElementById('empOrdersTableBody');
    if (empTable) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>#CAD-${Math.floor(Math.random()*9000 + 1000)}</td>
        <td>Santhosh G</td>
        <td>Custom ${state.studioType} (${engraving ? 'Engraved: "' + engraving + '"' : 'Plain'})</td>
        <td>${goldGrams.toFixed(3)} g</td>
        <td><span style="color:#34D399;">CAD In Production</span></td>
        <td><button style="padding:4px 8px; border-radius:4px; background:#108E58; color:#FFF; border:none; cursor:pointer;" onclick="alert('Master craftsman assigned.')">Assign</button></td>
      `;
      empTable.prepend(row);
    }

    alert(`Bespoke Design Ordered! ${goldGrams}g deducted from your vault. Laser Engraving: "${engraving || 'Standard'}". Our master CAD craftsman is initiating 3D render.`);
  }

  // CONSULTING PAGE PRICE CALCULATOR
  function calcConsultPrice() {
    const grams = parseFloat(document.getElementById('consultGrams')?.value) || 10;
    const txType = document.getElementById('consultTxType')?.value || 'buy';
    const purity = parseFloat(document.getElementById('consultPurity')?.value) || 1.0;

    const rate = txType === 'sell' ? state.liveSellRate : state.liveBuyRate;
    const goldVal = grams * rate * purity;

    const gstRow = document.getElementById('cpcGstRow');
    const makingRow = document.getElementById('cpcMakingRow');
    const goldLabel = document.getElementById('cpcGoldLabel');
    const goldValEl = document.getElementById('cpcGoldVal');
    const gstEl = document.getElementById('cpcGst');
    const makingEl = document.getElementById('cpcMaking');
    const totalEl = document.getElementById('cpcTotal');

    const purityLabel = purity >= 1.0 ? '24K' : purity > 0.9 ? '22K' : '18K';
    const rateLabel = txType === 'sell' ? state.liveSellRate.toFixed(2) : state.liveBuyRate.toFixed(2);
    if (goldLabel) goldLabel.innerText = `Gold Value (${grams}g \u00d7 \u20b9${rateLabel} ${purityLabel}):`;
    if (goldValEl) goldValEl.innerText = `\u20b9${goldVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

    let total = goldVal;

    if (txType === 'buy') {
      const gst = goldVal * 0.03;
      total += gst;
      if (gstRow) gstRow.style.display = 'flex';
      if (makingRow) makingRow.style.display = 'none';
      if (gstEl) gstEl.innerText = `\u20b9${gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    } else if (txType === 'sell') {
      if (gstRow) gstRow.style.display = 'none';
      if (makingRow) makingRow.style.display = 'none';
    } else if (txType === 'jewelry') {
      const making = goldVal * 0.14;
      const gst = (goldVal + making) * 0.03;
      total += making + gst;
      if (gstRow) gstRow.style.display = 'flex';
      if (makingRow) makingRow.style.display = 'flex';
      if (gstEl) gstEl.innerText = `\u20b9${gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
      if (makingEl) makingEl.innerText = `\u20b9${making.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    }

    if (totalEl) totalEl.innerText = `\u20b9${total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }

  function contactEmployee(name, mode) {
    const modeText = mode === 'video' ? 'HD Video Call' : 'Phone Call';
    showToast('Connecting...', `Initiating ${modeText} with ${name}. Please allow camera/mic access.`, 'success');
    const empTable = document.getElementById('empOrdersTableBody');
    if (empTable) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>#CON-${Math.floor(Math.random()*9000+1000)}</td>
        <td>Client Request</td>
        <td>${modeText} with ${name}</td>
        <td>\u2014</td>
        <td><span style="color:#60A5FA;">Connecting</span></td>
        <td><button style="padding:4px 8px;border-radius:4px;background:#2563EB;color:#FFF;border:none;cursor:pointer;" onclick="alert('Meeting link sent to client')">Join</button></td>
      `;
      empTable.prepend(row);
    }
  }

  function sendPriceQuote(empName) {
    const grams = document.getElementById('consultGrams')?.value || '10';
    const txType = document.getElementById('consultTxType')?.value || 'buy';
    const total = document.getElementById('cpcTotal')?.innerText || '\u20b90';
    const name = document.getElementById('consultName')?.value || 'Customer';
    const phone = document.getElementById('consultPhone')?.value || '';

    showToast('Quote Sent!', `${empName} received your price quote (${grams}g, ${txType}) of ${total} for ${name}. They will call shortly.`, 'success');
    const empTable = document.getElementById('empOrdersTableBody');
    if (empTable) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>#QTE-${Math.floor(Math.random()*9000+1000)}</td>
        <td>${name} (${phone.slice(-4)})</td>
        <td>${parseFloat(grams).toFixed(3)}g ${txType.toUpperCase()} quote</td>
        <td>${grams}g</td>
        <td><span style="color:#FBBF24;">Quote Sent</span></td>
        <td><button style="padding:4px 8px;border-radius:4px;background:var(--gold-primary);color:#081B13;border:none;cursor:pointer;" onclick="alert('Quote confirmed: ${total}')">Confirm</button></td>
      `;
      empTable.prepend(row);
    }
  }

  function requestQuoteFromCalc() {
    const grams = document.getElementById('consultGrams')?.value || '10';
    const txType = document.getElementById('consultTxType')?.value || 'buy';
    const total = document.getElementById('cpcTotal')?.innerText || '\u20b90';
    showToast('Quote Requested!', `Your quote for ${grams}g (${txType}) = ${total} sent to next available specialist.`, 'success');
    contactEmployee('Available Specialist');
  }

  // 1-ON-1 GEMOLOGIST CONSULTATION BOOKING
  function bookConsultation() {
    const name = document.getElementById('consultName')?.value || 'Santhosh G';
    const phone = document.getElementById('consultPhone')?.value || '+91 98765 43210';
    const mode = document.getElementById('consultMode')?.value;
    const date = document.getElementById('consultDate')?.value;

    showToast('Consultation Booked!', `${name} — slot confirmed via ${(mode || 'video').toUpperCase()} on ${date}. SMS sent to ${phone}.`, 'success');
    const empTable = document.getElementById('empOrdersTableBody');
    if (empTable) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>#CON-${Math.floor(Math.random()*9000+1000)}</td>
        <td>${name}</td>
        <td>1-on-1 Session (${mode || 'video'})</td>
        <td>\u2014</td>
        <td><span style="color:#34D399;">Confirmed ${date}</span></td>
        <td><button style="padding:4px 8px;border-radius:4px;background:#2563EB;color:#FFF;border:none;cursor:pointer;" onclick="alert('Session launched for ${name}')">Launch</button></td>
      `;
      empTable.prepend(row);
    }
  }

  // USER & EMPLOYEE LOGIN WORKFLOW
  function openLoginModal(tab) {
    switchAuthTab(tab || 'user');
    document.getElementById('authModal')?.classList.add('open');
  }

  function switchAuthTab(tab) {
    const userBtn = document.getElementById('btnAuthTabUser');
    const empBtn = document.getElementById('btnAuthTabEmployee');
    const userForm = document.getElementById('userLoginForm');
    const empForm = document.getElementById('employeeLoginForm');

    if (tab === 'user') {
      userBtn?.classList.add('active');
      empBtn?.classList.remove('active');
      if (userForm) userForm.style.display = 'flex';
      if (empForm) empForm.style.display = 'none';
    } else {
      empBtn?.classList.add('active');
      userBtn?.classList.remove('active');
      if (userForm) userForm.style.display = 'none';
      if (empForm) empForm.style.display = 'flex';
    }
  }

  // Modern In-Page Toast Notification System
  function showToast(title, message, type = 'success') {
    let container = document.getElementById('auroToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'auroToastContainer';
      container.className = 'auro-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `auro-toast ${type}`;
    const iconClass = type === 'success' ? 'fa-circle-check' : 'fa-bell';
    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${iconClass}"></i></div>
      <div class="toast-body">
        <strong>${title}</strong>
        <span>${message}</span>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 20);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  function processUserLogin() {
    const phone = document.getElementById('userLoginPhone')?.value || '9876543210';
    state.currentUser = { name: 'Santhosh G', role: 'user', phone };
    closeModals();

    const navAuth = document.getElementById('authNavButtons');
    if (navAuth) {
      navAuth.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; background:rgba(212,160,23,0.15); border:1px solid var(--gold-border); padding:6px 14px; border-radius:20px; font-size:0.8rem; color:#FFF;">
          <i class="fa-solid fa-circle-check" style="color:#10B981;"></i>
          <strong>Santhosh G (Verified)</strong>
          <button style="background:none; border:none; color:#F87171; cursor:pointer; margin-left:6px;" onclick="window.AuroWeb.logout()" title="Logout"><i class="fa-solid fa-arrow-right-from-bracket"></i></button>
        </div>
      `;
    }
    showToast('Login Successful', `Welcome back, Santhosh G! Logged in with +91 ${phone}`, 'success');
  }

  function processEmployeeLogin() {
    const empId = document.getElementById('empLoginId')?.value || 'EMP-8024';
    state.currentUser = { name: 'Rajesh Sharma', role: 'employee', empId };
    closeModals();

    const navAuth = document.getElementById('authNavButtons');
    if (navAuth) {
      navAuth.innerHTML = `
        <button class="btn-auth employee" onclick="window.AuroWeb.openEmployeePortal()">
          <i class="fa-solid fa-gauge-high"></i> Staff Console (${empId})
        </button>
      `;
    }

    openEmployeePortal();
  }

  function openEmployeePortal() {
    document.getElementById('employeePortalModal')?.classList.add('open');
  }

  function closeEmployeePortal() {
    document.getElementById('employeePortalModal')?.classList.remove('open');
  }

  function logout() {
    state.currentUser = null;
    location.reload();
  }

  // UPDATE VAULT UI
  function updateVaultUI() {
    const navVault = document.getElementById('navVaultGrams');
    const modalGrams = document.getElementById('modalVaultGrams');
    const modalVal = document.getElementById('modalVaultValue');

    const totalVal = state.userGrams * state.liveBuyRate;

    if (navVault) navVault.innerText = state.userGrams.toFixed(4);
    if (modalGrams) modalGrams.innerText = state.userGrams.toFixed(4);
    if (modalVal) modalVal.innerText = totalVal.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  // SIP CALCULATOR PROJECTION
  function calcSipProjection() {
    const slider = document.getElementById('sipRangeInput');
    const amt = parseFloat(slider?.value) || 200;
    const valDisp = document.getElementById('sipValDisplay');
    const btnAmt = document.getElementById('sipBtnAmt');
    const capSavedEl = document.getElementById('sipCapitalSaved');
    const projValEl = document.getElementById('sipProjectedVal');
    const gramsEstEl = document.getElementById('sipGramsEst');

    if (valDisp) valDisp.innerText = amt;
    if (btnAmt) btnAmt.innerText = amt;

    const years = state.sipDurationYears;
    const totalDays = years * 365;
    const capitalSaved = amt * totalDays;

    const rateGrowth = Math.pow(1 + 0.115, years);
    const projectedVal = capitalSaved * (1 + (rateGrowth - 1) / 2);
    const estGrams = (capitalSaved / state.liveBuyRate) * 1.05;

    if (capSavedEl) capSavedEl.innerText = `₹${Math.round(capitalSaved).toLocaleString('en-IN')}`;
    if (projValEl) projValEl.innerText = `₹${Math.round(projectedVal).toLocaleString('en-IN')}`;
    if (gramsEstEl) gramsEstEl.innerText = `~${estGrams.toFixed(1)} grams 24K`;
  }

  function setSipDuration(years, btn) {
    state.sipDurationYears = years;
    document.querySelectorAll('.sd-tab').forEach(b => b.classList.remove('active'));
    btn?.classList.add('active');
    calcSipProjection();
  }

  function startSipFlow() {
    const slider = document.getElementById('sipRangeInput');
    const amt = slider?.value || '200';
    alert(`Setting up UPI AutoPay for Daily ₹${amt} Gold SIP... Redirecting to Bank e-Mandate approval.`);
  }

  // CATALOG FILTER
  function filterCatalog(category, btn) {
    document.querySelectorAll('.cf-btn').forEach(b => b.classList.remove('active'));
    btn?.classList.add('active');

    const cards = document.querySelectorAll('.web-product-card');
    cards.forEach(card => {
      const cat = card.getAttribute('data-cat');
      if (category === 'all' || cat === category) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // CHART TIMEFRAMES
  function switchChart(timeframe, btn) {
    state.activeTimeframe = timeframe;
    document.querySelectorAll('.tf-chip').forEach(b => b.classList.remove('active'));
    btn?.classList.add('active');

    const area = document.getElementById('chartAreaPath');
    const line = document.getElementById('chartLinePath');

    if (timeframe === '1D') {
      line?.setAttribute('d', 'M 0,180 Q 120,165 240,140 T 450,90 T 680,40');
      area?.setAttribute('d', 'M 0,180 Q 120,165 240,140 T 450,90 T 680,40 L 680,240 L 0,240 Z');
    } else if (timeframe === '1W') {
      line?.setAttribute('d', 'M 0,210 Q 180,180 340,120 T 520,80 T 680,30');
      area?.setAttribute('d', 'M 0,210 Q 180,180 340,120 T 520,80 T 680,30 L 680,240 L 0,240 Z');
    } else if (timeframe === '1M') {
      line?.setAttribute('d', 'M 0,190 Q 150,130 300,160 T 480,70 T 680,20');
      area?.setAttribute('d', 'M 0,190 Q 150,130 300,160 T 480,70 T 680,20 L 680,240 L 0,240 Z');
    } else if (timeframe === '1Y') {
      line?.setAttribute('d', 'M 0,220 Q 200,170 380,110 T 560,50 T 680,15');
      area?.setAttribute('d', 'M 0,220 Q 200,170 380,110 T 560,50 T 680,15 L 680,240 L 0,240 Z');
    } else if (timeframe === '5Y') {
      line?.setAttribute('d', 'M 0,230 Q 160,200 320,150 T 500,80 T 680,10');
      area?.setAttribute('d', 'M 0,230 Q 160,200 320,150 T 500,80 T 680,10 L 680,240 L 0,240 Z');
    }
  }

  // MODALS & NAVIGATION
  function openVaultModal() {
    updateVaultUI();
    document.getElementById('vaultModal')?.classList.add('open');
  }

  function closeModals() {
    document.querySelectorAll('.web-modal-overlay').forEach(m => m.classList.remove('open'));
  }

  function scrollToBuy() {
    document.getElementById('buy-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  function downloadCertificate() {
    alert('Generating SEBI/BIS Hallmarked Certificate of Ownership (PDF)... Download starting.');
  }

  function toggleMobileMenu() {
    const nav = document.querySelector('.nav-links');
    if (nav) {
      nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
      nav.style.flexDirection = 'column';
      nav.style.position = 'absolute';
      nav.style.top = '76px';
      nav.style.left = '0';
      nav.style.width = '100%';
      nav.style.background = '#081B13';
      nav.style.padding = '1.5rem';
    }
  }

  // REAL-TIME PRICE ENGINE
  function startTicker() {
    setInterval(() => {
      const delta = (Math.random() - 0.46) * 3.5;
      state.liveBuyRate = +(state.liveBuyRate + delta).toFixed(2);
      state.liveSellRate = +(state.liveBuyRate - 38.50).toFixed(2);

      const tRate = document.getElementById('tickerGoldRate');
      const wRate = document.getElementById('widgetRate');
      const aRate = document.getElementById('analyticsRate');
      const cBuy = document.getElementById('consultBuyRate');
      const cSell = document.getElementById('consultSellRate');
      const cSpread = document.getElementById('consultSpread');

      if (tRate) tRate.innerText = state.liveBuyRate.toFixed(2);
      if (aRate) aRate.innerText = state.liveBuyRate.toFixed(2);
      if (wRate) {
        wRate.innerText = state.tradeAction === 'buy' ? state.liveBuyRate.toFixed(2) : state.liveSellRate.toFixed(2);
      }
      if (cBuy) cBuy.innerText = state.liveBuyRate.toLocaleString('en-IN', {maximumFractionDigits: 2});
      if (cSell) cSell.innerText = state.liveSellRate.toLocaleString('en-IN', {maximumFractionDigits: 2});
      if (cSpread) cSpread.innerText = `\u20b9${(state.liveBuyRate - state.liveSellRate).toFixed(2)}`;

      calcTrade();
      updateStudioCalculations();
      calcConsultPrice();
    }, 10000);

    const lockTimer = document.getElementById('widgetLockTimer');
    setInterval(() => {
      if (state.lockTimerSeconds > 0) {
        state.lockTimerSeconds--;
        const m = Math.floor(state.lockTimerSeconds / 60);
        const s = state.lockTimerSeconds % 60;
        if (lockTimer) lockTimer.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} min`;
      } else {
        state.lockTimerSeconds = 300;
      }
    }, 1000);
  }

  // INITIALIZE
  document.addEventListener('DOMContentLoaded', () => {
    calcTrade();
    calcSipProjection();
    updateVaultUI();
    updateStudioCalculations();
    calcConsultPrice();
    startTicker();

    document.querySelectorAll('.web-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModals();
      });
    });
  });

  // GLOBAL API
  window.AuroWeb = {
    setTradeAction,
    setUnitMode,
    setPresetAmount,
    calcTrade,
    initiatePayment,
    processPaymentConfirm,
    openRedeemModal,
    confirmDispatch,
    openVaultModal,
    closeModals,
    scrollToBuy,
    downloadCertificate,
    calcSipProjection,
    setSipDuration,
    startSipFlow,
    filterCatalog,
    switchChart,
    toggleMobileMenu,
    
    // Extensions
    openLoginModal,
    switchAuthTab,
    processUserLogin,
    processEmployeeLogin,
    openEmployeePortal,
    closeEmployeePortal,
    logout,
    setStudioType,
    setStudioMetal,
    setStudioGem,
    submitCustomDesignOrder,
    bookConsultation,

    // Consulting & Employee Directory
    calcConsultPrice,
    contactEmployee,
    sendPriceQuote,
    requestQuoteFromCalc
  };

})();
