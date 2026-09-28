import { conflictsWithPeers } from './grid';
import type { Board, CellValue, Digit } from './types';
import { cloneBoard } from './types';
import type { RngFn } from './rng';
import { shuffleInPlace } from './rng';

/**
 * Count solutions up to `limit` (typically 2 for uniqueness).
 * Mutates a working copy; returns count found (capped at limit).
 */
export function countSolutions(board: Board, limit: number = 2): number {
  const work = cloneBoard(board);
  let found = 0;

  function findEmpty(): number {
    let best = -1;
    let bestCount = 10;
    for (let i = 0; i < 81; i++) {
      if (work[i] !== 0) continue;
      let n = 0;
      for (let d = 1; d <= 9; d++) {
        if (!conflictsWithPeers(work, i, d as Digit)) n++;
      }
      if (n < bestCount) {
        bestCount = n;
        best = i;
        if (n <= 1) return i;
      }
    }
    return best;
  }

  function dfs(): boolean {
    if (found >= limit) return true;
    const i = findEmpty();
    if (i < 0) {
      found++;
      return found >= limit;
    }
    for (let d = 1; d <= 9; d++) {
      const digit = d as Digit;
      if (conflictsWithPeers(work, i, digit)) continue;
      work[i] = digit;
      if (dfs()) return true;
      work[i] = 0;
    }
    return false;
  }

  dfs();
  return found;
}

/** True iff the puzzle has exactly one solution. */
export function hasUniqueSolution(board: Board): boolean {
  return countSolutions(board, 2) === 1;
}

/**
 * Solve a puzzle; returns solution board or null if unsolvable / not unique when requireUnique.
 */
export function solve(board: Board, requireUnique: boolean = false): Board | null {
  const work = cloneBoard(board);
  let solution: Board | null = null;
  let count = 0;

  function findEmpty(): number {
    let best = -1;
    let bestCount = 10;
    for (let i = 0; i < 81; i++) {
      if (work[i] !== 0) continue;
      let n = 0;
      for (let d = 1; d <= 9; d++) {
        if (!conflictsWithPeers(work, i, d as Digit)) n++;
      }
      if (n < bestCount) {
        bestCount = n;
        best = i;
        if (n === 0) return i;
      }
    }
    return best;
  }

  function dfs(): boolean {
    if (count > 1 && requireUnique) return true;
    const i = findEmpty();
    if (i < 0) {
      count++;
      if (count === 1) solution = cloneBoard(work);
      return requireUnique && count > 1;
    }
    for (let d = 1; d <= 9; d++) {
      const digit = d as Digit;
      if (conflictsWithPeers(work, i, digit)) continue;
      work[i] = digit;
      if (dfs()) return true;
      work[i] = 0;
    }
    return false;
  }

  dfs();
  if (requireUnique && count !== 1) return null;
  return solution;
}

/**
 * Fill an empty board into a complete valid grid using seeded RNG.
 * Strategy: fill diagonal 3×3 boxes independently, then solve the rest.
 */
export function fillCompleteGrid(rng: RngFn): Board {
  const board: Board = Array.from({ length: 81 }, () => 0 as CellValue);

  for (let box = 0; box < 3; box++) {
    const digits = shuffleInPlace([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[], rng);
    let k = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        board[(box * 3 + r) * 9 + (box * 3 + c)] = digits[k++]!;
      }
    }
  }

  function findEmpty(): number {
    for (let i = 0; i < 81; i++) if (board[i] === 0) return i;
    return -1;
  }

  function dfs(): boolean {
    const i = findEmpty();
    if (i < 0) return true;
    const digits = shuffleInPlace([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[], rng);
    for (const d of digits) {
      if (conflictsWithPeers(board, i, d)) continue;
      board[i] = d;
      if (dfs()) return true;
      board[i] = 0;
    }
    return false;
  }

  if (!dfs()) {
    throw new Error('fillCompleteGrid failed');
  }
  return board;
}

/** Convenience: first empty cell index or -1. */
export function firstEmpty(board: Board): number {
  for (let i = 0; i < 81; i++) if (board[i] === 0) return i;
  return -1;
}
