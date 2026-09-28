# DailySudoku Lite

**Offline classic 9×9 Sudoku PWA** — Easy / Medium / Hard plus a **daily puzzle** seeded from the Asia/Karachi calendar date. Pencil notes, conflict highlights, timer, hint (1 free/day + rewarded stub), ads/remove-ads stubs.

> Original branding. Not a Meowdoku / NYT clone. Classic 9×9 only — no killer / variants.

| Field | Value |
|-------|--------|
| **Project ID** | `proj_dailysudoku_lite_001` |
| **Slug** | `dailysudoku-lite` |
| **Version** | 0.1.0 |
| **Pages base** | `/dailysudoku-lite/` |
| **Stack** | Vite + TypeScript + vite-plugin-pwa |

## Quick start

```bash
cd /workspace/factory/projects/dailysudoku-lite
npm install
npm test
npm run dev          # local
npm run build && npm run preview   # production under /dailysudoku-lite/
```

## Features

1. **Generator + validator** — Dig from a full grid; keep unique-solution puzzles; clue targets per difficulty  
2. **Daily (PKT)** — Deterministic board from `YYYY-MM-DD` Asia/Karachi  
3. **Play UI** — Grid, number pad, conflicts, timer  
4. **Pencil notes** — Toggle candidates  
5. **Hint** — 1 free per PKT day, then rewarded-ad stub  
6. **Progress** — localStorage best times, daily streak, mute, adsRemoved  
7. **Ads stubs** — Interstitial on new game / win; remove-ads IAP stub  
8. **PWA** — Offline after first load; `base: '/dailysudoku-lite/'`

## Docs

- [GUIDE-roman-urdu.md](./GUIDE-roman-urdu.md) — Roman Urdu user guide (required)
- [CHANGELOG.md](./CHANGELOG.md)
- [STATUS.md](./STATUS.md)

## License / notes

Factory MVP. No real AdMob / billing. Offline-only — no live-ops.
