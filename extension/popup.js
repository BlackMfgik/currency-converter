const select = document.getElementById("targetCurrency");
const indicator = document.getElementById("savedIndicator");
const savedText = document.getElementById("savedText");
let saveTimer = null;

chrome.storage.local.get("targetCurrency", (data) => {
  if (data.targetCurrency) {
    select.value = data.targetCurrency;
  }
});

select.addEventListener("change", () => {
  chrome.storage.local.set({ targetCurrency: select.value });

  indicator.classList.add("show");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    indicator.classList.remove("show");
  }, 2000);
});
