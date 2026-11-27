# Changelog

All notable changes to this project are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [semantic versioning](https://semver.org/).

## [1.1.0] - 2026-11-27

The demo is never out of date again, your API key no longer lives in the file, and the repo has the full set of files.

### Fixed
- **The demo opened in February 2025.** All 50 built-in events were from early 2025, so without an API key every event said "Released" and the next-event panel never appeared. They are replaced by a sample week built around today (see below).
- **API data went into the page unescaped.** An event name or value from the API could inject HTML. Everything is now escaped and shown as text.
- **Two "Offline" badges** sat side by side. There is now one badge: Sample data, Live or Offline (cached).
- **Jobless figures were coloured the wrong way.** A rise in unemployment or claims showed green. These are now flipped, and a figure equal to the forecast stays neutral.
- The next-event panel used each event's stored status instead of working it out live.
- The phone header clock wrapped onto two lines.
- Sharing tags pointed to `yoursite.com` and to images that didn't exist. The favicon was missing.

### Added
- **Rolling sample week.** Example events placed on business days around today (weekends skipped), so the demo always shows a mix of released and upcoming events. A badge and a note make clear they are not real releases.
- **Settings dialog** for the TradingEconomics API key. The key is saved only in your browser and sent only to TradingEconomics. A rejected key is reported straight away.
- Your region and impact filters are remembered.
- Filter buttons announce their state to screen readers, every control has a focus ring, and `prefers-reduced-motion` turns off the pulses and hover lift.
- Footer credit with links to the user guide and privacy policy.
- Live demo on GitHub Pages.
- Smoke tests in a headless browser with the TradingEconomics API mocked: five screen widths, the sample week (including weekends), live mode, escaping, good and bad keys, remembered filters and colour logic. They run in CI on every push and pull request.
- README banner, GitHub social preview and screenshots, built from the live page by `assets/build.mjs`.
- `CHANGELOG.md`, `SECURITY.md`, `CONTRIBUTING.md` and Dependabot.

### Changed
- `market-pulse.html` is now `index.html`, so GitHub Pages serves it at a clean address.
- The "US" filter is now labelled **Americas**, because it also covers Canada and Mexico.
- The user guide and privacy policy describe the new key setup and sample week.
- README rewritten. Licence year corrected to 2026, when the project was created.

### Removed
- `CONFIG.API_KEY = 'YOUR_API_KEY_HERE'` and the instructions to paste a key into the file.
- Two raw screenshots from the repo root (replaced by `assets/screenshots/`).

## [1.0.0] - 2026-03-04

First release: live status engine, countdown timers, region and impact filters, dark and light themes, local time zone, TradingEconomics API with offline fallback data. The licence was later switched to the standard MIT text (26 October 2026).
