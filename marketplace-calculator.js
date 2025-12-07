function formatCurrency(number) {
    if (isNaN(number) || number === null || number === undefined) {
        return 'Rp 0';
    }
    const roundedNumber = Math.round(number);
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(roundedNumber);
}

function formatModalPrice(inputElement) {
    let value = inputElement.value.replace(/\D/g, ''); 
    
    if (value) {
        const numberValue = parseInt(value, 10);
        inputElement.value = new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0
        }).format(numberValue);
    } else {
        inputElement.value = '';
    }
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
                calculateButton.textContent = 'ERROR! Total Persentase Melebihi 100%';
            }
        } else {
            totalOutput.style.color = '#4CAF50';
            if (calculateButton) {
                calculateButton.disabled = false;
                calculateButton.textContent = 'Kalkulasi';
            }
        }
    }
}

function calculateMarketplacePrice() {
    const modalInput = document.getElementById('modalPrice');
    
    const rawModalPrice = modalInput?.value.replace(/\./g, '') || '0';
    const modalPrice = parseFloat(rawModalPrice) || 0; 
    
    const mpFeeRate = parseFloat(document.getElementById('mpFeeRate')?.value) / 100 || 0;
    const adsBudgetRate = parseFloat(document.getElementById('adsBudgetRate')?.value) / 100 || 0;
    const affiliateBudgetRate = parseFloat(document.getElementById('affiliateBudgetRate')?.value) / 100 || 0; 
    const operationalBudgetRate = parseFloat(document.getElementById('operationalBudgetRate')?.value) / 100 || 0;
    const profitMarginRate = parseFloat(document.getElementById('profitMarginRate')?.value) / 100 || 0;

    const minSellingPriceOutput = document.getElementById('minSellingPriceOutput');
    const profitAmountOutput = document.getElementById('profitAmountOutput');
    const mpFeeAmountOutput = document.getElementById('mpFeeAmountOutput');
    const adsAmountOutput = document.getElementById('adsAmountOutput');
    const affiliateAmountOutput = document.getElementById('affiliateAmountOutput');
    const operationalAmountOutput = document.getElementById('operationalAmountOutput');
    const modalPriceOutput = document.getElementById('modalPriceOutput');

    if (!minSellingPriceOutput || !profitAmountOutput || !mpFeeAmountOutput || !adsAmountOutput || !affiliateAmountOutput || !operationalAmountOutput || !modalPriceOutput) { 
        return; 
    }
    
    const totalRateFraction = mpFeeRate + adsBudgetRate + affiliateBudgetRate + operationalBudgetRate + profitMarginRate;

    if (totalRateFraction >= 1) {
        minSellingPriceOutput.textContent = "ERROR!";
        profitAmountOutput.textContent = formatCurrency(0);
        mpFeeAmountOutput.textContent = formatCurrency(0);
        adsAmountOutput.textContent = formatCurrency(0);
        affiliateAmountOutput.textContent = formatCurrency(0);
        operationalAmountOutput.textContent = formatCurrency(0);
        modalPriceOutput.textContent = formatCurrency(modalPrice); 
        return;
    }

    const minSellingPrice = modalPrice / (1 - totalRateFraction);
    
    const profitAmount = minSellingPrice * profitMarginRate;
    const mpFeeAmount = minSellingPrice * mpFeeRate;
    const adsAmount = minSellingPrice * adsBudgetRate;
    const affiliateAmount = minSellingPrice * affiliateBudgetRate;
    const operationalAmount = minSellingPrice * operationalBudgetRate;

    minSellingPriceOutput.textContent = formatCurrency(minSellingPrice);
    profitAmountOutput.textContent = formatCurrency(profitAmount);
    mpFeeAmountOutput.textContent = formatCurrency(mpFeeAmount);
    adsAmountOutput.textContent = formatCurrency(adsAmount);
    affiliateAmountOutput.textContent = formatCurrency(affiliateAmount);
    operationalAmountOutput.textContent = formatCurrency(operationalAmount);
    modalPriceOutput.textContent = formatCurrency(modalPrice);
}


function setupSliderSync(sliderId, numberId) {
    const slider = document.getElementById(sliderId);
    const numberInput = document.getElementById(numberId);

    if (slider && numberInput) {
        slider.addEventListener('input', () => {
            numberInput.value = slider.value;
            updateTotalVariable();
        });

        numberInput.addEventListener('input', () => {
            let val = parseFloat(numberInput.value);
            const max = parseFloat(slider.max);
            const min = parseFloat(slider.min);
            
            if (val > max) {
                val = max;
                numberInput.value = max;
            } else if (val < min) {
                val = min;
                numberInput.value = min;
            }
            slider.value = val;
            updateTotalVariable();
        });
        
        numberInput.value = slider.value;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    const modalInput = document.getElementById('modalPrice');
    if (modalInput) {
        modalInput.addEventListener('input', function() {
            formatModalPrice(this);
        });
        formatModalPrice(modalInput); 
    }

    setupSliderSync('mpFeeRateSlider', 'mpFeeRate');
    setupSliderSync('adsBudgetRateSlider', 'adsBudgetRate');
    setupSliderSync('affiliateBudgetRateSlider', 'affiliateBudgetRate'); 
    setupSliderSync('operationalBudgetRateSlider', 'operationalBudgetRate');
    setupSliderSync('profitMarginRateSlider', 'profitMarginRate');
    
    const calculateButton = document.getElementById('calculateButton');
    
    if (calculateButton) {
        calculateButton.addEventListener('click', calculateMarketplacePrice);
    }
    
    updateTotalVariable();
    calculateMarketplacePrice();
});
