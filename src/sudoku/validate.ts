import { conflictsWithPeers, countClues, findConflictCells, isCompleteAndValid } from './grid';
import { countSolutions, hasUniqueSolution } from './solve';
import type { Board, Digit } from './types';

export {
  conflictsWithPeers,
  countClues,
  findConflictCells,
  isCompleteAndValid,
  countSolutions,
  hasUniqueSolution,
};

/** Row / col / box uniqueness checks for a partial or full board. */
export function validateBoard(board: Board): {
  ok: boolean;
  conflicts: number[];
  clues: number;
  unique?: boolean;
} {
  const conflicts = [...findConflictCells(board)];
  const clues = countClues(board);
  const ok = conflicts.length === 0;
  return { ok, conflicts, clues };
}

/** Can digit be legally placed at i given current board (ignoring board[i])? */
export function canPlace(board: Board, i: number, digit: Digit): boolean {
  const prev = board[i]!;
  board[i] = 0;
  const ok = !conflictsWithPeers(board, i, digit);
  board[i] = prev;
  return ok;
}
