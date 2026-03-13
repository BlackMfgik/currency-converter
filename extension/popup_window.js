const fromSelect = document.getElementById("fromCurrency");
const toSelect = document.getElementById("toCurrency");
const amountInput = document.getElementById("amountInput");
const resultBox = document.getElementById("resultBox");
const rateInfo = document.getElementById("rateInfo");
const swapBtn = document.getElementById("swapBtn");
const savedBadge = document.getElementById("savedBadge");
const currencyGrid = document.getElementById("currencyGrid");

let debounceTimer = null;
let savedBadgeTimer = null;

chrome.storage.local.get(["targetCurrency", "fromCurrency"], (data) => {
  if (data.targetCurrency) {
    toSelect.value = data.targetCurrency;
    updateActiveChip(data.targetCurrency);
  }
  if (data.fromCurrency) fromSelect.value = data.fromCurrency;
});

currencyGrid.querySelectorAll(".currency-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    toSelect.value = chip.dataset.code;
    updateActiveChip(chip.dataset.code);
    saveAndConvert();
  });
});

function updateActiveChip(code) {
  currencyGrid
    .querySelectorAll(".currency-chip")
    .forEach((c) => c.classList.toggle("active", c.dataset.code === code));
}

swapBtn.addEventListener("click", () => {
  [fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value];
  updateActiveChip(toSelect.value);
  saveAndConvert();
});

fromSelect.addEventListener("change", saveAndConvert);
toSelect.addEventListener("change", () => {
  updateActiveChip(toSelect.value);
  saveAndConvert();
});
amountInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(convert, 400);
});

function saveAndConvert() {
  chrome.storage.local.set({
    targetCurrency: toSelect.value,
    fromCurrency: fromSelect.value,
  });
  savedBadge.classList.add("show");
  clearTimeout(savedBadgeTimer);
  savedBadgeTimer = setTimeout(() => savedBadge.classList.remove("show"), 1500);
  convert();
}

async function convert() {
  const amount = parseFloat(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (!amountInput.value || isNaN(amount) || amount <= 0) {
    resultBox.innerHTML = `<span class="result-loading"><span class="spinner"></span> Введи суму</span>`;
    rateInfo.textContent = "—";
    return;
  }

  if (from === to) {
    resultBox.innerHTML = `<span class="result-amount">${formatNum(amount, to)}</span><span class="result-currency">${to}</span>`;
    rateInfo.textContent = "1 : 1";
    return;
  }

  resultBox.innerHTML = `<span class="result-loading"><span class="spinner"></span> Завантаження…</span>`;

  const rates = await fetchRates();
  if (!rates) {
    resultBox.innerHTML = `<span style="color:#ff6b6b;font-size:12px;">❌ Немає з'єднання</span>`;
    return;
  }

  const converted = convertAmount(amount, from, to, rates);
  if (converted === null) {
    resultBox.innerHTML = `<span style="color:#ff6b6b;font-size:12px;">❌ Невідома валюта</span>`;
    return;
  }

  const rate = convertAmount(1, from, to, rates);
  const formatted = formatNum(converted, to);
  resultBox.innerHTML = `<span class="result-amount">${formatted}</span><span class="result-currency">${to}</span>`;
  const amountEl = resultBox.querySelector(".result-amount");
  if (amountEl) {
    const maxW = resultBox.clientWidth - 48;
    let size = 18;
    while (size > 9) {
      if (formatted.length * size * 0.6 <= maxW) break;
      size -= 0.5;
    }
    amountEl.style.fontSize = size + "px";
  }
  rateInfo.textContent = `1 ${from} = ${rate ? formatNum(rate, to) : "?"} ${to}  ·  ${rates._date || ""}`;
}

function convertAmount(amount, from, to, rates) {
  if (from === to) return amount;
  const inEur =
    from === "EUR" ? amount : rates[from] ? amount / rates[from] : null;
  if (inEur === null) return null;
  if (to === "EUR") return inEur;
  return rates[to] ? inEur * rates[to] : null;
}

function formatNum(n, currency) {
  const d =
    currency === "JPY" || currency === "KRW" ? 0 : currency === "BTC" ? 6 : 2;
  return new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);
}

let cachedRates = null;
let cacheTime = 0;

async function fetchRates() {
  if (cachedRates && Date.now() - cacheTime < 3_600_000) return cachedRates;
  const sources = [
    () =>
      fetch("https://api.frankfurter.app/latest?from=EUR")
        .then((r) => r.json())
        .then((d) => ({ rates: d.rates, date: d.date })),
    () =>
      fetch("https://open.er-api.com/v6/latest/EUR")
        .then((r) => r.json())
        .then((d) => ({
          rates: d.rates,
          date: (d.time_last_update_utc || "").slice(0, 10),
        })),
  ];
  for (const source of sources) {
    try {
      const { rates, date } = await source();
      if (rates?.UAH) {
        cachedRates = { ...rates, EUR: 1, _date: date };
        cacheTime = Date.now();
        return cachedRates;
      }
    } catch (_) {}
  }
  return null;
}
