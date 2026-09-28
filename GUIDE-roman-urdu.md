# DailySudoku Lite — Istemaal Guide (Roman Urdu)

> Factory rule: har published project mein yeh file `GUIDE-roman-urdu.md` ke naam se zaroori hai.

## 1. Yeh project kya hai?

DailySudoku Lite ek **offline classic 9×9 Sudoku** PWA hai. Easy / Medium / Hard difficulties hain, plus **Daily puzzle** jo Asia/Karachi (PKT) date se deterministic seed hoti hai — din bhar sab ko same board milti hai. Pencil notes, hint, timer, aur ads stubs included.

## 2. Kahan se download karein?

- GitHub Pages (jab publish ho): `…/dailysudoku-lite/`
- Source / ZIP: factory path `/workspace/factory/projects/dailysudoku-lite`
- Local: `npm run build` ke baad `dist/` folder

## 3. Pehle kya chahiye? (requirements)

- Node.js 20+ (dev / build ke liye)
- Modern browser (Chrome / Edge / Firefox / Safari) — phone ya desktop
- Internet sirf pehli load / install ke liye; phir PWA offline chal sakti hai

## 4. Install + Run (step-by-step)

1. Project folder kholo: `cd /workspace/factory/projects/dailysudoku-lite`
2. Packages: `npm install`
3. Dev server: `npm run dev` — browser mein URL kholo
4. Production check: `npm test && npm run build && npm run preview`
5. Preview `/dailysudoku-lite/` base path ke sath chalti hai
6. Phone par: site kholo → browser menu → **Add to Home Screen** (PWA)

## 5. Demo login (agar ho)

Koi login nahi. Progress `localStorage` mein save hoti hai (`dailysudoku-lite:v1:` keys).

## 6. Features — har ek kya karta hai

### Daily Puzzle
- **Kahan:** Home → **Daily Puzzle**
- **Kaise:** Tap karo — aaj ki PKT date ka board load hoga
- **Result:** Din bhar same unique board; complete par streak update

### Easy / Medium / Hard
- **Kahan:** Home buttons
- **Kaise:** Difficulty chuno; naya random (seeded) puzzle generate hota hai
- **Result:** Clue count bands alag (Easy zyada clues, Hard kam)

### Grid + number pad
- **Kahan:** Play screen
- **Kaise:** Cell tap → 1–9 pad; Erase se clear; arrow keys / keyboard digits bhi
- **Result:** User digits fill; givens (bold) locked

### Conflicts highlight
- **Kahan:** Play → **Conflicts** toggle
- **Kaise:** On rakho to row/col/box duplicates red dikhenge
- **Result:** Galti jaldi nazar aati hai

### Pencil notes
- **Kahan:** Play → **Pencil**
- **Kaise:** On karke digit tap = candidate mark (toggle)
- **Result:** Chhoti notes cell ke andar

### Timer + best times
- **Kahan:** Play HUD timer; Home par Best E/M/H/D
- **Kaise:** Solve complete → time save agar pehle se better ho
- **Result:** localStorage best times

### Hint
- **Kahan:** Play → 💡
- **Kaise:** Har PKT din **1 free** hint; us ke baad rewarded ad stub
- **Result:** Ek sahi cell fill

### Daily streak
- **Kahan:** Home → Streak line (jab count ≥ 1)
- **Kaise:** Daily complete karo consecutive din
- **Result:** Kal + aaj → streak +1; skip → reset 1

### Mute / Remove ads
- **Kahan:** Home → Settings
- **Kaise:** Sound on/off; Remove ads (stub) purchase flag
- **Result:** Preferences localStorage; ads skip jab removed

### Ads stubs
- New game / win par interstitial stub modal
- Extra hint par rewarded stub
- Real AdMob **nahi** — placeholders only

## 7. Common masail (troubleshooting)

- **Board generate slow pehli baar:** Unique dig thora compute karta hai — toast “Generating…” dikhega
- **Daily alag kyu?** Timezone: seed **Asia/Karachi** calendar date use karti hai, browser local nahi
- **Blank / 404 assets:** `base: '/dailysudoku-lite/'` — Pages path sahi hona chahiye
- **Progress gayab:** Browser data clear / alag profile = naya save
- **PWA update nahi:** Tab band karke dubara kholo; SW autoUpdate

## 8. Security / privacy tips

- Koi account / password nahi
- Progress aur settings sirf device `localStorage` mein
- Real AdMob / billing keys MVP mein nahi — stubs only
- Teesri party ko personal data nahi bhejte (offline-first)

## 9. Agla update

- Polish UX, zyada hint strategies, real ads SDK (jab factory decide kare)
- Killer / variant sudoku **out of scope** — classic 9×9 hi core hai
