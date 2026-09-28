import type { Board, CellValue, Digit } from './types';

export function idx(r: number, c: number): number {
  return r * 9 + c;
}

export function rowOf(i: number): number {
  return (i / 9) | 0;
}

export function colOf(i: number): number {
  return i % 9;
}

export function boxOf(i: number): number {
  const r = rowOf(i);
  const c = colOf(i);
  return ((r / 3) | 0) * 3 + ((c / 3) | 0);
}

/** True if placing val at i conflicts with any peer (row/col/box). */
export function conflictsWithPeers(board: Board, i: number, val: Digit): boolean {
  const r = rowOf(i);
  const c = colOf(i);
  const br = ((r / 3) | 0) * 3;
  const bc = ((c / 3) | 0) * 3;
  for (let k = 0; k < 9; k++) {
    if (board[idx(r, k)] === val && k !== c) return true;
    if (board[idx(k, c)] === val && k !== r) return true;
  }
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      const j = idx(br + dr, bc + dc);
      if (j !== i && board[j] === val) return true;
    }
  }
  return false;
}

/** Cells that share row, col, or box with i (excluding i). */
export function peerIndices(i: number): number[] {
  const peers: number[] = [];
  const r = rowOf(i);
  const c = colOf(i);
  const br = ((r / 3) | 0) * 3;
  const bc = ((c / 3) | 0) * 3;
  const seen = new Set<number>([i]);
  for (let k = 0; k < 9; k++) {
    const a = idx(r, k);
    const b = idx(k, c);
    if (!seen.has(a)) {
      peers.push(a);
      seen.add(a);
    }
    if (!seen.has(b)) {
      peers.push(b);
      seen.add(b);
    }
  }
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      const j = idx(br + dr, bc + dc);
      if (!seen.has(j)) {
        peers.push(j);
        seen.add(j);
      }
    }
  }
  return peers;
}

/**
 * Conflict set: indices whose current non-zero value duplicates a peer.
 * Used for UI highlight.
 */
export function findConflictCells(board: Board): Set<number> {
  const bad = new Set<number>();
  for (let i = 0; i < 81; i++) {
    const v = board[i]!;
    if (v === 0) continue;
    if (conflictsWithPeers(board, i, v as Digit)) bad.add(i);
  }
  return bad;
}

export function isCompleteAndValid(board: Board): boolean {
  for (let i = 0; i < 81; i++) {
    const v = board[i]!;
    if (v < 1 || v > 9) return false;
    if (conflictsWithPeers(board, i, v as Digit)) return false;
  }
  return true;
}

export function countClues(board: Board): number {
  let n = 0;
  for (let i = 0; i < 81; i++) if (board[i]! !== 0) n++;
  return n;
}

export function boardToString(board: Board): string {
  return board.map((v) => (v === 0 ? '.' : String(v))).join('');
}

export function stringToBoard(s: string): Board {
  const b: Board = [];
  for (let i = 0; i < 81; i++) {
    const ch = s[i] ?? '.';
    if (ch === '.' || ch === '0') b.push(0);
    else b.push(Number(ch) as CellValue);
  }
  return b;
}
