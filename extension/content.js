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

const MODAL_CURRENCIES = [
  { value: "USD", flag: "🇺🇸", code: "USD", name: "Долар США" },
  { value: "EUR", flag: "🇪🇺", code: "EUR", name: "Євро" },
  { value: "GBP", flag: "🇬🇧", code: "GBP", name: "Фунт" },
  { value: "JPY", flag: "🇯🇵", code: "JPY", name: "Єна" },
  { value: "CHF", flag: "🇨🇭", code: "CHF", name: "Франк" },
  { value: "UAH", flag: "🇺🇦", code: "UAH", name: "Гривня" },
  { value: "RUB", flag: "🏴", code: "RUB", name: "Рубль" },
  { value: "PLN", flag: "🇵🇱", code: "PLN", name: "Злотий" },
  { value: "CZK", flag: "🇨🇿", code: "CZK", name: "Крона" },
  { value: "CAD", flag: "🇨🇦", code: "CAD", name: "Канад. долар" },
  { value: "AUD", flag: "🇦🇺", code: "AUD", name: "Австр. долар" },
  { value: "CNY", flag: "🇨🇳", code: "CNY", name: "Юань" },
  { value: "KRW", flag: "🇰🇷", code: "KRW", name: "Вона" },
  { value: "INR", flag: "🇮🇳", code: "INR", name: "Рупія" },
  { value: "TRY", flag: "🇹🇷", code: "TRY", name: "Ліра" },
  { value: "NOK", flag: "🇳🇴", code: "NOK", name: "Норв. крона" },
  { value: "SEK", flag: "🇸🇪", code: "SEK", name: "Швед. крона" },
];

let targetCurrency = "UAH";
chrome.storage.local.get("targetCurrency", (data) => {
  if (data.targetCurrency) targetCurrency = data.targetCurrency;
});
chrome.storage.onChanged.addListener((changes) => {
  if (changes.targetCurrency) targetCurrency = changes.targetCurrency.newValue;
});

let ratesCache = null;
let ratesCacheTime = 0;

async function fetchRates() {
  if (ratesCache && Date.now() - ratesCacheTime < 3_600_000) return ratesCache;

  const sources = [
    async () => {
      const r = await fetch("https://api.frankfurter.app/latest?from=EUR");
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      return { rates: d.rates, date: d.date };
    },
    async () => {
      const r = await fetch("https://open.er-api.com/v6/latest/EUR");
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      return {
        rates: d.rates,
        date: (d.time_last_update_utc || "").slice(0, 10),
      };
    },
    async () => {
      const r = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json",
      );
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      const map = {
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
      for (const [k, v] of Object.entries(map))
        if (d.eur[k]) rates[v] = d.eur[k];
      return { rates, date: d.date || "" };
    },
  ];

  for (const source of sources) {
    try {
      const { rates, date } = await source();
      if (rates?.UAH) {
        ratesCache = { ...rates, EUR: 1, _date: date };
        ratesCacheTime = Date.now();
        return ratesCache;
      }
    } catch (_) {}
  }
  return null;
}

function convertAmount(amount, from, to, rates) {
  if (from === to) return amount;
  const inEur =
    from === "EUR" ? amount : rates[from] ? amount / rates[from] : null;
  if (inEur === null) return null;
  if (to === "EUR") return inEur;
  return rates[to] ? inEur * rates[to] : null;
}

function formatAmount(n, currency) {
  const d =
    currency === "JPY" || currency === "KRW" ? 0 : currency === "BTC" ? 6 : 2;
  return new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);
}

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
    const amount =
      numStr.lastIndexOf(".") > numStr.lastIndexOf(",")
        ? parseFloat(numStr.replace(/,/g, ""))
        : parseFloat(numStr.replace(/\./g, "").replace(",", "."));
    if (isNaN(amount) || amount <= 0) return null;
    const currency =
      CURRENCY_SYMBOLS[currencyKey] ||
      CURRENCY_SYMBOLS[currencyKey.toLowerCase()];
    if (!currency) return null;
    return { amount, currency };
  }
  return null;
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
  if (!activePopup) return;
  activePopup.classList.remove("popup-visible");
  const el = activePopup;
  setTimeout(() => el.parentNode?.removeChild(el), 180);
  activePopup = null;
}

function repositionPopup(anchorX, anchorY) {
  if (!activePopup) return;
  const pw = activePopup.offsetWidth || 200;
  const ph = activePopup.offsetHeight || 72;
  const vw = window.innerWidth,
    vh = window.innerHeight;
  const sx = window.scrollX || window.pageXOffset;
  const sy = window.scrollY || window.pageYOffset;
  let left = anchorX + 6,
    top = anchorY + 6;
  if (left + pw > vw - 8) left = anchorX - pw - 6;
  if (left < 8) left = 8;
  if (top + ph > vh - 8) top = anchorY - ph - 6;
  if (top < 8) top = 8;
  activePopup.style.left = left + sx + "px";
  activePopup.style.top = top + sy + "px";
}

function openPopup(anchorX, anchorY, html) {
  closePopup();
  activePopup = document.createElement("div");
  activePopup.id = "currency-popup";
  activePopup.innerHTML = html;
  document.body.appendChild(activePopup);
  repositionPopup(anchorX, anchorY);
  requestAnimationFrame(() => activePopup?.classList.add("popup-visible"));
  activePopup
    .querySelector(".popup-close-btn")
    ?.addEventListener("click", closePopup);
  clearTimeout(autoCloseTimeout);
  autoCloseTimeout = setTimeout(closePopup, 7000);
}

function buildPopupHTML(flag, currency, amount, convertedAmount, target) {
  const targetInfo =
    TARGET_CURRENCY_NAMES[target] || TARGET_CURRENCY_NAMES["UAH"];
  const formatted =
    convertedAmount !== null ? formatAmount(convertedAmount, target) : "…";
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
        <div class="popup-converted-amount">${formatted} ${targetInfo.label}</div>
      </div>
      <button class="popup-close-btn">✕</button>
    </div>
    <div class="popup-currency-bar">
      <span class="popup-currency-label">Конвертувати в</span>
      <div class="popup-select-wrap">
        <select class="popup-currency-select">${options}</select>
      </div>
    </div>`;
}

function bindSelectChange(popup, flag, currency, amount, anchorX, anchorY) {
  popup
    .querySelector(".popup-currency-select")
    ?.addEventListener("change", async (e) => {
      const newTarget = e.target.value;
      targetCurrency = newTarget;
      chrome.storage.local.set({ targetCurrency: newTarget });
      const rates = await fetchRates();
      const newConverted = rates
        ? convertAmount(amount, currency, newTarget, rates)
        : null;
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
    `
    <div class="popup-row">
      <span>${flag}</span>
      <span class="popup-source-amount">${formatAmount(amount, currency)} ${currency}</span>
      <button class="popup-close-btn">✕</button>
    </div>
    <div class="popup-loading"><div class="popup-spinner"></div></div>`,
  );

  const rates = await fetchRates();
  if (!activePopup) return;

  if (!rates) {
    activePopup.querySelector(".popup-loading").innerHTML =
      `<span class="popup-error-message">❌ Немає курсу. Перевір інтернет.</span>`;
    return;
  }

  const convertedAmount = convertAmount(amount, currency, target, rates);
  if (convertedAmount === null) {
    activePopup.querySelector(".popup-loading").innerHTML =
      `<span class="popup-error-message">❌ Невідома валюта.</span>`;
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
  if (activePopup?.contains(e.target)) return;
  setTimeout(async () => {
    if (document.getElementById("cv-modal-overlay")) return;
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() ?? "";
    if (!selectedText || selectedText.length > 150) {
      closePopup();
      return;
    }
    const parsed = parseSelectedText(selectedText);
    if (!parsed) {
      closePopup();
      return;
    }
    const pos = getSelectionPosition() || { x: e.clientX, y: e.clientY };
    await showConversionPopup(parsed, pos.x, pos.y);
  }, 30);
});

document.addEventListener("mousedown", (e) => {
  if (activePopup && !activePopup.contains(e.target)) closePopup();
});

function createDropdown(initialValue, onChange) {
  const cur =
    MODAL_CURRENCIES.find((c) => c.value === initialValue) ||
    MODAL_CURRENCIES[0];
  const wrap = document.createElement("div");
  wrap.className = "cv-dropdown";

  const btn = document.createElement("button");
  btn.className = "cv-dropdown-btn";
  btn.innerHTML = `<span>${cur.flag} <b>${cur.code}</b> — ${cur.name}</span><span class="arrow">▾</span>`;

  const list = document.createElement("div");
  list.className = "cv-dropdown-list";
  list.innerHTML = MODAL_CURRENCIES.map(
    (c) => `
    <div class="cv-dropdown-item ${c.value === initialValue ? "selected" : ""}" data-value="${c.value}">
      <span class="item-flag">${c.flag}</span>
      <span class="item-code">${c.code}</span>
      <span class="item-name">${c.name}</span>
    </div>`,
  ).join("");

  wrap.appendChild(btn);
  wrap.appendChild(list);

  let currentValue = initialValue;
  function getValue() {
    return currentValue;
  }
  function setValue(val) {
    const c = MODAL_CURRENCIES.find((x) => x.value === val);
    if (!c) return;
    currentValue = val;
    btn.innerHTML = `<span>${c.flag} <b>${c.code}</b> — ${c.name}</span><span class="arrow">▾</span>`;
    list
      .querySelectorAll(".cv-dropdown-item")
      .forEach((el) =>
        el.classList.toggle("selected", el.dataset.value === val),
      );
  }

  function openList() {
    const btnRect = btn.getBoundingClientRect();
    list.style.width = wrap.offsetWidth + "px";
    const spaceBelow = window.innerHeight - btnRect.bottom;
    if (spaceBelow < 210) {
      list.style.bottom = wrap.offsetHeight + 4 + "px";
      list.style.top = "auto";
    } else {
      list.style.top = btn.offsetHeight + 4 + "px";
      list.style.bottom = "auto";
    }
    list.classList.add("open");
    btn.classList.add("open");
  }
  function closeList() {
    list.classList.remove("open");
    btn.classList.remove("open");
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = list.classList.contains("open");
    document
      .querySelectorAll(".cv-dropdown-list.open")
      .forEach((l) => l.classList.remove("open"));
    document
      .querySelectorAll(".cv-dropdown-btn.open")
      .forEach((b) => b.classList.remove("open"));
    if (!isOpen) openList();
  });

  list.addEventListener("click", (e) => {
    const item = e.target.closest(".cv-dropdown-item");
    if (!item) return;
    setValue(item.dataset.value);
    closeList();
    onChange(currentValue);
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) closeList();
  });

  return { el: wrap, getValue, setValue };
}

let modalDebounce = null;

function openConverterModal(
  prefillAmount = "",
  anchorX = null,
  anchorY = null,
) {
  if (document.getElementById("cv-modal-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "cv-modal-overlay";
  overlay.innerHTML = `
    <div id="cv-modal">
      <div class="cv-header">
        <span class="cv-title">💱 Currency Converter</span>
        <button class="cv-close">✕</button>
      </div>
      <div class="cv-grid">
        <div class="cv-col" id="cv-col-from">
          <input class="cv-input" id="cv-amount" type="number" placeholder="100" value="${prefillAmount}" />
        </div>
        <div class="cv-col" id="cv-col-to">
          <input class="cv-input cv-result" id="cv-result" readonly placeholder="…" />
        </div>
      </div>
      <div class="cv-swap-row">
        <button class="cv-swap-btn">⇄ поміняти</button>
      </div>
      <div class="cv-rate" id="cv-rate"></div>
    </div>`;

  document.body.appendChild(overlay);

  let fromValue = "USD",
    toValue = "UAH";

  const fromDropdown = createDropdown(fromValue, (val) => {
    fromValue = val;
    chrome.storage.local.set({ cvFrom: val });
    runConvert();
  });
  const toDropdown = createDropdown(toValue, (val) => {
    toValue = val;
    chrome.storage.local.set({ cvTo: val });
    runConvert();
  });

  overlay
    .querySelector("#cv-col-from")
    .insertBefore(fromDropdown.el, overlay.querySelector("#cv-amount"));
  overlay
    .querySelector("#cv-col-to")
    .insertBefore(toDropdown.el, overlay.querySelector("#cv-result"));

  chrome.storage.local.get(["cvFrom", "cvTo"], (data) => {
    if (data.cvFrom) {
      fromValue = data.cvFrom;
      fromDropdown.setValue(data.cvFrom);
    }
    if (data.cvTo) {
      toValue = data.cvTo;
      toDropdown.setValue(data.cvTo);
    }
    if (prefillAmount) runConvert();
  });

  const modal = overlay.querySelector("#cv-modal");
  const vw = window.innerWidth,
    vh = window.innerHeight;
  let x = anchorX !== null ? anchorX + 8 : vw / 2 - 150;
  let y = anchorY !== null ? anchorY + 8 : vh / 2 - 120;
  if (x + 300 > vw - 8) x = (anchorX ?? vw) - 308;
  if (y + 240 > vh - 8) y = (anchorY ?? vh) - 248;
  if (x < 8) x = 8;
  if (y < 8) y = 8;
  modal.style.left = x + "px";
  modal.style.top = y + "px";

  let isDragging = false,
    dragOffsetX = 0,
    dragOffsetY = 0;
  const header = modal.querySelector(".cv-header");
  header.style.cursor = "grab";
  header.addEventListener("mousedown", (e) => {
    if (e.target.closest(".cv-close")) return;
    isDragging = true;
    dragOffsetX = e.clientX - modal.getBoundingClientRect().left;
    dragOffsetY = e.clientY - modal.getBoundingClientRect().top;
    header.style.cursor = "grabbing";
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    modal.style.left =
      Math.max(
        0,
        Math.min(
          e.clientX - dragOffsetX,
          window.innerWidth - modal.offsetWidth,
        ),
      ) + "px";
    modal.style.top =
      Math.max(
        0,
        Math.min(
          e.clientY - dragOffsetY,
          window.innerHeight - modal.offsetHeight,
        ),
      ) + "px";
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
    header.style.cursor = "grab";
  });

  requestAnimationFrame(() => overlay.classList.add("cv-visible"));

  const amountEl = overlay.querySelector("#cv-amount");
  const resultEl = overlay.querySelector("#cv-result");
  const rateEl = overlay.querySelector("#cv-rate");

  async function runConvert() {
    const amount = parseFloat(amountEl.value);
    if (!amountEl.value || isNaN(amount) || amount <= 0) {
      resultEl.value = "";
      rateEl.textContent = "";
      return;
    }
    resultEl.value = "…";
    rateEl.textContent = "Завантаження…";
    const rates = await fetchRates();
    if (!rates) {
      resultEl.value = "❌";
      rateEl.textContent = "Немає з'єднання";
      return;
    }
    const converted = convertAmount(amount, fromValue, toValue, rates);
    const rate = convertAmount(1, fromValue, toValue, rates);
    resultEl.value =
      converted !== null ? formatAmount(converted, toValue) : "❌";
    rateEl.textContent = rate
      ? `1 ${fromValue} = ${formatAmount(rate, toValue)} ${toValue}`
      : "";
  }

  amountEl.addEventListener("input", () => {
    clearTimeout(modalDebounce);
    modalDebounce = setTimeout(runConvert, 350);
  });

  overlay.querySelector(".cv-swap-btn").addEventListener("click", () => {
    [fromValue, toValue] = [toValue, fromValue];
    fromDropdown.setValue(fromValue);
    toDropdown.setValue(toValue);
    chrome.storage.local.set({ cvFrom: fromValue, cvTo: toValue });
    const resNum = parseFloat(
      (resultEl.value || "").replace(/\s/g, "").replace(",", "."),
    );
    if (!isNaN(resNum) && resNum > 0) amountEl.value = resNum;
    runConvert();
  });

  function closeModal() {
    document
      .querySelectorAll(".cv-dropdown-list.open")
      .forEach((l) => l.classList.remove("open"));
    overlay.classList.remove("cv-visible");
    setTimeout(() => overlay.remove(), 200);
  }

  overlay.querySelector(".cv-close").addEventListener("click", closeModal);
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", function onKey(e) {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", onKey);
    }
  });

  if (!prefillAmount) setTimeout(() => amountEl.focus(), 50);
  else runConvert();
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "OPEN_CONVERTER_MODAL") {
    closePopup();
    const pos = getSelectionPosition();
    openConverterModal(
      message.prefillAmount || "",
      pos?.x ?? null,
      pos?.y ?? null,
    );
  }
});
