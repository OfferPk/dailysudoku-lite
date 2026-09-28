const PREFIX = 'dailysudoku-lite:v1:';

export type DifficultyKey = 'easy' | 'medium' | 'hard' | 'daily';

export interface Settings {
  muted: boolean;
  adsRemoved: boolean;
}

export interface BestTimes {
  easy: number | null;
  medium: number | null;
  hard: number | null;
  daily: number | null;
}

export interface Streak {
  count: number;
  lastCompletedKey: string;
}

export interface DailyRecord {
  completed: boolean;
  finishedAt?: string;
  timeSec?: number;
}

export interface HintDay {
  /** PKT daily key for which free hint was used. */
  key: string;
  usedFree: boolean;
}

const DEFAULT_SETTINGS: Settings = { muted: false, adsRemoved: false };
const DEFAULT_BEST: BestTimes = {
  easy: null,
  medium: null,
  hard: null,
  daily: null,
};

function canUseStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export function getSettings(): Settings {
  return read<Settings>('settings', DEFAULT_SETTINGS);
}

export function setSettings(partial: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...partial };
  write('settings', next);
  return next;
}

export function getBestTimes(): BestTimes {
  const b = read<BestTimes>('bestTimes', DEFAULT_BEST);
  return {
    easy: typeof b.easy === 'number' ? b.easy : null,
    medium: typeof b.medium === 'number' ? b.medium : null,
    hard: typeof b.hard === 'number' ? b.hard : null,
    daily: typeof b.daily === 'number' ? b.daily : null,
  };
}

/** Record a finish time if better (lower) than previous best. */
export function recordBestTime(diff: DifficultyKey, timeSec: number): BestTimes {
  const b = getBestTimes();
  const prev = b[diff];
  if (prev === null || timeSec < prev) {
    b[diff] = Math.max(0, Math.floor(timeSec));
    write('bestTimes', b);
  }
  return b;
}

export function getDailyRecord(dailyKey: string): DailyRecord | null {
  try {
    const raw = localStorage.getItem(PREFIX + `daily:${dailyKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DailyRecord>;
    return {
      completed: Boolean(parsed.completed),
      finishedAt: parsed.finishedAt,
      timeSec: typeof parsed.timeSec === 'number' ? parsed.timeSec : undefined,
    };
  } catch {
    return null;
  }
}

export function saveDailyRecord(dailyKey: string, record: DailyRecord): void {
  const prev = getDailyRecord(dailyKey);
  const completed = record.completed || Boolean(prev?.completed);
  write(`daily:${dailyKey}`, {
    completed,
    finishedAt: completed
      ? (prev?.finishedAt ?? record.finishedAt ?? new Date().toISOString())
      : record.finishedAt,
    timeSec:
      completed && prev?.timeSec != null
        ? Math.min(prev.timeSec, record.timeSec ?? prev.timeSec)
        : record.timeSec,
  });
}

export function shiftDailyKey(key: string, deltaDays: number): string {
  const parts = key.split('-').map(Number);
  const y = parts[0]!;
  const m = parts[1]!;
  const d = parts[2]!;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function getStreak(): Streak {
  try {
    const raw = localStorage.getItem(PREFIX + 'streak');
    if (!raw) return { count: 0, lastCompletedKey: '' };
    const parsed = JSON.parse(raw) as Partial<Streak>;
    const count = Number(parsed.count);
    const lastCompletedKey =
      typeof parsed.lastCompletedKey === 'string' ? parsed.lastCompletedKey : '';
    return {
      count: Number.isFinite(count) && count > 0 ? Math.floor(count) : 0,
      lastCompletedKey,
    };
  } catch {
    return { count: 0, lastCompletedKey: '' };
  }
}

/**
 * On daily complete: yesterday consecutive → +1, else reset to 1.
 * Same-day re-complete is idempotent.
 */
export function recordDailyComplete(dailyKey: string): Streak {
  const prev = getStreak();
  if (prev.lastCompletedKey === dailyKey && prev.count >= 1) return prev;
  const yesterday = shiftDailyKey(dailyKey, -1);
  const next: Streak =
    prev.lastCompletedKey === yesterday && prev.count >= 1
      ? { count: prev.count + 1, lastCompletedKey: dailyKey }
      : { count: 1, lastCompletedKey: dailyKey };
  write('streak', next);
  return next;
}

export function getHintDay(): HintDay {
  return read<HintDay>('hintDay', { key: '', usedFree: false });
}

/** Returns true if free hint still available for this PKT day. */
export function canUseFreeHint(dailyKey: string): boolean {
  const h = getHintDay();
  if (h.key !== dailyKey) return true;
  return !h.usedFree;
}

export function markFreeHintUsed(dailyKey: string): void {
  write('hintDay', { key: dailyKey, usedFree: true });
}

export function clearAllPersist(): void {
  if (!canUseStorage()) return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k);
  }
  for (const k of keys) localStorage.removeItem(k);
}
