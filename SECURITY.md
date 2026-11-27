# Security policy

## Reporting a problem

If you find a security issue, such as a way for API data to run code in the page, a way to read someone's saved API key, or an unsafe dependency, please report it privately through [GitHub's private vulnerability reporting](https://github.com/ShazMoghaddam/market-pulse/security/advisories/new) rather than opening a public issue.

You can expect a reply within a week.

## What's in scope

Market Pulse is a single static HTML page. It has no server, no accounts, no cookies and no analytics.

- **Your API key** is saved only in your browser's `localStorage` and is only ever sent to `api.tradingeconomics.com`. It is never written into the file. Anyone with access to your browser profile could read it, as with any saved setting.
- **API data** is treated as untrusted and escaped before it is shown.
- **Network requests** go to TradingEconomics (only if you add a key) and to Google Fonts for the Inter and JetBrains Mono fonts.
- **Stored in your browser:** theme, filters, your API key (if added) and a 30-minute cache of events.

The npm packages in `package.json` are only used to test the page and build the README images. None of them ship in the page itself.

## Supported versions

Only the latest version on `main` is supported.
