# GDG Perf Demo — The Fastest Site I Ever Built Had No Human-Written Bottlenecks

> AI-powered performance diagnosis + live fixes on stage

---

## Pre-talk setup (do this the night before)

```bash
# 1. Clone and install
cd gdg-perf-demo
npm install

# 2. Generate the large placeholder images
npm run generate-images

# 3. Set your Gemini API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY from https://aistudio.google.com/apikey

# 4. Verify the Gemini connection works
node analyse.js

# 5. Start the dev server (keep this running during the whole talk)
npm run dev
# → localhost:3000
```

### For Chrome AI demo (Adaptive page)
In Chrome Canary, enable these flags:
- `chrome://flags/#optimization-guide-on-device-model` → Enabled BypassPerfRequirement
- `chrome://flags/#prompt-api-for-gemini-nano` → Enabled

---

## Demo flow — exact commands in order

### Segment 1 — AI reads the Lighthouse trace (3–8 min)

```bash
# Terminal: run the analyser
node analyse.js

# If WiFi is slow or Gemini is unavailable:
node analyse.js --saved
```

While it runs, say: *"I'm not copy-pasting into ChatGPT. This script feeds the raw Lighthouse trace — the actual timing waterfall, not just the score — directly into Gemini. It sees what a human would see in the Performance tab, but reads it in 3 seconds."*

---

### Segment 2 — Apply fixes live (8–20 min)

**Fix 1 — useMemo / useCallback (2 min)**
```bash
node fix.js productcard-memo
```
Show: `src/components/ProductCard.tsx` — 10,000-loop bug disappears. Hot reload kicks in.

**Fix 2 — Image optimisation (4 min)**
```bash
node fix.js images
node optimize-images.js
```
Show: Network tab before (275KB JPEGs) vs after (< 1KB WebP). 

**Fix 3 — Code splitting (4 min)**
```bash
node fix.js codesplit
```
Show: webpack bundle visualiser (open `dist/stats.html` after next build). Recharts moves to separate chunk.

**Re-run Lighthouse** (against production build for accurate score):
```bash
npm run build && npm run preview
# Lighthouse → localhost:3000
```

---

### Segment 3 — Adaptive loading (20–28 min)

Navigate to `localhost:3000/adaptive`

1. Click the quality simulation buttons — watch images shift quality
2. In Chrome (with AI flags enabled), open DevTools console, run:
   ```js
   const session = await window.ai.languageModel.create()
   await session.prompt("Is slow-3g an acceptable connection for product images?")
   ```
3. Point to the Network tab — no request goes out.

---

## If something breaks on stage

```bash
# Instant reset to broken state
node reset.js

# Show pre-saved Gemini output (no API needed)
node analyse.js --saved

# The fixed files are always in fixes/
# ProductCard.fixed.tsx, ProductCard.images.fixed.tsx, ProductList.fixed.tsx
```

---

## What's deliberately broken (for Lighthouse score ~23)

| Bug | File | Impact |
|-----|------|--------|
| 10,000-loop in render, no React.memo | `ProductCard.tsx:14` | INP +847ms |
| 275KB JPEGs, no srcset, no lazy load | `ProductCard.tsx:24` | LCP +2.6s, CLS 0.28 |
| recharts in main bundle (eager import) | `ProductList.tsx:2` | TTI +1.3s |
| No useCallback on handleSearch | `ProductList.tsx:14` | re-render cascade |
| Google Fonts, no preconnect | `index.html:6` | FCP +290ms |

---

## Repo structure

```
gdg-perf-demo/
├── src/
│   ├── components/
│   │   ├── ProductCard.tsx        ← BROKEN by default
│   │   ├── ProductList.tsx        ← BROKEN by default
│   │   └── AnalyticsDashboard.tsx ← Heavy recharts charts
│   └── pages/
│       ├── Home.tsx               ← Product catalogue
│       └── Adaptive.tsx           ← Chrome AI adaptive loading
├── _broken/                       ← reset.js copies from here
├── fixes/                         ← fix.js fallbacks
├── analyse.js                     ← Gemini-powered analysis
├── fix.js                         ← Live fix generator
├── optimize-images.js             ← sharp image conversion
├── reset.js                       ← Instant demo reset
└── output-saved.txt               ← Backup if API is down
```
