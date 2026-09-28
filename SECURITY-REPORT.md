# DailySudoku Lite — Security Review Report

**Date:** 2026-09-28 18:29 PKT (Asia/Karachi, UTC+05:00)  
**Project:** `/workspace/factory/projects/dailysudoku-lite`  
**HEAD reviewed:** `d56cf13` (`d56cf13344a886a4a3ede7b58bbbdcb9efac2cdb`) — docs: stamp STATUS with HEAD SHA (MVP code in `12d577d` lineage; working tree at this SHA)  
**Version:** 0.1.0  
**Reviewer:** Security Reviewer (executor)  
**Gate:** `/workspace/factory/shared/security/RELEASE_GATE.md`  
**Verdict:** **PASS_WITH_NOTES**  
**Sign-off:** **CLEAR** (no ship blockers)

**Statement:** No product code was edited. No git push was performed. Commit `d56cf13` was not amended.

---

## Ship blockers

**None.**

No secrets/API keys/tokens in source or build, no exploitable XSS from untrusted input into HTML, no unexpected network/telemetry/live AdMob SDKs, no privileged auth surface, production dependency audit clean (`npm audit --omit=dev` → 0 vulnerabilities). Offline Vite/TS Sudoku PWA only.

---

## Master focus summary

| Focus | Result |
|-------|--------|
| 1. XSS / storage / UI | **PASS** — sole `innerHTML` is static template; cells/notes/streak/daily/best via `textContent` |
| 2. localStorage hygiene | **PASS_WITH_NOTES** — PREFIX `dailysudoku-lite:v1:`; streak/best/daily coerced; settings booleans soft (F1) |
| 3. Deps audit | **PASS** — prod audit 0; vitest-only moderate in full audit (F3) |
| 4. Secrets | **PASS** — none; ads stubs only (`src/ads/stubs.ts`) |
| 5. CSP / headers | **Info** — no CSP meta in `index.html` (Pages host can add headers) (F4) |
| 6. Offline | **PASS** — no app fetch/beacon/analytics; Workbox precache only |
| 7. `.gitignore` | **Note** — missing `.env*` (F2), same pattern as HexPour |

---

## Findings

### F1 — Settings / hintDay booleans not strictly coerced on read (Low / note)

- **File:** `src/game/persist.ts:50–57` (`read`), `68–75` (`getSettings`), `175–176` (`getHintDay`)
- **Evidence:** Generic `read()` does `{ ...fallback, ...JSON.parse(raw) }` without `=== true` / `Boolean()` for `muted`, `adsRemoved`, or `usedFree`. Contrast: streak `count` uses `Number.isFinite` + floor (`147–151`); best times use `typeof === 'number'` (`81–84`); daily `completed` uses `Boolean()` (`105`); `isAdsRemoved()` correctly requires `getSettings().adsRemoved === true` (`src/ads/stubs.ts:32`).
- **Risk:** Client-side localStorage tampering only (offline game; no server trust). Odd truthy/falsy values could flip mute/ads UI or free-hint gate; ads skip still gated by `=== true`.
- **Remediation (non-blocking):** On read, coerce `muted` / `adsRemoved` / `usedFree` with `=== true` (or `Boolean()` where intentional), matching HexPour-style hardening.
- **Severity:** Low / note — not a RELEASE_GATE ship blocker.

### F2 — `.gitignore` omits `.env*` patterns (Info / note)

- **File:** `.gitignore` (lines: `node_modules`, `dist`, `.DS_Store`, `*.local`, `.dev-dist`)
- **Evidence:** No `.env`, `.env.*`, or `!.env.example`. No `.env` files present in tree; no secret-like paths tracked.
- **Risk:** Accidental commit of future AdMob/IAP env files when live ads land.
- **Remediation (non-blocking):** Add `.env`, `.env.*`, `!.env.example` before introducing real keys.

### F3 — Full `npm audit` moderate findings are Vitest-only (Info / note)

- **Evidence:** `npm audit --omit=dev` → **0 vulnerabilities** (zero production `dependencies` in `package.json`). Full audit: 2 moderate in `@vitest/mocker` / `vitest` (GHSA-82fw-gwwq-j7x9) — **dev/test tree only**, not shipped in `dist/`.
- **Risk:** Local/CI Vitest misuse only; not a runtime ship risk for the offline PWA.
- **Remediation (non-blocking):** Plan Vitest upgrade when convenient; do not expose Vitest tooling to untrusted networks.

### F4 — CSP meta absent in `index.html` (Info)

- **File:** `index.html` (no `Content-Security-Policy` meta)
- **Evidence:** Typical for factory offline PWAs hosted on GitHub Pages; headers belong on the host. No third-party scripts in the document.
- **Risk:** None material for this client-only MVP with no remote script/connect surface.
- **Remediation (optional):** When Pages (or other host) supports custom headers, prefer CSP restricting `script-src` / `connect-src` to same-origin; keep Workbox/SW registration compatible.

---

## Checklist (RELEASE_GATE)

| # | Area | Status | Notes |
|---|------|--------|-------|
| 1 | Authn / sessions / tokens | N/A → PASS | No accounts, cookies, or tokens |
| 2 | Authz / IDOR / roles | N/A → PASS | Client-only game; no privileged routes |
| 3 | Secrets & config | PASS | No keys; ads are stubs (`src/ads/stubs.ts`) |
| 4 | API surface & rate limits | N/A → PASS | No app API |
| 5 | Injection (XSS / eval / HTML) | PASS | See XSS detail; no `eval` / `document.write` / `outerHTML` / `insertAdjacentHTML` |
| 6 | Uploads & file access | N/A → PASS | None |
| 7 | Dependencies & supply chain | PASS | Prod audit clean; F3 notes vitest-only |
| 8 | Logging / error leakage | PASS | Ad stub in-memory `log` only; no remote logging |
| 9 | Transport (TLS / cookies / HSTS) | N/A → PASS | Static Pages host; no cookie auth; CSP note F4 |
| 10 | Admin / debug surfaces | PASS | No debug endpoints |

### Focus detail

**XSS / UI (`src/ui/app.ts`)**  
- Sole `innerHTML` at **line 396** (`buildDom`): static markup template. Only interpolation is hardcoded pad digits `[1..9]` → `data-digit="${d}"` / button text — not user/storage-controlled.  
- Dynamic UI uses **`textContent`**: toast (`96–98`), home daily meta / streak / best times (`111–125`), settings labels (`130–133`), HUD diff/timer (`298–299`), win meta (`287`), interstitial/reward overlay copy (`356`, `371–372`).  
- Grid cells (`307–348`): `document.createElement`; digit values and pencil notes set via `textContent` / bitmasks — digits only, never raw HTML from storage.  
- Daily key / streak / best times never interpolated into HTML unsafely.  
- No `eval`, `new Function`, `document.write`, `outerHTML`, or `insertAdjacentHTML` in `src/`.

**localStorage (`src/game/persist.ts`)**  
- PREFIX: `dailysudoku-lite:v1:`  
- Fields: settings (`muted`, `adsRemoved`), `bestTimes`, `streak`, `daily:<YYYY-MM-DD>`, `hintDay` — progress/flags only; **no credentials**  
- Hardening: try/catch on read/write; streak count finite+floor; best times typed numbers; daily `completed` Boolean; PKT daily seed comes from `dailyKeyKarachi()` / `generateDaily(key)` — not injectable HTML  
- Consumed via `textContent` or numeric/boolean compares — not HTML-interpolated as untrusted strings

**Daily seed (`src/sudoku/daily.ts`)**  
- `dailyKeyKarachi()` builds `YYYY-MM-DD` from UTC+5 offset math; `dailySeedKey` / `hashStringToUint32` feed `generatePuzzle` — deterministic offline; no network; key not used as HTML.

**Ads stubs (`src/ads/stubs.ts`)**  
- `showInterstitial` / `showRewarded` / `purchaseRemoveAds` / `isAdsRemoved`  
- UI presenters in `app.ts` (`wireAdsPresenters`, ~353–392) are overlay stubs (“stub, no network” / “No real ad”); no AdMob SDK, no `ca-app-pub`, no network ads  
- `purchaseRemoveAds` only sets `adsRemoved: true` in localStorage

**PWA / base / offline**  
- `vite.config.ts`: `base: '/dailysudoku-lite/'`; Workbox `globPatterns` for static assets; `manifest: false` (uses `public/manifest.webmanifest`)  
- `src/main.ts`: `registerSW({ immediate: true })` from `virtual:pwa-register`  
- Build evidence: `dist/sw.js` precaches app assets + `NavigationRoute` → `index.html` only — no unexpected remote app URLs  
- Grep: no app `fetch(`, `sendBeacon`, `XMLHttpRequest`, `gtag`, `analytics`, `admob` in `src/` / `public/` / `index.html`

**Secrets**  
- No API keys, tokens, passwords, or `.env` files in source/public/dist. Package has **zero** production dependencies (devDeps only: typescript, vite, vite-plugin-pwa, vitest, @types/node).

---

## Commands run (evidence)

| Command | Result |
|---------|--------|
| `git rev-parse HEAD` | `d56cf13344a886a4a3ede7b58bbbdcb9efac2cdb` |
| `npm test` | **11/11 passed** (validate 4 + daily 4 + generate 3) |
| `npm audit --omit=dev` | **0 vulnerabilities** |
| `npm audit` (full) | 2 moderate (vitest / @vitest/mocker only) |
| Grep sinks / network / secrets | `innerHTML` only at `app.ts:396` (static); localStorage in persist only; no committed secrets |

**Not done (per brief):** no product code edits; no git push; SHA `d56cf13` not amended.

---

## Notes

- Client-controlled `localStorage` progress (streak, best times, adsRemoved stub, mute, free-hint day) is tamperable by design for an offline game — not a ship blocker with no server trust boundary.
- STATUS.md may still show an older HEAD pointer (`58abf35…`); review targeted working tree / `d56cf13` as instructed.
- CSP/headers for GitHub Pages remain a hosting concern (F4); MVP ships without inline CSP meta consistently with peer factory PWAs (e.g. HexPour).

---

## Sign-off

**Verdict:** PASS_WITH_NOTES  
**Ship blockers:** none  
**Sign-off:** **CLEAR** — eligible for QA / Master dual-clear publish path once Product/QA gates pass. Address F1–F4 as polish, not blockers.

Report path: `/workspace/factory/projects/dailysudoku-lite/SECURITY-REPORT.md`
