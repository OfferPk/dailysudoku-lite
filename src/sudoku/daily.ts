import { hashStringToUint32 } from './rng';
import { generatePuzzle } from './generate';
import type { Puzzle } from './types';

/**
 * Calendar date YYYY-MM-DD in Asia/Karachi (UTC+5).
 * Explicit offset — not browser-local — for testability.
 */
export function dailyKeyKarachi(now: Date = new Date()): string {
  const utcMs = now.getTime();
  const karachiMs = utcMs + 5 * 60 * 60 * 1000;
  const d = new Date(karachiMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dailySeedKey(dailyKey: string): string {
  return `dailysudoku-daily|${dailyKey}`;
}

export function dailySeedUint32(dailyKey: string): number {
  return hashStringToUint32(dailySeedKey(dailyKey));
}

/** Deterministic daily puzzle for a PKT calendar date. */
export function generateDaily(dailyKey: string = dailyKeyKarachi()): Puzzle {
  return generatePuzzle('daily', dailySeedKey(dailyKey));
}

export { hashStringToUint32 };
