# 💱 Currency Converter — Extension

Highlight any amount on any webpage and instantly see the conversion to UAH, USD, or RUB.

## ✨ How it works

Just select text containing a currency on any website:

- `$250`
- `1 500 EUR`
- `100 dollars`
- `£49.99`

A popup will appear instantly with the converted amount.

## 🚀 Installation

1. Download or clone this repository
2. Open `chrome://extensions/` or `vivaldi://extensions/` or `opera://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the extension folder

### Firefox

> ⚠️ Firefox uses a different extension format (Manifest V2). This extension is built for Manifest V3 and is **not fully compatible** with Firefox.
>
> For temporary testing only:
>
> 1. Open `about:debugging`
> 2. Click **This Firefox** → **Load Temporary Add-on**
> 3. Select any file inside the extension folder

## 🌍 Supported currencies

USD, EUR, GBP, JPY, CHF, PLN, CZK, SEK, NOK, DKK, CAD, AUD, CNY, KRW, INR, TRY, UAH, BTC

Also recognizes written names: `dollar`, `euro`, `pound`, `yen`, `zloty` and more.

## ⚙️ How conversion works

Rates are fetched from three APIs with automatic fallback if one is unavailable:

- [frankfurter.app](https://frankfurter.app)
- [open.er-api.com](https://open.er-api.com)
- [fawazahmed0 currency-api](https://github.com/fawazahmed0/exchange-api)

Rates are cached for 1 hour. All conversions use EUR as an intermediate base currency.

## 🛠 Built with

`JavaScript` `Chrome Extensions API (Manifest V3)` `CSS`
