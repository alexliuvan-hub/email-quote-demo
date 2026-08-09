# email-quote-demo

Standalone **instant quote calculator** demo for **Pinpoint Maintenance** (Naperville / Downers Grove area).

Adapted from the BrightPath Cleaning window-quote pricing logic:

- Pane tiers (up to 25 → 101+)
- Exterior included
- Optional interior, screens, tracks
- Pressure washing add-on (demo rates)
- Live price on the page — no form submit / email wait

## Run locally

Because this uses ES modules, open it via a local server (not `file://`):

```bash
npx --yes serve .
```

Then open the URL it prints (usually `http://localhost:3000`).

Or in VS Code / Cursor: install “Live Server” and open `index.html`.

## Deploy

Works on Netlify, Vercel, or GitHub Pages as a static site (publish the repo root).

## Swap pricing

Edit `PRICE_TABLE` in `calculator.js` when Pinpoint confirms real rates.
