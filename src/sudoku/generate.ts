import { countClues } from './grid';
import { createSeededRng, shuffleInPlace, type RngFn } from './rng';
import { fillCompleteGrid, hasUniqueSolution } from './solve';
import {
  CLUE_TARGETS,
  DAILY_CLUE_TARGET,
  cloneBoard,
  type Board,
  type Difficulty,
  type Puzzle,
} from './types';

const MAX_DIG_ATTEMPTS = 400;

/**
 * Dig holes from a full solution until clue target, keeping uniqueness.
 * Tries removals in random order; skips if uniqueness breaks.
 */
export function digPuzzle(
  solution: Board,
  clueTarget: number,
  rng: RngFn,
): Board {
  const puzzle = cloneBoard(solution);
  const order = shuffleInPlace(
    Array.from({ length: 81 }, (_, i) => i),
    rng,
  );

  let attempts = 0;
  for (const i of order) {
    if (countClues(puzzle) <= clueTarget) break;
    if (attempts >= MAX_DIG_ATTEMPTS) break;
    attempts++;
    const saved = puzzle[i]!;
    if (saved === 0) continue;
    puzzle[i] = 0;
    if (!hasUniqueSolution(puzzle)) {
      puzzle[i] = saved;
    }
  }
  return puzzle;
}

export function generatePuzzle(
  difficulty: Difficulty,
  seedKey: string,
): Puzzle {
  const rng = createSeededRng(seedKey);
  const solution = fillCompleteGrid(rng);
  const clueTarget =
    difficulty === 'daily'
      ? DAILY_CLUE_TARGET
      : CLUE_TARGETS[difficulty];
  const givens = digPuzzle(solution, clueTarget, rng);
  return { givens, solution, difficulty, seedKey };
}

/** Random (non-daily) puzzle — seed includes difficulty + entropy string. */
export function generateRandom(
  difficulty: Exclude<Difficulty, 'daily'>,
  entropy: string = String(Date.now()),
): Puzzle {
  return generatePuzzle(difficulty, `dailysudoku|${difficulty}|${entropy}`);
}
