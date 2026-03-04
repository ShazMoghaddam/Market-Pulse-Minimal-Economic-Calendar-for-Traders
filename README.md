# 📈 Market Pulse

**A distraction-free economic calendar built for focused traders.**

![Market Pulse Screenshot](./Market Plus Image 1.png, Market Plus Image 2.png)

---

## What It Is

Market Pulse is a single-file economic calendar that gives traders a clean, high-signal view of the events that actually move markets — Fed decisions, CPI releases, NFP, GDP data, and more.

No ads. No clutter. No paywalls. Just the data, in your timezone, filtered to the impact level you care about.

---

## Features

- 🔴 **Live status logic** — events auto-advance through Upcoming → Live → Released
- ⏱ **Countdown timers** — real-time ticking countdowns to each event
- 🌍 **Region filtering** — filter by US, EU, UK, JP, CA, AU, and more
- ⚡ **Impact filtering** — High / Medium / Low, so you can go high-impact only
- 🌙 **Dark & Light mode** — auto-detects system preference, persists your choice
- 🕐 **Local timezone** — auto-detects and displays times in your local zone
- 📡 **Offline fallback** — loads curated sample data when API is unavailable
- 📦 **Zero dependencies** — single `.html` file, no npm, no build step
- 🔌 **Self-hostable** — open locally or deploy anywhere (Netlify, GitHub Pages, VPS)

---

## Quick Start

### Option A — Open Locally (Easiest)

1. Download `market-pulse.html`
2. Open it in any modern browser
3. It works immediately with built-in fallback data

### Option B — Live Data via TradingEconomics API

1. Get a free API key at [tradingeconomics.com](https://tradingeconomics.com/analytics/api.aspx)
2. Open `market-pulse.html` in a text editor
3. Find this line near the top of the `<script>` section:

```js
const API_KEY = 'YOUR_API_KEY_HERE';
```

4. Replace `YOUR_API_KEY_HERE` with your key
5. Save and open the file — live data will load automatically

### Option C — Self-Host (Netlify / GitHub Pages / VPS)

Upload the single `market-pulse.html` file to any static hosting provider. No server-side code required.

---

## File Structure

```
market-pulse.html    ← The entire application (HTML + CSS + JS)
LICENSE              ← MIT License
README.md            ← This file
```

That's it. There is no build process, no `node_modules`, no config files.

---

## Customisation

Everything is in one file. Open it in any text editor and you can:

| What to change | Where to look |
|---|---|
| API key | `const API_KEY = ...` near top of `<script>` |
| Default region filter | `const DEFAULT_REGION = ...` |
| Default impact filter | `const DEFAULT_IMPACT = ...` |
| Accent colour | `--accent-primary` in `:root` CSS variables |
| App title / branding | `<title>` tag and `.brand` text in `<header>` |
| Fallback event data | `FALLBACK_EVENTS` array in the script |

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome / Edge 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Mobile (iOS / Android) | ✅ Responsive |

---

## API Notes

Live data is powered by the [TradingEconomics API](https://tradingeconomics.com/analytics/api.aspx).

- A **free tier** key works for personal use
- The app gracefully falls back to static sample data if the API is unreachable or the key is missing
- Market Pulse is not affiliated with TradingEconomics

---

## License

MIT — free to use, modify, and distribute. See [LICENSE](./LICENSE) for full terms.

---

## Changelog

### v1.0.0
- Initial release
- Live/Upcoming/Released status engine
- Countdown timers
- Region + Impact filtering
- Dark/Light mode with system detection
- Offline fallback data
- Responsive layout

---

*Built for traders who want signal, not noise.*
