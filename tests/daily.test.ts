import { describe, expect, it } from 'vitest';
import {
  boardToString,
  dailyKeyKarachi,
  dailySeedKey,
  dailySeedUint32,
  generateDaily,
} from '../src/sudoku';

describe('daily PKT seed', () => {
  it('dailyKeyKarachi uses UTC+5 calendar day', () => {
    // 2026-09-27 22:00 UTC = 2026-09-28 03:00 PKT
    const d = new Date('2026-09-27T22:00:00.000Z');
    expect(dailyKeyKarachi(d)).toBe('2026-09-28');
    // 2026-09-27 18:00 UTC = 2026-09-27 23:00 PKT
    const d2 = new Date('2026-09-27T18:00:00.000Z');
    expect(dailyKeyKarachi(d2)).toBe('2026-09-27');
  });

  it('seed key and uint32 are stable for a date', () => {
    const key = '2026-09-28';
    expect(dailySeedKey(key)).toBe('dailysudoku-daily|2026-09-28');
    expect(dailySeedUint32(key)).toBe(dailySeedUint32(key));
    expect(dailySeedUint32(key)).not.toBe(dailySeedUint32('2026-09-29'));
  });

  it('same PKT date yields identical board (determinism)', () => {
    const key = '2026-03-15';
    const a = generateDaily(key);
    const b = generateDaily(key);
    expect(boardToString(a.givens)).toBe(boardToString(b.givens));
    expect(boardToString(a.solution)).toBe(boardToString(b.solution));
    expect(a.difficulty).toBe('daily');
    expect(a.seedKey).toBe(dailySeedKey(key));
  });

  it('different dates yield different puzzles (smoke)', () => {
    const a = boardToString(generateDaily('2026-01-01').givens);
    const b = boardToString(generateDaily('2026-01-02').givens);
    expect(a).not.toBe(b);
  });
});
