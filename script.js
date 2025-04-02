// لیستی 200+ دراوی کریپتۆ
const cryptoList = {
    "BTC": "بیتکۆین",
    "ETH": "ئیسریەم",
    "BNB": "بینانس",
    "SOL": "سۆلانا",
    "XRP": "ڕیپڵ",
    "ADA": "کاردانۆ",
    "DOGE": "دۆجکۆین",
    "DOT": "پۆلکادات",
    "SHIB": "شیبا",
    "MATIC": "پۆلیگان",
    "AVAX": "ئاڤالانچ",
    "LINK": "چەینلینک",
    "ATOM": "کۆسمۆس",
    "UNI": "یونیسواپ",
    "LTC": "لایتکۆین",
    "ICP": "ئینتەرنێت کۆمپیوتەر",
    "FIL": "فایلکۆین",
    "XLM": "ستێلار",
    "ETC": "ئیسریەم کلاسیک",
    "XTZ": "تێزۆس",
    "ACT": "Achain",
    "PI": "پی (Pi Network)",
    "MLN": "مێلۆن",
    "VIN": "ڤینچەین",
    "THETA": "تیتا",
    "VET": "ڤێچەین",
    "AAVE": "ئەیڤ",
    "ALGO": "ئەلگۆراند",
    "MANA": "دێسنترالاند",
    "SAND": "ساندبۆکس",
    // 170+ دراوی تر...
};

// گۆڕاوە گشتییەکان
let priceChart = null;
let currentSymbol = "BTC";
let currentPrice = 0;
let notificationPermission = false;
let priceAlerts = [];
let lastPrice = 0;
let cryptoData = {};

// دەستپێکردنی ئەپ
function initApp() {
    populateCryptoSelect();
    loadCryptoData(currentSymbol);
    loadAlerts();
    checkNotificationPermission();
    
    // پشکنینی ئاگاداریەکان هەموو ١ خولەک جارێک
    setInterval(checkAlerts, 60000);
    
    // نوێکردنەوەی زانیاریەکان هەموو ٥ خولەک جارێک
    setInterval(() => loadCryptoData(currentSymbol, true), 300000);
}

// پڕکردنەوەی لیستی دراوەکان
function populateCryptoSelect() {
    const select = document.getElementById('crypto-select');
    select.innerHTML = '';
    
    // زیادکردنی ھەموو دراوەکان بۆ لیست
    for (const [symbol, name] of Object.entries(cryptoList)) {
        const option = document.createElement('option');
        option.value = symbol;
        option.textContent = `${name} (${symbol})`;
        select.appendChild(option);
    }
    
    // گوێگرتن لە گۆڕانکاری لە هەڵبژاردن
    select.addEventListener('change', (e) => {
        currentSymbol = e.target.value;
        loadCryptoData(currentSymbol);
    });
}

// گەڕان بەدوای دراو
function searchCrypto() {
    const searchTerm = document.getElementById('crypto-search').value.trim().toUpperCase();
    if (!searchTerm) return;
    
    // گەڕان بەپێی نیشانە
    if (cryptoList[searchTerm]) {
        currentSymbol = searchTerm;
        document.getElementById('crypto-select').value = searchTerm;
        loadCryptoData(searchTerm);
        return;
    }
    
    // گەڕان بەپێی ناو
    for (const [symbol, name] of Object.entries(cryptoList)) {
        if (name.includes(searchTerm)) {
            currentSymbol = symbol;
            document.getElementById('crypto-select').value = symbol;
            loadCryptoData(symbol);
            return;
        }
    }
    
    // ئەگەر دراوەکە نەدۆزرایەوە
    showAlert('دراوەکە نەدۆزرایەوە!', 'warning');
}

// نیشاندانی ئاگاداری
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '300px';
    alertDiv.role = 'alert';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // لابردنی ئاگاداریەکە دوای ٥ چرکە
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

// هێنانی زانیاری دراو
async function loadCryptoData(symbol, silent = false) {
    try {
        if (!silent) {
            document.getElementById('crypto-name').textContent = `${cryptoList[symbol]} (${symbol})`;
            document.getElementById('current-price').textContent = `بارکردن...`;
        }
        
        // هێنانی زانیاری لە APIی Binance
        const response = await axios.get(`https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1d&limit=30`);
        const prices = response.data.map(k => ({
            time: new Date(k[0]),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
        }));
        
        // پاشەکەوتکردنی زانیاریەکان
        cryptoData[symbol] = prices;
        lastPrice = currentPrice;
        currentPrice = prices[prices.length - 1].close;
        
        // نوێکردنەوەی چارت و پێشنیارەکان
        updateChart(prices, symbol);
        generateSignals(prices, symbol);
        
        // نیشاندانی گۆڕانکاری بە ئەنیمەیشن
        if (lastPrice > 0) {
            const priceElement = document.getElementById('current-price');
            if (currentPrice > lastPrice) {
                priceElement.classList.remove('price-down');
                priceElement.classList.add('price-up');
            } else if (currentPrice < lastPrice) {
                priceElement.classList.remove('price-up');
                priceElement.classList.add('price-down');
            }
            
            setTimeout(() => {
                priceElement.classList.remove('price-up', 'price-down');
            }, 3000);
        }
        
    } catch (error) {
        console.error("هەڵە لە هێنانی زانیاری:", error);
        if (!silent) {
            showAlert('هەڵە لە هێنانی زانیاری! تکایە دووبارە هەوڵ بدەرەوە', 'danger');
        }
    }
}

// دروستکردنی پێشنیاری کڕین و فرۆشتن
function generateSignals(prices, symbol) {
    const currentPrice = prices[prices.length - 1].close;
    const avgPrice = prices.reduce((sum, p) => sum + p.close, 0) / prices.length;
    const min30Day = Math.min(...prices.map(p => p.low));
    const max30Day = Math.max(...prices.map(p => p.high));
    const volatility = ((max30Day - min30Day) / avgPrice * 100).toFixed(2);
    
    // خەتە شین و سورەکان (ماوەی کورت و درێژ)
    const shortMA = calculateMA(prices, 7);
    const longMA = calculateMA(prices, 30);
    
    // پێشنیارەکان
    const buySignal = shouldBuy(prices, currentPrice, shortMA, longMA);
    const sellSignal = shouldSell(prices, currentPrice, shortMA, longMA);
    
    // نوێکردنەوەی UI
    updateUI({
        symbol,
        currentPrice,
        buyPrice: (avgPrice * 0.95).toFixed(4),
        sellPrice: (avgPrice * 1.05).toFixed(4),
        buySignal,
        sellSignal,
        min30Day,
        max30Day,
        volatility,
        shortMA,
        longMA
    });
}

// حسابکردنی خەتی مامناوەند
function calculateMA(prices, period) {
    const ma = [];
    for (let i = period - 1; i < prices.length; i++) {
        const sum = prices.slice(i - period + 1, i + 1).reduce((s, p) => s + p.close, 0);
        ma.push(sum / period);
    }
    return ma;
}

// پێشنیاری کڕین
function shouldBuy(prices, currentPrice, shortMA, longMA) {
    // ئەگەر خەتی شین (ماوەی کورت) لە سەرووی خەتی سور (ماوەی درێژ) بێت
    if (shortMA[shortMA.length - 1] > longMA[longMA.length - 1]) {
        // ئەگەر نرخی ئێستا نزیک بێت لە کەمترین نرخ
        const min30Day = Math.min(...prices.map(p => p.low));
        if (currentPrice <= min30Day * 1.05) {
            return {
                signal: true,
                reason: "خەتی شین لە سەرووی خەتی سورە و نرخ لە نزیک کەمترین ئاستە"
            };
        }
        
        // ئەگەر نرخ لە خوار مامناوەند بێت
        const avgPrice = prices.reduce((sum, p) => sum + p.close, 0) / prices.length;
        if (currentPrice <= avgPrice * 0.95) {
            return {
                signal: true,
                reason: "خەتی شین لە سەرووی خەتی سورە و نرخ لە خوار مامناوەندە"
            };
        }
    }
    
    return {
        signal: false,
        reason: "خەتی شین لە خوار خەتی سورە یان نرخ بەرزە"
    };
}

// پێشنیاری فرۆشتن
function shouldSell(prices, currentPrice, shortMA, longMA) {
    // ئەگەر خەتی شین (ماوەی کورت) لە خوار خەتی سور (ماوەی درێژ) بێت
    if (shortMA[shortMA.length - 1] < longMA[longMA.length - 1]) {
        // ئەگەر نرخی ئێستا نزیک بێت لە زۆرترین نرخ
        const max30Day = Math.max(...prices.map(p => p.high));
        if (currentPrice >= max30Day * 0.95) {
            return {
                signal: true,
                reason: "خەتی شین لە خوار خەتی سورە و نرخ لە نزیک زۆرترین ئاستە"
            };
        }
        
        // ئەگەر نرخ لە سەرووی مامناوەند بێت
        const avgPrice = prices.reduce((sum, p) => sum + p.close, 0) / prices.length;
        if (currentPrice >= avgPrice * 1.05) {
            return {
                signal: true,
                reason: "خەتی شین لە خوار خەتی سورە و نرخ لە سەرووی مامناوەندە"
            };
        }
    }
    
    return {
        signal: false,
        reason: "خەتی شین لە سەرووی خەتی سورە یان نرخ نزمە"
    };
}

// نوێکردنەوەی نیشاندەرەکان
function updateUI(data) {
    document.getElementById('current-price').textContent = `$${data.currentPrice.toFixed(4)}`;
    document.getElementById('min-price').textContent = `$${data.min30Day.toFixed(4)}`;
    document.getElementById('max-price').textContent = `$${data.max30Day.toFixed(4)}`;
    document.getElementById('volatility').textContent = `${data.volatility}%`;
    
    // پێشنیاری کڕین
    document.getElementById('buy-price').textContent = `$${data.buyPrice}`;
    document.getElementById('buy-signal').textContent = data.buySignal.signal ? "کڕین" : "چاوەڕوان بکە";
    document.getElementById('buy-reason').textContent = data.buySignal.reason;
    
    // پێشنیاری فرۆشتن
    document.getElementById('sell-price').textContent = `$${data.sellPrice}`;
    document.getElementById('sell-signal').textContent = data.sellSignal.signal ? "فرۆشتن" : "چاوەڕوان بکە";
    document.getElementById('sell-reason').textContent = data.sellSignal.reason;
    
    // نیشاندەری ڕێگا
    const trendElement = document.getElementById('trend-indicator');
    const trendExplanation = document.getElementById('trend-explanation');
    
    if (data.buySignal.signal) {
        trendElement.textContent = "هێمای کڕین ▲";
        trendElement.className = "badge trend-up fs-5 py-2 px-3";
        trendExplanation.textContent = "خەتی شین لە سەرووی خەتی سورە - نرخ لە ئاستی کڕینە";
    } else if (data.sellSignal.signal) {
        trendElement.textContent = "هێمای فرۆشتن ▼";
        trendElement.className = "badge trend-down fs-5 py-2 px-3";
        trendExplanation.textContent = "خەتی شین لە خوار خەتی سورە - نرخ لە ئاستی فرۆشتە";
    } else {
        trendElement.textContent = "بێ هێما";
        trendElement.className = "badge trend-neutral fs-5 py-2 px-3";
        trendExplanation.textContent = "خەتی شین و سور یەکتریان نەدەبڕن - چاوەڕوان بکە";
    }
}

// نوێکردنەوەی چارت
function updateChart(prices, symbol) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const labels = prices.map(p => p.time.toLocaleDateString());
    const closePrices = prices.map(p => p.close);
    
    // حسابکردنی خەتی شین و سور (ماوەی کورت و درێژ)
    const shortMA = calculateMA(prices, 7);
    const longMA = calculateMA(prices, 30);
    
    if (priceChart) priceChart.destroy();
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'نرخ',
                    data: closePrices,
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true,
                    pointRadius: 0
                },
                {
                    label: 'خەتی شین (ماوەی کورت - ٧ ڕۆژ)',
                    data: Array(prices.length - shortMA.length).fill(null).concat(shortMA),
                    borderColor: '#198754',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0
                },
                {
                    label: 'خەتی سور (ماوەی درێژ - ٣٠ ڕۆژ)',
                    data: Array(prices.length - longMA.length).fill(null).concat(longMA),
                    borderColor: '#dc3545',
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += `$${context.parsed.y.toFixed(4)}`;
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Tajawal',
                            size: 12
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return `$${value.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// چالاککردنی ئاگادارکردنەوە
function enableNotifications() {
    if (!('Notification' in window)) {
        showAlert('ئەم وێبگەڕە پاڵپشتی ئاگادارکردنەوە ناکات', 'warning');
        return;
    }
    
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            notificationPermission = true;
            document.getElementById('notification-btn').textContent = 'ئاگادارکردنەوە چالاکە';
            document.getElementById('notification-btn').classList.add('enabled');
            showAlert('ئاگادارکردنەوەکان چالاککران', 'success');
            
            // نیشاندانی ئاگاداری یەکەم
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification('ئاگادارکردنەوەکان چالاککران', {
                        body: 'ئێستا ئاگادار دەکرێیتەوە کاتێک نرخ گۆڕانکاری دەکات',
                        icon: 'icon.png',
                        vibrate: [200, 100, 200]
                    });
                });
            }
        } else {
            showAlert('ئاگادارکردنەوەکان ڕێگە نەدراوە', 'warning');
        }
    });
}

// پشکنینی ڕێگەدان بە ئاگادارکردنەوە
function checkNotificationPermission() {
    if (Notification.permission === 'granted') {
        notificationPermission = true;
        document.getElementById('notification-btn').textContent = 'ئاگادارکردنەوە چالاکە';
        document.getElementById('notification-btn').classList.add('enabled');
    }
}

// دانانی ئاگاداری کڕین
function setBuyAlert() {
    showAlertModal('کڕین');
}

// دانانی ئاگاداری فرۆشتن
function setSellAlert() {
    showAlertModal('فرۆشتن');
}

// نیشاندانی دیالۆگی ئاگاداری
function showAlertModal(type) {
    const modal = new bootstrap.Modal(document.getElementById('alertModal'));
    document.getElementById('alertModalTitle').textContent = `دانانی ئاگاداری ${type}`;
    document.getElementById('alert-price').placeholder = `نرخی ${type}`;
    modal.show();
}

// پاشەکەوتکردنی ئاگاداری
function saveAlert() {
    const price = parseFloat(document.getElementById('alert-price').value);
    if (isNaN(price)) {
        showAlert('تکایە نرخێکی دروست بنووسە', 'danger');
        return;
    }
    
    const active = document.getElementById('alert-active').checked;
    const type = document.getElementById('alertModalTitle').textContent.includes('کڕین') ? 'buy' : 'sell';
    
    priceAlerts.push({
        symbol: currentSymbol,
        price: price,
        type: type,
        active: active,
        triggered: false
    });
    
    saveAlerts();
    bootstrap.Modal.getInstance(document.getElementById('alertModal')).hide();
    showAlert('ئاگاداریەکە پاشەکەوتکرا!', 'success');
}

// پشکنینی ئاگاداریەکان
function checkAlerts() {
    if (!priceAlerts.length || !notificationPermission) return;
    
    priceAlerts.forEach(alert => {
        if (!alert.active || alert.triggered) return;
        
        if ((alert.type === 'buy' && currentPrice <= alert.price) || 
            (alert.type === 'sell' && currentPrice >= alert.price)) {
            showAlertNotification(alert);
            alert.triggered = true;
        }
    });
    
    // لابردنی ئاگاداریە تریگەرکراوەکان
    priceAlerts = priceAlerts.filter(alert => !alert.triggered);
    saveAlerts();
}

// نیشاندانی ئاگاداری
function showAlertNotification(alert) {
    const title = alert.type === 'buy' ? 'هێمای کڕین!' : 'هێمای فرۆشتن!';
    const body = `${cryptoList[alert.symbol]} (${alert.symbol}) گەیشتە $${currentPrice.toFixed(4)}`;
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
                body: body,
                icon: 'icon.png',
                vibrate: [200, 100, 200],
                data: { url: window.location.href }
            });
        });
    } else {
        new Notification(title, { body: body });
    }
    
    // نیشاندانی ئاگاداری لە وێبسایت
    showAlert(body, alert.type === 'buy' ? 'success' : 'danger');
}

// بارکردنی ئاگاداریەکان
function loadAlerts() {
    const savedAlerts = localStorage.getItem('cryptoAlerts');
    if (savedAlerts) {
        priceAlerts = JSON.parse(savedAlerts);
    }
}

// پاشەکەوتکردنی ئاگاداریەکان
function saveAlerts() {
    localStorage.setItem('cryptoAlerts', JSON.stringify(priceAlerts));
}

// دەستپێکردنی ئەپ کاتێک پەڕە بارکرا
document.addEventListener('DOMContentLoaded', initApp);

// گوێگرتن لە کلیک لەسەر ئاگاداریەکان
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'notificationClick') {
            window.focus();
        }
    });
}