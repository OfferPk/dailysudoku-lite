import { describe, expect, it } from 'vitest';
import {
  conflictsWithPeers,
  findConflictCells,
  isCompleteAndValid,
  stringToBoard,
  validateBoard,
} from '../src/sudoku';

describe('validate', () => {
  it('detects row conflict', () => {
    const b = stringToBoard('.'.repeat(81));
    b[0] = 5;
    b[1] = 5;
    expect(conflictsWithPeers(b, 0, 5)).toBe(true);
    expect(findConflictCells(b).has(0)).toBe(true);
    expect(findConflictCells(b).has(1)).toBe(true);
  });

  it('detects box conflict without row/col share', () => {
    const b = stringToBoard('.'.repeat(81));
    b[0] = 7; // r0c0
    b[20] = 7; // r2c2 same box
    expect(conflictsWithPeers(b, 20, 7)).toBe(true);
    const v = validateBoard(b);
    expect(v.ok).toBe(false);
    expect(v.conflicts.length).toBeGreaterThanOrEqual(2);
  });

  it('accepts a known valid complete grid', () => {
    // Classic valid completed sudoku
    const s =
      '534678912672195348198342567' +
      '859761423426853791713924856' +
      '961537284287419635345286179';
    const b = stringToBoard(s);
    expect(isCompleteAndValid(b)).toBe(true);
    expect(validateBoard(b).ok).toBe(true);
    expect(validateBoard(b).clues).toBe(81);
  });

  it('rejects incomplete board as not complete', () => {
    const b = stringToBoard('534678912' + '.'.repeat(72));
    expect(isCompleteAndValid(b)).toBe(false);
    expect(validateBoard(b).ok).toBe(true); // no conflicts yet
  });
});
