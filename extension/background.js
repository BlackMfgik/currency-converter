chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "currency-converter-modal",
    title: "💱 Currency Converter",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "currency-converter-modal") return;
  const raw = info.selectionText || "";
  const numMatch = raw.match(/[\d\s.,]+/);
  const number = numMatch
    ? numMatch[0].replace(/\s/g, "").replace(",", ".")
    : "";
  chrome.tabs.sendMessage(tab.id, {
    type: "OPEN_CONVERTER_MODAL",
    prefillAmount: number,
  });
});
