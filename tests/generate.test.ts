import { describe, expect, it } from 'vitest';
import {
  CLUE_TARGETS,
  countClues,
  generatePuzzle,
  generateRandom,
  hasUniqueSolution,
  isCompleteAndValid,
} from '../src/sudoku';

describe('generate uniqueness smoke', () => {
  it('easy puzzle is unique and matches solution', () => {
    const p = generatePuzzle('easy', 'dailysudoku|test|easy|1');
    expect(hasUniqueSolution(p.givens)).toBe(true);
    expect(isCompleteAndValid(p.solution)).toBe(true);
    expect(countClues(p.givens)).toBeLessThanOrEqual(CLUE_TARGETS.easy + 5);
    expect(countClues(p.givens)).toBeGreaterThanOrEqual(CLUE_TARGETS.easy - 8);
    for (let i = 0; i < 81; i++) {
      if (p.givens[i]! !== 0) expect(p.givens[i]).toBe(p.solution[i]);
    }
  });

  it('medium and hard generate unique boards', () => {
    for (const diff of ['medium', 'hard'] as const) {
      const p = generatePuzzle(diff, `dailysudoku|test|${diff}|2`);
      expect(hasUniqueSolution(p.givens)).toBe(true);
      expect(isCompleteAndValid(p.solution)).toBe(true);
      expect(countClues(p.givens)).toBeGreaterThan(20);
    }
  });

  it('generateRandom returns requested difficulty', () => {
    const p = generateRandom('easy', 'fixed-entropy');
    expect(p.difficulty).toBe('easy');
    expect(hasUniqueSolution(p.givens)).toBe(true);
  });
});
