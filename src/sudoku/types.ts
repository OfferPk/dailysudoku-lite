/** Classic 9×9 Sudoku types. Cell value 0 = empty; 1–9 filled. */

export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type CellValue = 0 | Digit;

/** Flat 81-length board, row-major. */
export type Board = CellValue[];

export type Difficulty = 'easy' | 'medium' | 'hard' | 'daily';

/** Clue count targets per difficulty (remaining givens after dig). */
export const CLUE_TARGETS: Record<Exclude<Difficulty, 'daily'>, number> = {
  easy: 42,
  medium: 34,
  hard: 26,
};

/** Daily uses medium-ish clue count for a fair daily. */
export const DAILY_CLUE_TARGET = 32;

export interface Puzzle {
  /** Givens (fixed clues). */
  givens: Board;
  /** Full unique solution. */
  solution: Board;
  difficulty: Difficulty;
  seedKey: string;
}

/** Pencil marks: bitset per cell, bit (d-1) set means candidate d. */
export type Notes = number[];

export function emptyBoard(): Board {
  return Array.from({ length: 81 }, () => 0 as CellValue);
}

export function emptyNotes(): Notes {
  return Array.from({ length: 81 }, () => 0);
}

export function cloneBoard(b: Board): Board {
  return b.slice() as Board;
}
