# Contributing

Thanks for your interest. Issues and pull requests are welcome.

## Getting set up

You only need a browser to work on the page: open `index.html`. Without an API key it shows the sample week, which is enough for most changes.

To run the tests, you also need Node 20 or later:

```bash
npm install
npx playwright install chromium
npm test
```

The tests mock the TradingEconomics API, so you never need a real key and nothing is sent anywhere.

## Before you open a pull request

- Run `npm test`. CI runs the same tests at five screen widths.
- Check the page in dark and light, and at phone width.
- If you change how the page looks, rebuild the images with `npm run build:assets` and commit them.
- Add a line to `CHANGELOG.md` under a new "Unreleased" heading.

## Rules that keep it safe

- Never commit a real API key. `CONFIG.API_KEY` stays empty.
- Anything from the API goes through `esc()` before it reaches the page.
- Every control must work with a keyboard and have a visible focus ring.
