# QA Report — DailySudoku Lite MVP v0.1.0

**Date:** 2026-09-28 18:30 PKT (Asia/Karachi)  
**Project:** `/workspace/factory/projects/dailysudoku-lite`  
**Version:** 0.1.0  
**HEAD audited:** `d56cf13344a886a4a3ede7b58bbbdcb9efac2cdb` (`d56cf13` — docs: stamp STATUS with HEAD SHA) — **not amended**  
**Feature commit (intact):** `12d577d506dd0a98ee6444501e647e8f2da61cf2` (`12d577d` — feat: DailySudoku Lite MVP 0.1.0)  
**PRD:** `/workspace/factory/research/PRD-dailysudoku-lite.md`  
**BUILD:** `/workspace/factory/research/BUILD-dailysudoku-lite.md`  
**STATUS claim:** `READY_FOR_QA`  
**QA:** Independent pass (report only — no product code changes; no GitHub push; no agent messages)  
**Overall:** **PASS**

---

## Summary

MVP scope holds against Master checklist + PRD §5 / §7. Classic 9×9 Easy/Medium/Hard + Asia/Karachi daily seed, pencil notes, hint (1 free/PKT day → rewarded stub), conflicts, timer, ads/remove-ads stubs, best times + streak, PWA `base: '/dailysudoku-lite/'`, README + GUIDE-roman-urdu.md + STATUS + CHANGELOG 0.1.0. Automation: **`npm test` 11/11**, **`npm run build` green**. QA clue probe (temp, deleted): Easy/Medium/Hard/Daily hit clue targets **42/34/26/32**, uniqueness true, daily determinism true. Preview smoke `http://127.0.0.1:4192/dailysudoku-lite/` — shell/manifest/SW/assets/icons **200**. No P0/P1 ship blockers.

| Severity | Count |
|----------|------:|
| Critical / P0 | 0 |
| High / P1     | 0 |
| Medium / P2   | 0 |
| Low / P3 (residual) | 4 |

**CLEAR for publish from QA:** **YES** (host under `base: /dailysudoku-lite/`).

---

## Environment

| Item | Detail |
|------|--------|
| Runtime | `npm run preview -- --host 127.0.0.1 --port 4191` → bound **4192** (4191 busy) → `http://127.0.0.1:4192/dailysudoku-lite/` |
| Methods | PRD/BUILD/STATUS/README/GUIDE/CHANGELOG; source review (`sudoku/*`, `ads/stubs`, `game/persist`, `ui/app`, PWA); vitest; production build; QA-only clue/uniqueness probe (temp file deleted; not committed); HTTP smoke of `dist/` |
| Zone | Asia/Karachi (UTC+5); times PKT |
| Git | Local `master` at `d56cf13`; feature `12d577d` intact; SHA not amended; no push this QA |

---

## Automation

| Check | Result |
|-------|--------|
| `npm test` | **11/11 passed** — `tests/validate.test.ts` (4) + `tests/daily.test.ts` (4) + `tests/generate.test.ts` (3); vitest 3.2.7; exit 0 |
| `npm run build` | **green** — `tsc && vite build`; vite 6.4.3; PWA v1.3.0 `generateSW`; **12 precache entries** (38.09 KiB); `dist/sw.js` + `workbox-*.js`; asset hrefs under `/dailysudoku-lite/`; exit 0 |
| Extra clue/uniqueness probe | Easy **42**, Medium **34**, Hard **26** (5 seeds), Daily **32** for `2026-09-28`; all `hasUniqueSolution`; same-day daily boards identical |

---

## Master scope verification

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Classic 9×9 Easy/Medium/Hard + Asia/Karachi daily seed | **PASS** | `CLUE_TARGETS` easy 42 / medium 34 / hard 26; `DAILY_CLUE_TARGET` 32. `generatePuzzle` dig + unique; `dailyKeyKarachi` UTC+5 calendar; `generateDaily(key)` seeded `dailysudoku-daily\|YYYY-MM-DD`. Vitest daily PKT + determinism 4/4; generate uniqueness 3/3. Probe hit exact targets. |
| 2 | Pencil notes, hint, conflicts, timer | **PASS** | UI: Pencil toggle XOR bitset notes; Conflicts toggle → `findConflictCells`; HUD `#hud-timer` 250ms tick; Hint → free once/PKT day then `showRewarded('hint')` → fills `solution[i]`. Keyboard 1–9 / erase / arrows / `P`. |
| 3 | Ads/remove-ads stubs; best times + streak | **PASS** | `src/ads/stubs.ts`: interstitial new-game/win, rewarded hint, `purchaseRemoveAds` → `adsRemoved`. `persist.ts`: best times E/M/H/D, `recordDailyComplete` streak, mute, hintDay. Home shows Best + Streak. No AdMob SDK/keys. |
| 4 | PWA base `/dailysudoku-lite/` | **PASS** | `vite.config.ts` `base: '/dailysudoku-lite/'`; dist `index.html` assets/manifest/icons under `/dailysudoku-lite/`; `public/manifest.webmanifest`; SW + NavigationRoute → `index.html`. |
| 5 | README + GUIDE-roman-urdu.md + STATUS + CHANGELOG 0.1.0 | **PASS** | All four at project root. CHANGELOG `## 0.1.0 — 2026-09-28`. GUIDE Roman Urdu §§1–9. STATUS `READY_FOR_QA`. |

### Also verified

| Item | Verdict | Evidence |
|------|---------|----------|
| Generator dig + unique validate + solve | **PASS** | `digPuzzle` / `fillCompleteGrid` / `hasUniqueSolution` / `countSolutions`; validate row/col/box tests |
| Play UI grid + pad + win | **PASS** | 81-cell DOM grid, num pad, win overlay when board matches solution + complete/valid; saves best + daily |
| Offline after first load (structural) | **PASS** | SW `precacheAndRoute` + NavigationRoute; no gameplay network fetch. No live airplane-mode toggle this pass |
| Original branding / IP | **PASS** | README/STATUS/GUIDE: not Meowdoku/NYT; classic 9×9 only; TubeSort skipped |
| No git push / SHA intact | **PASS** | HEAD remains `d56cf13`; feature `12d577d` not amended; report-only |

---

## Preview smoke (HTTP)

Base: `http://127.0.0.1:4192/dailysudoku-lite`

| URL | Result |
|-----|--------|
| `/` | **200** HTML — DailySudoku Lite title, `#app`, assets under `/dailysudoku-lite/` |
| `/manifest.webmanifest` | **200** — name DailySudoku Lite, display standalone, start_url/scope `./` |
| `/sw.js` | **200** — precache index/assets/icons/manifest (12 entries) |
| `/assets/index-BClnRVqH.js`, `index-iiCTAOSd.css` | **200** |
| `/icons/icon-192.png`, `512.png`, `icon.svg`, `/favicon.svg` | **200** (PNG 192×192 / 512×512 valid) |

---

## PRD acceptance mapping (§7)

| Criterion | Result |
|-----------|--------|
| Easy/Medium/Hard unique solvable boards | **PASS** (tests + clue probe) |
| Daily seed stable for PKT date | **PASS** (tests + probe) |
| Conflicts; pencil; hint correct | **PASS** (code + validate tests) |
| PWA offline; paths under `/dailysudoku-lite/` | **PASS** (structural + smoke) |
| Ads/remove-ads stubs wired | **PASS** |
| `npm test` + `npm run build` | **PASS** |
| README + GUIDE-roman-urdu | **PASS** (+ STATUS + CHANGELOG 0.1.0) |

---

## Residuals (non-blocking)

1. **P3 — STATUS HEAD field lag:** STATUS table lists Commit/HEAD `58abf35…` while actual `git rev-parse HEAD` is `d56cf13` (the stamp commit points at the prior docs commit). Product feature SHA `12d577d` intact; docs pointer stale only.  
2. **P3 — Mute is preference-only:** Mute toggles `localStorage` but MVP has no SFX/audio path that reads `muted`.  
3. **P3 — Manifest start_url/scope relative `./`:** Resolves correctly when hosted under `/dailysudoku-lite/`; absolute path style (as some sibling PWAs) optional polish.  
4. **P3 — No live offline-network toggle:** Airplane-mode browser check not performed; SW precache + NavigationRoute satisfy structural offline gate.

---

## Blockers

**None (P0/P1).**

---

## Verdict

| Question | Answer |
|----------|--------|
| Overall | **PASS** |
| CLEAR for publish from QA? | **YES** |

Report only — product sources untouched; SHA `d56cf13` / feature `12d577d` not amended; no git push; no agent messages.
