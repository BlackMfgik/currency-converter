const CURRENCY_SYMBOLS = {
  $: "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₽": "RUB",
  "₣": "CHF",
  "₴": "UAH",
  "₺": "TRY",
  "₩": "KRW",
  "₹": "INR",
  "₿": "BTC",
  zł: "PLN",
  kr: "SEK",
  Kč: "CZK",
  USD: "USD",
  usd: "USD",
  EUR: "EUR",
  eur: "EUR",
  GBP: "GBP",
  gbp: "GBP",
  JPY: "JPY",
  jpy: "JPY",
  RUB: "RUB",
  rub: "RUB",
  CHF: "CHF",
  chf: "CHF",
  UAH: "UAH",
  uah: "UAH",
  TRY: "TRY",
  try: "TRY",
  KRW: "KRW",
  krw: "KRW",
  INR: "INR",
  inr: "INR",
  PLN: "PLN",
  pln: "PLN",
  SEK: "SEK",
  sek: "SEK",
  NOK: "NOK",
  nok: "NOK",
  DKK: "DKK",
  dkk: "DKK",
  CZK: "CZK",
  czk: "CZK",
  CAD: "CAD",
  cad: "CAD",
  AUD: "AUD",
  aud: "AUD",
  CNY: "CNY",
  cny: "CNY",
  BTC: "BTC",
  btc: "BTC",
  долар: "USD",
  долара: "USD",
  доларів: "USD",
  доларах: "USD",
  dollar: "USD",
  dollars: "USD",
  евро: "EUR",
  євро: "EUR",
  euro: "EUR",
  euros: "EUR",
  фунт: "GBP",
  фунта: "GBP",
  фунтів: "GBP",
  pound: "GBP",
  pounds: "GBP",
  єна: "JPY",
  єни: "JPY",
  yen: "JPY",
  франк: "CHF",
  франка: "CHF",
  franc: "CHF",
  francs: "CHF",
  гривня: "UAH",
  гривні: "UAH",
  гривень: "UAH",
  hryvnia: "UAH",
  злотий: "PLN",
  злотих: "PLN",
  zloty: "PLN",
  крона: "SEK",
  крони: "SEK",
  kronor: "SEK",
  юань: "CNY",
  юаня: "CNY",
  yuan: "CNY",
  рупія: "INR",
  rupee: "INR",
  rupees: "INR",
  біткоін: "BTC",
  bitcoin: "BTC",
};

const CURRENCY_FLAGS = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  RUB: "🏴",
  CHF: "🇨🇭",
  UAH: "🇺🇦",
  TRY: "🇹🇷",
  KRW: "🇰🇷",
  INR: "🇮🇳",
  PLN: "🇵🇱",
  SEK: "🇸🇪",
  NOK: "🇳🇴",
  DKK: "🇩🇰",
  CZK: "🇨🇿",
  CAD: "🇨🇦",
  AUD: "🇦🇺",
  CNY: "🇨🇳",
  BTC: "₿",
};

const TARGET_CURRENCY_NAMES = {
  UAH: { label: "₴", name: "Гривні", flag: "🇺🇦" },
  USD: { label: "$", name: "Долари", flag: "🇺🇸" },
  RUB: { label: "₽", name: "Дерев'яні", flag: "🪵" },
};

let targetCurrency = "UAH";
chrome.storage.local.get("targetCurrency", (data) => {
  if (data.targetCurrency) targetCurrency = data.targetCurrency;
});
chrome.storage.onChanged.addListener((changes) => {
  if (changes.targetCurrency) targetCurrency = changes.targetCurrency.newValue;
});

let exchangeRatesCache = {};
let lastFetchTimestamp = 0;
const RATES_CACHE_DURATION = 60 * 60 * 1000;
let activePopup = null;
let autoCloseTimeout = null;

function parseSelectedText(text) {
  text = text.trim();
  if (!text || text.length > 200) return null;
  const normalized = text.replace(/\s+/g, " ");
  const patterns = [
    /^([€$£¥₽₣₴₺₩₹₿]|zł|kr|Kč)\s*([\d\s.,]+)$/i,
    /^([A-Z]{3}|usd|eur|gbp|jpy|rub|chf|uah|try|krw|inr|pln|sek|nok|dkk|czk|cad|aud|cny|btc)\s+([\d\s.,]+)$/i,
    /^([\d\s.,]+)\s*([€$£¥₽₣₴₺₩₹₿]|zł|kr|Kč|[A-Z]{3}|usd|eur|gbp|jpy|rub|chf|uah|try|krw|inr|pln|sek|nok|dkk|czk|cad|aud|cny|btc)$/i,
    /^([\d\s.,]+)\s+([а-яіїєґА-ЯІЇЄҐA-Za-z]+)$/,
    /^([€$£¥₽₣₴₺₩₹₿]|zł|kr|Kč|[A-Z]{2,3}|[а-яіїєґА-ЯІЇЄҐ]+)$/,
  ];
  for (let i = 0; i < patterns.length; i++) {
    const match = normalized.match(patterns[i]);
    if (!match) continue;
    let amountStr, currencyKey;
    if (i <= 1) {
      currencyKey = match[1];
      amountStr = match[2];
    } else if (i <= 3) {
      amountStr = match[1];
      currencyKey = match[2];
    } else {
      currencyKey = match[1];
      amountStr = "1";
    }
    const numStr = (amountStr || "1").replace(/\s/g, "");
    let amount;
    if (numStr.lastIndexOf(".") > numStr.lastIndexOf(",")) {
      amount = parseFloat(numStr.replace(/,/g, ""));
    } else {
      amount = parseFloat(numStr.replace(/\./g, "").replace(",", "."));
    }
    if (isNaN(amount) || amount <= 0) return null;
    const currency =
      CURRENCY_SYMBOLS[currencyKey] ||
      CURRENCY_SYMBOLS[currencyKey.toLowerCase()];
    if (!currency) return null;
    return { amount, currency };
  }
  return null;
}

async function fetchExchangeRates() {
  const now = Date.now();
  if (
    exchangeRatesCache._base &&
    now - lastFetchTimestamp < RATES_CACHE_DURATION
  ) {
    return exchangeRatesCache;
  }

  const rateSources = [
    async () => {
      const response = await fetch(
        "https://api.frankfurter.app/latest?from=EUR",
      );
      if (!response.ok) throw new Error(response.status);
      const data = await response.json();
      return { rates: data.rates, date: data.date };
    },
    async () => {
      const response = await fetch("https://open.er-api.com/v6/latest/EUR");
      if (!response.ok) throw new Error(response.status);
      const data = await response.json();
      return {
        rates: data.rates,
        date: (data.time_last_update_utc || "").slice(0, 10),
      };
    },
    async () => {
      const response = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json",
      );
      if (!response.ok) throw new Error(response.status);
      const data = await response.json();
      const sourceRates = data.eur;
      const codeMap = {
        uah: "UAH",
        usd: "USD",
        gbp: "GBP",
        jpy: "JPY",
        rub: "RUB",
        chf: "CHF",
        try: "TRY",
        krw: "KRW",
        inr: "INR",
        pln: "PLN",
        sek: "SEK",
        nok: "NOK",
        dkk: "DKK",
        czk: "CZK",
        cad: "CAD",
        aud: "AUD",
        cny: "CNY",
      };
      const rates = {};
      for (const [key, code] of Object.entries(codeMap)) {
        if (sourceRates[key]) rates[code] = sourceRates[key];
      }
      return { rates, date: data.date || "" };
    },
  ];

  for (const fetchRates of rateSources) {
    try {
      const { rates, date } = await fetchRates();
      if (rates && rates["UAH"]) {
        exchangeRatesCache = { ...rates, _base: "EUR", _date: date };
        lastFetchTimestamp = now;
        return exchangeRatesCache;
      }
    } catch (_) {}
  }
  return null;
}

async function convertToTarget(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  const rates = await fetchExchangeRates();
  if (!rates) return null;
  let amountInEur;
  if (fromCurrency === "EUR") {
    amountInEur = amount;
  } else {
    const sourceRate = rates[fromCurrency];
    if (!sourceRate) return null;
    amountInEur = amount / sourceRate;
  }
  if (toCurrency === "EUR") return amountInEur;
  const targetRate = rates[toCurrency];
  if (!targetRate) return null;
  return amountInEur * targetRate;
}

function getSelectionPosition() {
  try {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    return { x: rect.right, y: rect.bottom };
  } catch (_) {
    return null;
  }
}

function closePopup() {
  clearTimeout(autoCloseTimeout);
  if (activePopup) {
    activePopup.classList.remove("popup-visible");
    const popupToRemove = activePopup;
    setTimeout(() => {
      if (popupToRemove.parentNode)
        popupToRemove.parentNode.removeChild(popupToRemove);
    }, 180);
    activePopup = null;
  }
}

function repositionPopup(anchorX, anchorY) {
  if (!activePopup) return;
  const popupWidth = activePopup.offsetWidth || 200;
  const popupHeight = activePopup.offsetHeight || 72;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let left = anchorX + 6;
  let top = anchorY + 6;
  if (left + popupWidth > viewportWidth - 8) left = anchorX - popupWidth - 6;
  if (left < 8) left = 8;
  if (top + popupHeight > viewportHeight - 8) top = anchorY - popupHeight - 6;
  if (top < 8) top = 8;
  activePopup.style.left = left + "px";
  activePopup.style.top = top + "px";
}

function openPopup(anchorX, anchorY, htmlContent) {
  closePopup();
  activePopup = document.createElement("div");
  activePopup.id = "currency-popup";
  activePopup.innerHTML = htmlContent;
  document.body.appendChild(activePopup);
  repositionPopup(anchorX, anchorY);
  requestAnimationFrame(
    () => activePopup && activePopup.classList.add("popup-visible"),
  );
  activePopup
    .querySelector(".popup-close-btn")
    ?.addEventListener("click", closePopup);
  clearTimeout(autoCloseTimeout);
  autoCloseTimeout = setTimeout(closePopup, 7000);
}

const formatAmount = (number, currency) => {
  const decimals =
    currency === "JPY" || currency === "KRW" ? 0 : currency === "BTC" ? 6 : 2;
  return new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

function buildPopupHTML(flag, currency, amount, convertedAmount, target) {
  const targetInfo =
    TARGET_CURRENCY_NAMES[target] || TARGET_CURRENCY_NAMES["UAH"];
  const formattedConverted =
    convertedAmount !== null
      ? new Intl.NumberFormat("uk-UA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(convertedAmount)
      : "…";

  const options = Object.entries(TARGET_CURRENCY_NAMES)
    .map(
      ([code, info]) =>
        `<option value="${code}" ${code === target ? "selected" : ""}>${info.flag} ${info.name}</option>`,
    )
    .join("");

  return `
    <div class="popup-row">
      <span>${flag}</span>
      <div class="popup-content">
        <div class="popup-source-amount">${formatAmount(amount, currency)} ${currency} →</div>
        <div class="popup-converted-amount">${formattedConverted} ${targetInfo.label}</div>
      </div>
      <button class="popup-close-btn">✕</button>
    </div>
    <div class="popup-currency-bar">
      <span class="popup-currency-label">Конвертувати в</span>
      <div class="popup-select-wrap">
        <select class="popup-currency-select">${options}</select>
      </div>
    </div>
  `;
}

function bindSelectChange(popup, flag, currency, amount, anchorX, anchorY) {
  popup
    .querySelector(".popup-currency-select")
    ?.addEventListener("change", async (e) => {
      const newTarget = e.target.value;
      targetCurrency = newTarget;
      chrome.storage.local.set({ targetCurrency: newTarget });
      const newConverted = await convertToTarget(amount, currency, newTarget);
      if (!activePopup) return;
      activePopup.innerHTML = buildPopupHTML(
        flag,
        currency,
        amount,
        newConverted,
        newTarget,
      );
      activePopup
        .querySelector(".popup-close-btn")
        ?.addEventListener("click", closePopup);
      bindSelectChange(activePopup, flag, currency, amount, anchorX, anchorY);
      repositionPopup(anchorX, anchorY);
      clearTimeout(autoCloseTimeout);
      autoCloseTimeout = setTimeout(closePopup, 7000);
    });
}

async function showConversionPopup(parsed, anchorX, anchorY) {
  const { amount, currency } = parsed;
  const flag = CURRENCY_FLAGS[currency] || "💱";
  const target = targetCurrency || "UAH";

  openPopup(
    anchorX,
    anchorY,
    `<div class="popup-row">
      <span>${flag}</span>
      <span class="popup-source-amount">${formatAmount(amount, currency)} ${currency}</span>
      <button class="popup-close-btn">✕</button>
    </div>
    <div class="popup-loading"><div class="popup-spinner"></div></div>`,
  );

  const convertedAmount = await convertToTarget(amount, currency, target);

  if (!activePopup) return;

  if (convertedAmount === null) {
    activePopup.querySelector(".popup-loading").innerHTML =
      `<span class="popup-error-message">❌ Немає курсу. Перевір інтернет.</span>`;
    return;
  }

  activePopup.innerHTML = buildPopupHTML(
    flag,
    currency,
    amount,
    convertedAmount,
    target,
  );
  activePopup
    .querySelector(".popup-close-btn")
    ?.addEventListener("click", closePopup);

  bindSelectChange(activePopup, flag, currency, amount, anchorX, anchorY);
  repositionPopup(anchorX, anchorY);
}

document.addEventListener("mouseup", async (e) => {
  if (activePopup && activePopup.contains(e.target)) return;
  setTimeout(async () => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";
    if (!selectedText || selectedText.length > 150) {
      closePopup();
      return;
    }
    const parsed = parseSelectedText(selectedText);
    if (!parsed) {
      closePopup();
      return;
    }
    const position = getSelectionPosition() || { x: e.clientX, y: e.clientY };
    await showConversionPopup(parsed, position.x, position.y);
  }, 30);
});

document.addEventListener("mousedown", (e) => {
  if (activePopup && !activePopup.contains(e.target)) closePopup();
});

document.addEventListener(
  "scroll",
  () => {
    if (activePopup) closePopup();
  },
  { passive: true },
);
