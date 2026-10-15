import {
  purchaseRemoveAds,
  setInterstitialPresenter,
  setRewardedPresenter,
  showInterstitial,
  showRewarded,
} from '../ads/stubs';
import {
  canUseFreeHint,
  getBestTimes,
  getDailyRecord,
  getSettings,
  getStreak,
  markFreeHintUsed,
  recordBestTime,
  recordDailyComplete,
  saveDailyRecord,
  setSettings,
  type DifficultyKey,
} from '../game/persist';
import {
  dailyKeyKarachi,
  findConflictCells,
  generateDaily,
  generateRandom,
  isCompleteAndValid,
  type Board,
  type Difficulty,
  type Notes,
  type Puzzle,
  cloneBoard,
  emptyNotes,
} from '../sudoku';

type Screen = 'home' | 'play' | 'settings' | 'howto';

interface PlayState {
  puzzle: Puzzle;
  board: Board;
  notes: Notes;
  selected: number;
  pencil: boolean;
  showConflicts: boolean;
  startedAt: number;
  elapsedMs: number;
  running: boolean;
  won: boolean;
  dailyKey?: string;
}

let rootEl: HTMLElement;
let screen: Screen = 'home';
let play: PlayState | null = null;
let timerId: number | null = null;
let toastTimer: number | null = null;

function $(sel: string, el: ParentNode = rootEl): HTMLElement {
  const n = el.querySelector(sel);
  if (!n) throw new Error(`Missing ${sel}`);
  return n as HTMLElement;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function stopTimer(): void {
  if (timerId != null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function startTimer(): void {
  stopTimer();
  timerId = window.setInterval(() => {
    if (!play || !play.running || play.won) return;
    play.elapsedMs = Date.now() - play.startedAt;
    const el = rootEl.querySelector('#hud-timer');
    if (el) el.textContent = formatTime(play.elapsedMs);
  }, 250);
}

function showScreen(next: Screen): void {
  screen = next;
  rootEl.querySelectorAll<HTMLElement>('[data-screen]').forEach((s) => {
    s.hidden = s.dataset.screen !== next;
  });
  if (next === 'home') refreshHome();
  if (next === 'settings') refreshSettings();
}

function toast(msg: string): void {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  if (toastTimer != null) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.hidden = true;
  }, 2200);
}

function refreshHome(): void {
  const key = dailyKeyKarachi();
  const daily = getDailyRecord(key);
  const streak = getStreak();
  const best = getBestTimes();
  $('#home-daily-meta').textContent = daily?.completed
    ? `Daily ${key} ✓ completed`
    : `Daily ${key} ready`;
  const streakEl = $('#home-streak');
  if (streak.count >= 1) {
    streakEl.hidden = false;
    $('#streak-count').textContent = String(streak.count);
  } else {
    streakEl.hidden = true;
  }
  const fmt = (n: number | null) => (n == null ? '—' : formatTime(n * 1000));
  $('#best-easy').textContent = fmt(best.easy);
  $('#best-medium').textContent = fmt(best.medium);
  $('#best-hard').textContent = fmt(best.hard);
  $('#best-daily').textContent = fmt(best.daily);
}

function refreshSettings(): void {
  const s = getSettings();
  $('#btn-mute').textContent = s.muted ? '🔇 Sound off' : '🔊 Sound on';
  $('#ads-status').textContent = s.adsRemoved
    ? 'Ads: removed (stub)'
    : 'Ads: enabled (placeholder)';
  ($('#btn-remove-ads') as HTMLButtonElement).disabled = s.adsRemoved;
}

function beginPlay(puzzle: Puzzle, dailyKey?: string): void {
  play = {
    puzzle,
    board: cloneBoard(puzzle.givens),
    notes: emptyNotes(),
    selected: puzzle.givens.findIndex((v) => v === 0),
    pencil: false,
    showConflicts: true,
    startedAt: Date.now(),
    elapsedMs: 0,
    running: true,
    won: false,
    dailyKey,
  };
  if (play.selected < 0) play.selected = 0;
  showScreen('play');
  renderPlay();
  startTimer();
  void showInterstitial('new-game');
}

async function startDifficulty(diff: Exclude<Difficulty, 'daily'>): Promise<void> {
  toast('Generating…');
  // yield so toast paints
  await Promise.resolve();
  const puzzle = generateRandom(diff);
  beginPlay(puzzle);
}

async function startDaily(): Promise<void> {
  const key = dailyKeyKarachi();
  toast('Loading daily…');
  await Promise.resolve();
  const puzzle = generateDaily(key);
  beginPlay(puzzle, key);
}

function isGiven(i: number): boolean {
  return play != null && play.puzzle.givens[i]! !== 0;
}

function applyHint(): void {
  if (!play || play.won) return;
  const empties: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (play.board[i] === 0 || play.board[i] !== play.puzzle.solution[i]) {
      if (!isGiven(i)) empties.push(i);
    }
  }
  // Prefer truly empty incorrect cells
  const emptyOnly = empties.filter((i) => play!.board[i] === 0);
  const pool = emptyOnly.length ? emptyOnly : empties;
  if (!pool.length) {
    toast('Nothing to hint');
    return;
  }
  const i = pool[0]!;
  const digit = play.puzzle.solution[i]!;
  play.board[i] = digit;
  play.notes[i] = 0;
  play.selected = i;
  // clear peer notes of this digit
  clearNotesDigit(i, digit);
  renderPlay();
  checkWin();
}

function clearNotesDigit(at: number, digit: number): void {
  if (!play) return;
  const bit = 1 << (digit - 1);
  const r = (at / 9) | 0;
  const c = at % 9;
  const br = ((r / 3) | 0) * 3;
  const bc = ((c / 3) | 0) * 3;
  for (let k = 0; k < 9; k++) {
    play.notes[r * 9 + k]! &= ~bit;
    play.notes[k * 9 + c]! &= ~bit;
  }
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      play.notes[(br + dr) * 9 + (bc + dc)]! &= ~bit;
    }
  }
}

async function onHint(): Promise<void> {
  if (!play || play.won) return;
  const key = dailyKeyKarachi();
  if (canUseFreeHint(key)) {
    markFreeHintUsed(key);
    applyHint();
    toast('Free hint used');
    return;
  }
  const ok = await showRewarded('hint');
  if (ok) {
    applyHint();
    toast('Hint (rewarded stub)');
  } else {
    toast('Hint cancelled');
  }
}

function placeDigit(digit: number): void {
  if (!play || play.won) return;
  const i = play.selected;
  if (i < 0 || isGiven(i)) return;
  if (play.pencil) {
    if (digit === 0) {
      play.notes[i] = 0;
    } else {
      const bit = 1 << (digit - 1);
      play.notes[i]! ^= bit;
    }
    play.board[i] = 0;
  } else {
    if (digit === 0) {
      play.board[i] = 0;
    } else {
      play.board[i] = digit as Board[number];
      play.notes[i] = 0;
      clearNotesDigit(i, digit);
    }
  }
  renderPlay();
  if (!play.pencil && digit !== 0) checkWin();
}

function checkWin(): void {
  if (!play || play.won) return;
  if (!isCompleteAndValid(play.board)) return;
  // Must match unique solution
  for (let i = 0; i < 81; i++) {
    if (play.board[i] !== play.puzzle.solution[i]) return;
  }
  play.won = true;
  play.running = false;
  play.elapsedMs = Date.now() - play.startedAt;
  stopTimer();
  const sec = Math.floor(play.elapsedMs / 1000);
  const diffKey = play.puzzle.difficulty as DifficultyKey;
  recordBestTime(diffKey, sec);
  if (play.dailyKey) {
    saveDailyRecord(play.dailyKey, {
      completed: true,
      finishedAt: new Date().toISOString(),
      timeSec: sec,
    });
    recordDailyComplete(play.dailyKey);
  }
  $('#win-meta').textContent = `Time ${formatTime(play.elapsedMs)} · ${play.puzzle.difficulty}`;
  $('#overlay-win').hidden = false;
  void showInterstitial('win');
}

function renderPlay(): void {
  if (!play) return;
  const diffLabel =
    play.puzzle.difficulty === 'daily'
      ? `Daily ${play.dailyKey ?? ''}`
      : play.puzzle.difficulty;
  $('#hud-diff').textContent = diffLabel;
  $('#hud-timer').textContent = formatTime(play.elapsedMs);
  $('#btn-pencil').classList.toggle('active', play.pencil);
  $('#btn-pencil').setAttribute('aria-pressed', String(play.pencil));
  $('#btn-pencil').textContent = play.pencil ? '✏️ Pencil on' : '✏️ Pencil';
  $('#btn-conflicts').classList.toggle('active', play.showConflicts);
  $('#btn-conflicts').setAttribute('aria-pressed', String(play.showConflicts));

  const conflicts = play.showConflicts ? findConflictCells(play.board) : new Set<number>();
  const grid = $('#sudoku-grid');
  grid.replaceChildren();
  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.i = String(i);
    const r = (i / 9) | 0;
    const c = i % 9;
    if (c % 3 === 0) cell.classList.add('box-l');
    if (r % 3 === 0) cell.classList.add('box-t');
    if (c === 8) cell.classList.add('box-r');
    if (r === 8) cell.classList.add('box-b');
    if (isGiven(i)) cell.classList.add('given');
    if (i === play.selected) cell.classList.add('selected');
    if (conflicts.has(i)) cell.classList.add('conflict');
    const same =
      play.board[i]! !== 0 &&
      play.selected >= 0 &&
      play.board[i] === play.board[play.selected];
    if (same) cell.classList.add('same-digit');
    const sr = (play.selected / 9) | 0;
    const sc = play.selected % 9;
    if (play.selected >= 0 && (r === sr || c === sc)) cell.classList.add('peer');

    const val = play.board[i]!;
    const noteDigits = Array.from({ length: 9 }, (_, d) => (play!.notes[i]! & (1 << d) ? d + 1 : 0)).filter(Boolean);
    const cellContent = val !== 0
      ? `${isGiven(i) ? 'given ' : ''}${val}`
      : noteDigits.length ? `notes ${noteDigits.join(', ')}` : 'empty';
    cell.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, ${cellContent}${i === play.selected ? ', selected' : ''}`);
    if (val !== 0) {
      cell.textContent = String(val);
    } else if (play.notes[i]!) {
      const notes = document.createElement('div');
      notes.className = 'notes';
      for (let d = 1; d <= 9; d++) {
        const span = document.createElement('span');
        if (play.notes[i]! & (1 << (d - 1))) span.textContent = String(d);
        notes.appendChild(span);
      }
      cell.appendChild(notes);
    }
    cell.addEventListener('click', () => {
      if (!play) return;
      play.selected = i;
      renderPlay();
    });
    grid.appendChild(cell);
  }
  $('#overlay-win').hidden = !play.won;
}

function wireAdsPresenters(): void {
  setInterstitialPresenter(async (reason) => {
    const ov = $('#overlay-interstitial');
    $('#interstitial-reason').textContent = `Ad placeholder (${reason}) — stub, no network.`;
    ov.hidden = false;
    await new Promise<void>((resolve) => {
      const done = () => {
        ov.hidden = true;
        $('#btn-interstitial-continue').removeEventListener('click', done);
        $('#btn-interstitial-dismiss').removeEventListener('click', done);
        resolve();
      };
      $('#btn-interstitial-continue').addEventListener('click', done);
      $('#btn-interstitial-dismiss').addEventListener('click', done);
    });
  });
  setRewardedPresenter(async (reason) => {
    const ov = $('#overlay-reward');
    $('#reward-title').textContent = 'Watch ad?';
    $('#reward-body').textContent = `Rewarded stub for ${reason}. No real ad.`;
    ov.hidden = false;
    return await new Promise<boolean>((resolve) => {
      const ok = () => {
        ov.hidden = true;
        cleanup();
        resolve(true);
      };
      const cancel = () => {
        ov.hidden = true;
        cleanup();
        resolve(false);
      };
      const cleanup = () => {
        $('#btn-reward-ok').removeEventListener('click', ok);
        $('#btn-reward-cancel').removeEventListener('click', cancel);
      };
      $('#btn-reward-ok').addEventListener('click', ok);
      $('#btn-reward-cancel').addEventListener('click', cancel);
    });
  });
}

function buildDom(root: HTMLElement): void {
  root.innerHTML = `
    <section class="screen" data-screen="home">
      <div class="panel home-panel">
        <header class="home-brand">
          <div class="logo-mark" aria-hidden="true">9</div>
          <p class="eyebrow">A QUIET MOMENT, EVERY DAY</p>
          <h1 class="logo">Daily Sudoku <span>Lite</span></h1>
          <p class="tagline">A classic 9×9 challenge, ready wherever you are.</p>
        </header>
        <section class="daily-card" aria-label="Daily puzzle">
          <div class="daily-copy">
            <span class="eyebrow">TODAY · ASIA/KARACHI</span>
            <p class="progress-line" id="home-daily-meta">Daily ready</p>
          </div>
          <button type="button" class="btn primary" id="btn-daily">
            <span>Play today's puzzle</span><span class="btn-arrow" aria-hidden="true">→</span>
          </button>
        </section>
        <p class="progress-line streak-line" id="home-streak" hidden>
          <span class="streak-flare" aria-hidden="true">✦</span>
          <span><strong id="streak-count">0</strong> day streak</span>
        </p>
        <section class="home-stats" aria-label="Personal best times">
          <div class="stats-heading"><span>PERSONAL BESTS</span><span>FASTEST TIME</span></div>
          <div class="best-row">
            <span><small>Easy</small><strong id="best-easy">—</strong></span>
            <span><small>Medium</small><strong id="best-medium">—</strong></span>
            <span><small>Hard</small><strong id="best-hard">—</strong></span>
            <span><small>Daily</small><strong id="best-daily">—</strong></span>
          </div>
        </section>
        <section class="difficulty-area" aria-label="Choose a difficulty">
          <div class="section-heading"><span>CHOOSE YOUR PACE</span><span>Classic 9×9</span></div>
          <div class="difficulty-grid">
            <button type="button" class="btn secondary difficulty-card" id="btn-easy"><span class="difficulty-name">Easy</span><span class="difficulty-note">A gentle start</span><span class="difficulty-mark" aria-hidden="true">01</span></button>
            <button type="button" class="btn secondary difficulty-card" id="btn-medium"><span class="difficulty-name">Medium</span><span class="difficulty-note">Find your rhythm</span><span class="difficulty-mark" aria-hidden="true">02</span></button>
            <button type="button" class="btn secondary difficulty-card" id="btn-hard"><span class="difficulty-name">Hard</span><span class="difficulty-note">Take your time</span><span class="difficulty-mark" aria-hidden="true">03</span></button>
          </div>
        </section>
        <nav class="home-links" aria-label="More options">
          <button type="button" class="btn ghost home-link" id="btn-howto"><span>How to play</span><span class="link-arrow" aria-hidden="true">↗</span></button>
          <button type="button" class="btn ghost home-link" id="btn-settings"><span>Settings</span><span class="link-arrow" aria-hidden="true">↗</span></button>
        </nav>
      </div>
    </section>

    <section class="screen" data-screen="howto" hidden>
      <div class="panel">
        <h2>How to play</h2>
        <ul class="howto-list">
          <li>Fill each row, column, and 3×3 box with digits <strong>1–9</strong> — no repeats.</li>
          <li><strong>Givens</strong> (bold) stay fixed. Tap a cell, then use the pad.</li>
          <li><strong>Pencil</strong> toggles candidate notes in a cell.</li>
          <li><strong>Hint</strong> fills one correct cell (1 free / PKT day, then rewarded stub).</li>
          <li><strong>Daily</strong> is the same board all day for Asia/Karachi date.</li>
        </ul>
        <button type="button" class="btn primary" id="btn-howto-ok">Got it</button>
      </div>
    </section>

    <section class="screen" data-screen="settings" hidden>
      <div class="panel">
        <header class="subhead">
          <button type="button" class="icon-btn" id="btn-settings-back" aria-label="Back">←</button>
          <h2>Settings</h2>
        </header>
        <button type="button" class="btn secondary block" id="btn-mute">🔊 Sound on</button>
        <button type="button" class="btn secondary block" id="btn-remove-ads">Remove ads (stub)</button>
        <p class="hint-text" id="ads-status">Ads: enabled (placeholder)</p>
        <p class="hint-text">Original DailySudoku Lite branding. Offline PWA. No real billing in v0.1.</p>
      </div>
    </section>

    <section class="screen" data-screen="play" hidden>
      <header class="hud">
        <button type="button" class="icon-btn" id="btn-menu" aria-label="Menu">⌂</button>
        <div class="hud-stat"><span class="lbl">Mode</span><span id="hud-diff">easy</span></div>
        <div class="hud-stat"><span class="lbl">Time</span><span id="hud-timer">00:00</span></div>
        <button type="button" class="icon-btn" id="btn-hint" aria-label="Hint" title="Hint">💡</button>
      </header>
      <div class="board-wrap">
        <div id="sudoku-grid" class="sudoku-grid" role="grid" aria-label="Sudoku grid"></div>
      </div>
      <div class="play-bar">
        <button type="button" class="btn secondary" id="btn-pencil">✏️ Pencil</button>
        <button type="button" class="btn secondary" id="btn-conflicts">⚠ Conflicts</button>
        <button type="button" class="btn ghost" id="btn-erase">Erase</button>
      </div>
      <div class="num-pad" id="num-pad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9]
          .map((d) => `<button type="button" class="pad-btn" data-digit="${d}">${d}</button>`)
          .join('')}
      </div>

      <div id="overlay-win" class="overlay" hidden>
        <div class="panel">
          <h2>Solved!</h2>
          <p class="go-meta" id="win-meta">Nice work.</p>
          <button type="button" class="btn primary" id="btn-win-home">Home</button>
          <button type="button" class="btn secondary" id="btn-win-again">New puzzle</button>
        </div>
      </div>

      <div id="overlay-interstitial" class="overlay" hidden>
        <div class="panel">
          <h2>Ad placeholder (stub)</h2>
          <p class="go-meta" id="interstitial-reason">Interstitial stub — no real network ad.</p>
          <button type="button" class="btn primary" id="btn-interstitial-continue">Continue</button>
          <button type="button" class="btn ghost" id="btn-interstitial-dismiss">Dismiss</button>
        </div>
      </div>

      <div id="overlay-reward" class="overlay" hidden>
        <div class="panel">
          <h2 id="reward-title">Watch ad?</h2>
          <p class="go-meta" id="reward-body">Placeholder rewarded ad for hint.</p>
          <button type="button" class="btn primary" id="btn-reward-ok">Watch (stub)</button>
          <button type="button" class="btn ghost" id="btn-reward-cancel">Cancel</button>
        </div>
      </div>
    </section>

    <div id="toast" class="toast" hidden role="status"></div>
  `;
}

function bind(): void {
  $('#btn-daily').addEventListener('click', () => void startDaily());
  $('#btn-easy').addEventListener('click', () => void startDifficulty('easy'));
  $('#btn-medium').addEventListener('click', () => void startDifficulty('medium'));
  $('#btn-hard').addEventListener('click', () => void startDifficulty('hard'));
  $('#btn-howto').addEventListener('click', () => showScreen('howto'));
  $('#btn-howto-ok').addEventListener('click', () => showScreen('home'));
  $('#btn-settings').addEventListener('click', () => showScreen('settings'));
  $('#btn-settings-back').addEventListener('click', () => showScreen('home'));
  $('#btn-menu').addEventListener('click', () => {
    stopTimer();
    play = null;
    showScreen('home');
  });
  $('#btn-hint').addEventListener('click', () => void onHint());
  $('#btn-pencil').addEventListener('click', () => {
    if (!play) return;
    play.pencil = !play.pencil;
    renderPlay();
  });
  $('#btn-conflicts').addEventListener('click', () => {
    if (!play) return;
    play.showConflicts = !play.showConflicts;
    renderPlay();
  });
  $('#btn-erase').addEventListener('click', () => placeDigit(0));
  $('#num-pad').addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('[data-digit]') as HTMLElement | null;
    if (!t) return;
    placeDigit(Number(t.dataset.digit));
  });
  $('#btn-win-home').addEventListener('click', () => {
    play = null;
    showScreen('home');
  });
  $('#btn-win-again').addEventListener('click', () => {
    if (!play) {
      showScreen('home');
      return;
    }
    const diff = play.puzzle.difficulty;
    const dailyKey = play.dailyKey;
    if (diff === 'daily' && dailyKey) {
      beginPlay(generateDaily(dailyKey), dailyKey);
    } else if (diff !== 'daily') {
      void startDifficulty(diff);
    } else {
      showScreen('home');
    }
  });
  $('#btn-mute').addEventListener('click', () => {
    const s = getSettings();
    setSettings({ muted: !s.muted });
    refreshSettings();
  });
  $('#btn-remove-ads').addEventListener('click', () => {
    void purchaseRemoveAds().then(() => {
      refreshSettings();
      toast('Ads removed (stub)');
    });
  });

  window.addEventListener('keydown', (e) => {
    if (screen !== 'play' || !play || play.won) return;
    if (e.key >= '1' && e.key <= '9') {
      placeDigit(Number(e.key));
      e.preventDefault();
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      placeDigit(0);
      e.preventDefault();
    } else if (e.key === 'p' || e.key === 'P') {
      play.pencil = !play.pencil;
      renderPlay();
    } else if (e.key.startsWith('Arrow') && play.selected >= 0) {
      let r = (play.selected / 9) | 0;
      let c = play.selected % 9;
      if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
      if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
      if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
      if (e.key === 'ArrowRight') c = Math.min(8, c + 1);
      play.selected = r * 9 + c;
      renderPlay();
      e.preventDefault();
    }
  });
}

export function mountApp(root: HTMLElement): void {
  rootEl = root;
  buildDom(root);
  wireAdsPresenters();
  bind();
  showScreen('home');
}
