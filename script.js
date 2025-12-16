// =========================================================================
// --- JAVASCRIPT LOCK ACCESS (KONFIGURASI) ---
// =========================================================================
const WEBHOOK_URL = "https://hook.us2.make.com/ilghmt5fjvq7q946ek6bwogu5kbl6vow"; 
const STORAGE_KEY = "user_access_token_v2"; 
const FRAME_ID = 'marketplace-calculator-widget'; 

// =========================================================================
// --- JAVASCRIPT MARKETPLACE CALCULATOR (LOGIC) ---
// =========================================================================
let activeRounding = 0; 
let hasCalculated = false;

document.addEventListener("DOMContentLoaded", function() {
    // Check apakah user sudah login di local storage
    if (localStorage.getItem(STORAGE_KEY) === "valid") unlockApp();

    // --- MARKETPLACE INIT ---
    const inputs = ['modalPrice', 'otherCost', 'actualPrice'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', function() { formatInputNumber(this); });
            formatInputNumber(el);
        }
    });

    setupSliderSync('mpFeeRateSlider', 'mpFeeRate');
    setupSliderSync('adsBudgetRateSlider', 'adsBudgetRate');
    setupSliderSync('affiliateBudgetRateSlider', 'affiliateBudgetRate'); 
    setupSliderSync('operationalBudgetRateSlider', 'operationalBudgetRate');
    setupSliderSync('profitMarginRateSlider', 'profitMarginRate');
    
    const calculateButton = document.getElementById('calculateButton');
    if (calculateButton) {
        calculateButton.addEventListener('click', () => calculateMarketplacePrice(true));
    }
    document.getElementById('saveImageBtn').addEventListener('click', saveToImage);
    
    const observer = new ResizeObserver(() => triggerResizeSequence());
    const container = document.getElementById('marketplace-app'); 
    if(container) observer.observe(container);
    document.addEventListener('click', triggerResizeSequence);

    updateTotalVariable();
    triggerResizeSequence(); 
});


// =========================================================================
// --- LOCK ACCESS FUNCTIONS (TIDAK DIUBAH) ---
// =========================================================================
async function checkCredentials() {
    let phone = document.getElementById("phoneInput").value.trim();
    let email = document.getElementById("emailInput").value.trim();
    
    const btn = document.getElementById("btnSubmit");
    const actionArea = document.getElementById("actionArea");

    actionArea.style.display = "none";
    
    phone = phone.replace(/\D/g,'');

    if (phone.length < 9 || !email.includes("@")) {
        alert("Mohon isi Email dan Nomor HP dengan benar.");
        return;
    }

    if (phone.startsWith("0")) phone = "62" + phone.slice(1);
    else if (phone.startsWith("8")) phone = "62" + phone;

    btn.innerText = "Memverifikasi...";
    btn.disabled = true;

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                phone: phone, 
                email: email 
            }) 
        });

        const data = await response.json();

        if (data.status === "success") {
            localStorage.setItem(STORAGE_KEY, "valid");
            unlockApp();
        } else {
            throw new Error("Ditolak");
        }

    } catch (error) {
        console.log("Login Failed:", error);
        actionArea.style.display = "block";
        const card = document.querySelector('.login-card');
        card.style.transform = "translateX(5px)";
        setTimeout(() => card.style.transform = "translateX(0)", 100);
    } finally {
        btn.innerText = "Masuk Aplikasi";
        btn.disabled = false;
    }
}

function unlockApp() {
    document.getElementById("lock-app").style.display = "none";
    document.getElementById("main-app").style.display = "block";
    
    triggerResizeSequence(); 
}

function logout() {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
}

function handleEnter(e) {
    if (e.key === "Enter") checkCredentials();
}

// =========================================================================
// --- MARKETPLACE FUNCTIONS (DIADAPTASI) ---
// =========================================================================
function getAccurateHeight() {
    const container = document.getElementById('marketplace-app');
    if(container) return container.offsetHeight + 30; 
    return document.body.scrollHeight + 30;
}

function sendHeight() {
    const h = getAccurateHeight();
    window.parent.postMessage({ height: h, frameId: FRAME_ID }, '*');
}

function triggerResizeSequence() {
    sendHeight();
    setTimeout(sendHeight, 20); setTimeout(sendHeight, 50); setTimeout(sendHeight, 100); setTimeout(sendHeight, 300); setTimeout(sendHeight, 500); 
}

function formatCurrency(n) { return (isNaN(n)||n===null)?'Rp 0':new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(Math.round(n)); }
function formatNumber(n) { return (isNaN(n)||n===null)?'0':new Intl.NumberFormat('id-ID',{minimumFractionDigits:0}).format(Math.round(n)); }

function getRawValue(id) { 
    const el=document.getElementById(id); 
    if(!el || !el.value) return 0;
    let cleanVal = el.value.replace(/\./g,'').replace(/,/g,'.');
    return parseFloat(cleanVal) || 0; 
}

function formatInputNumber(el) { 
    let valStr = el.value.replace(/\./g,'');
    if(!valStr) { el.value = ''; return; }
    if(valStr.indexOf(',') !== -1) {
        const parts = valStr.split(',');
        if (parts.length > 2) valStr = parts[0] + ',' + parts[1];
        const integerPart = parseFloat(parts[0]);
        if(!isNaN(integerPart)) {
            el.value = new Intl.NumberFormat('id-ID').format(integerPart) + ',' + parts[1];
        }
        return; 
    }
    const num = parseFloat(valStr.replace(',','.'));
    if(!isNaN(num)) {
         el.value = new Intl.NumberFormat('id-ID').format(num);
    }
}

function setupSliderSync(sliderId, numberId) {
    const slider = document.getElementById(sliderId);
    const numberInput = document.getElementById(numberId);
    if (slider && numberInput) {
        slider.addEventListener('input', () => { numberInput.value = slider.value; updateTotalVariable(); });
        numberInput.addEventListener('input', () => {
            let val = parseFloat(numberInput.value);
            const max = parseFloat(slider.max);
            const min = parseFloat(slider.min);
            if (val > max) { val = max; numberInput.value = max; } 
            else if (val < min) { val = min; numberInput.value = min; }
            slider.value = val;
            updateTotalVariable();
        });
        numberInput.value = slider.value;
    }
}

function saveToImage() {
    // 1. Definisikan tombol Save dan Log Out
    const saveBtn = document.getElementById('saveImageBtn');
    const logoutBtn = document.querySelector('.marketplace-logout-button'); // Ambil tombol Log Out
    const captureArea = document.getElementById('captureArea'); 
    
    // 2. SEMBUNYIKAN KEDUA TOMBOL sebelum capture
    saveBtn.style.display = 'none'; 
    if (logoutBtn) logoutBtn.style.display = 'none'; // Sembunyikan Log Out
    
    const prodName = document.getElementById('productNameInput').value.trim().replace(/\s+/g, '_');
    const now = new Date();
    const timestamp = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
    
    let fileName = 'MarketplaceCalc-' + timestamp + '.png';
    if(prodName) fileName = 'Marketplace-' + prodName + '-' + timestamp + '.png';

    html2canvas(captureArea, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // 3. TAMPILKAN KEMBALI KEDUA TOMBOL setelah capture
        saveBtn.style.display = 'flex'; 
        if (logoutBtn) logoutBtn.style.display = 'flex'; // Tampilkan Log Out
    }).catch(err => {
        alert('Gagal menyimpan gambar.');
        
        // 4. TAMPILKAN KEMBALI KEDUA TOMBOL jika terjadi error
        saveBtn.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'flex'; // Tampilkan Log Out
    });
}

function updateTotalVariable() {
    const mpFee = parseFloat(document.getElementById('mpFeeRate')?.value) || 0;
    const adsBudget = parseFloat(document.getElementById('adsBudgetRate')?.value) || 0;
    const affiliateBudget = parseFloat(document.getElementById('affiliateBudgetRate')?.value) || 0;
    const operationalBudget = parseFloat(document.getElementById('operationalBudgetRate')?.value) || 0;
    const profitMargin = parseFloat(document.getElementById('profitMarginRate')?.value) || 0;

    const totalRate = mpFee + adsBudget + affiliateBudget + operationalBudget + profitMargin;
    const totalOutput = document.getElementById('totalVariableOutput');
    const calculateButton = document.getElementById('calculateButton');
    
    if (totalOutput) {
        totalOutput.textContent = `${totalRate.toFixed(1)}%`;
        if (totalRate >= 100) {
            totalOutput.style.color = '#d32f2f';
            if (calculateButton) { 
                calculateButton.disabled = true; 
                calculateButton.textContent = 'ERROR! Total Persentase > 100%'; 
                calculateButton.style.backgroundColor = '#d32f2f'; 
            }
        } else {
            totalOutput.style.color = '#4CAF50';
            if (calculateButton) { 
                calculateButton.disabled = false; 
                calculateButton.textContent = 'Kalkulasi'; 
                calculateButton.style.backgroundColor = '#4CAF50'; 
            }
        }
    }
}

function setRounding(value) {
    activeRounding = value;
    document.querySelectorAll('.round-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('round' + value).classList.add('active');
    calculateMarketplacePrice(false); 
}

function calculateMarketplacePrice(isInitialClick = false) {
    if (isInitialClick) {
        hasCalculated = true; 
    }

    if (!hasCalculated) return;

    const captureArea = document.getElementById('captureArea');
    captureArea.style.display = 'block';

    const now = new Date();
    const timeStr = String(now.getDate()).padStart(2,'0') + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + now.getFullYear() + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');
    document.getElementById('generatedTimestamp').textContent = 'Generated at: ' + timeStr;
    document.getElementById('generatedTimestamp').style.display = 'block';

    const prodName = document.getElementById('productNameInput').value;
    const prodOut = document.getElementById('productNameOutput');
    if(prodName) { prodOut.textContent = prodName; prodOut.style.display = 'block'; }
    else { prodOut.style.display = 'none'; }

    const modalPrice = getRawValue('modalPrice');
    const otherCost = getRawValue('otherCost');
    const actualPriceInput = getRawValue('actualPrice'); 
    
    const mpFeeRate = parseFloat(document.getElementById('mpFeeRate')?.value) / 100 || 0;
    const adsBudgetRate = parseFloat(document.getElementById('adsBudgetRate')?.value) / 100 || 0;
    const affiliateBudgetRate = parseFloat(document.getElementById('affiliateBudgetRate')?.value) / 100 || 0; 
    const operationalBudgetRate = parseFloat(document.getElementById('operationalBudgetRate')?.value) / 100 || 0;
    const profitMarginRate = parseFloat(document.getElementById('profitMarginRate')?.value) / 100 || 0;

    const minSellingPriceOutput = document.getElementById('minSellingPriceOutput');
    const sellingPriceLabel = document.getElementById('sellingPriceLabel'); 
    const profitAmountOutput = document.getElementById('profitAmountOutput');
    const calculateButton = document.getElementById('calculateButton');
    const saveBtn = document.getElementById('saveImageBtn');

    const totalRateFraction = mpFeeRate + adsBudgetRate + affiliateBudgetRate + operationalBudgetRate + profitMarginRate;

    if (totalRateFraction >= 1) {
        minSellingPriceOutput.textContent = "ERROR!";
        captureArea.style.display = 'none'; 
        saveBtn.style.display = 'none';
        return;
    }

    let calculatedBasePrice = modalPrice / (1 - totalRateFraction);
    if (activeRounding > 0) {
        calculatedBasePrice = Math.ceil(calculatedBasePrice / activeRounding) * activeRounding;
    }

    let finalSellingPrice = actualPriceInput > 0 ? actualPriceInput : calculatedBasePrice;

    if (actualPriceInput > 0) {
        sellingPriceLabel.textContent = "Harga Jual Aktual";
    } else {
        sellingPriceLabel.textContent = "Harga Jual Minimal";
    }

    const mpFeeAmount = finalSellingPrice * mpFeeRate;
    const adsAmount = finalSellingPrice * adsBudgetRate;
    const affiliateAmount = finalSellingPrice * affiliateBudgetRate;
    const operationalAmount = finalSellingPrice * operationalBudgetRate;
    
    const totalVariableCosts = mpFeeAmount + adsAmount + affiliateAmount + operationalAmount;
    const profitAmount = finalSellingPrice - modalPrice - otherCost - totalVariableCosts;
    const totalAllCosts = totalVariableCosts + otherCost;

    if (profitAmount < -1) {
        if (calculateButton) {
            calculateButton.textContent = "ERROR! Total Profit Margin < 0";
            calculateButton.style.backgroundColor = "#d32f2f";
        }
        saveBtn.style.display = 'none'; 
    } else {
        if (calculateButton) {
            calculateButton.textContent = "Kalkulasi";
            calculateButton.style.backgroundColor = "#4CAF50";
        }
        saveBtn.style.display = 'flex'; 
    }

    minSellingPriceOutput.textContent = formatCurrency(finalSellingPrice);
    document.getElementById('totalCostOutput').textContent = formatCurrency(totalAllCosts);
    document.getElementById('modalPriceOutput').textContent = formatCurrency(modalPrice);
    profitAmountOutput.textContent = formatCurrency(profitAmount);
    
    const priceStr = formatCurrency(finalSellingPrice);
    
    const updateRow = (id, formulaId, resId, amount, pct) => {
        const row = document.getElementById(id);
        if (amount > 0) {
            row.style.display = 'block';
            document.getElementById(formulaId).textContent = `${priceStr} x ${pct*100}%`;
            document.getElementById(resId).textContent = formatCurrency(amount);
        } else { row.style.display = 'none'; }
    };

    updateRow('rowDetailMP', 'detailFormulaMP', 'detailResultMP', mpFeeAmount, mpFeeRate);
    updateRow('rowDetailAds', 'detailFormulaAds', 'detailResultAds', adsAmount, adsBudgetRate);
    updateRow('rowDetailAff', 'detailFormulaAff', 'detailResultAff', affiliateAmount, affiliateBudgetRate);
    updateRow('rowDetailOps', 'detailFormulaOps', 'detailResultOps', operationalAmount, operationalBudgetRate);

    const rowOther = document.getElementById('rowDetailOther');
    if (otherCost > 0) {
        rowOther.style.display = 'block';
        document.getElementById('detailResultOther').textContent = formatCurrency(otherCost);
    } else { rowOther.style.display = 'none'; }

    const totalFixedAndNonAds = modalPrice + otherCost + (mpFeeAmount + affiliateAmount + operationalAmount);
    generateRoasSimulation(finalSellingPrice, totalFixedAndNonAds);
    
    triggerResizeSequence();
}

function generateRoasSimulation(sellingPrice, totalFixedAndNonAds) {
    const maxAdsBudgetBEP = sellingPrice - totalFixedAndNonAds;
    const roasBEP = maxAdsBudgetBEP > 0 ? sellingPrice / maxAdsBudgetBEP : 0; 
    const initialAdsRate = parseFloat(document.getElementById('adsBudgetRate')?.value) / 100 || 0;
    const plannedAdsBudget = sellingPrice * initialAdsRate; 
    const roasTarget = plannedAdsBudget > 0 ? (sellingPrice / plannedAdsBudget) : (roasBEP > 0 ? roasBEP * 2 : 0); 

    const scenarios = [
        { roas: roasTarget, statusLabel: 'Profit', rowClass: 'bg-target', cellClass: 'text-green fw-bold' },
        { roas: roasBEP > 0 ? roasBEP + ((roasTarget - roasBEP) / 2) : 0, statusLabel: 'Profit', rowClass: '', cellClass: 'text-green fw-bold' },
        { roas: roasBEP, statusLabel: 'BEP', rowClass: 'bg-bep', cellClass: '' },
        { roas: roasBEP * 0.8, statusLabel: 'Loss', rowClass: '', cellClass: 'text-red fw-bold' },
        { roas: roasBEP * 0.5, statusLabel: 'Loss', rowClass: 'bg-loss-severe', cellClass: 'text-red fw-bold' }
    ];

    const roasTableBody = document.getElementById('roasTableBody');
    roasTableBody.innerHTML = ''; 
    
    scenarios.forEach(item => {
        const currentRoas = item.roas;
        if (currentRoas <= 0) return; 

        const adsActual = sellingPrice / currentRoas;
        const profitActual = sellingPrice - totalFixedAndNonAds - adsActual;
        const profitPercentage = (profitActual / sellingPrice) * 100;
        
        let profitSign = '';
        if (profitActual > 50) profitSign = '+'; 
        
        let displayRoas = currentRoas >= 10 ? currentRoas.toFixed(0) : currentRoas.toFixed(1);
        if (displayRoas.endsWith('.0')) displayRoas = displayRoas.slice(0, -2);

        const row = roasTableBody.insertRow();
        row.className = item.rowClass;

        row.innerHTML = `
            <td class="fw-bold">${displayRoas}</td>
            <td class="fw-bold">${formatNumber(adsActual)}</td>
            <td class="${item.cellClass}">${formatNumber(profitActual)}</td>
            <td class="${item.cellClass}">${profitSign}${profitPercentage.toFixed(1)}%</td>
            <td class="${item.cellClass}">${item.statusLabel}</td>
        `;
    });
}

