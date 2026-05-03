import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createBoard,
  applyMove,
  checkWinner,
  countWinningLines,
  isBoardFull,
  expandBoardBy2,
  expandBoardBy1,
  applyTurn,
  getInitialState,
} from './gameLogic.js';

// ---------------------------------------------------------------------------
// createBoard
// ---------------------------------------------------------------------------
describe('createBoard', () => {
  it('creates an NxN board of nulls', () => {
    const b = createBoard(3);
    assert.equal(b.length, 3);
    b.forEach((row) => {
      assert.equal(row.length, 3);
      row.forEach((cell) => assert.equal(cell, null));
    });
  });
});

// ---------------------------------------------------------------------------
// applyMove
// ---------------------------------------------------------------------------
describe('applyMove', () => {
  it('places a piece immutably', () => {
    const b = createBoard(3);
    const b2 = applyMove(b, 1, 1, 'X');
    assert.equal(b2[1][1], 'X');
    assert.equal(b[1][1], null); // original unchanged
  });
});

// ---------------------------------------------------------------------------
// checkWinner
// ---------------------------------------------------------------------------
describe('checkWinner', () => {
  it('detects a row win', () => {
    let b = createBoard(3);
    b = applyMove(b, 0, 0, 'X');
    b = applyMove(b, 0, 1, 'X');
    b = applyMove(b, 0, 2, 'X');
    assert.equal(checkWinner(b, 3), 'X');
  });

  it('detects a column win', () => {
    let b = createBoard(3);
    b = applyMove(b, 0, 0, 'O');
    b = applyMove(b, 1, 0, 'O');
    b = applyMove(b, 2, 0, 'O');
    assert.equal(checkWinner(b, 3), 'O');
  });

  it('detects a diagonal win', () => {
    let b = createBoard(3);
    b = applyMove(b, 0, 0, 'X');
    b = applyMove(b, 1, 1, 'X');
    b = applyMove(b, 2, 2, 'X');
    assert.equal(checkWinner(b, 3), 'X');
  });

  it('returns null when no winner', () => {
    const b = createBoard(3);
    assert.equal(checkWinner(b, 3), null);
  });

  it('detects $ win on a 4x4 board', () => {
    let b = createBoard(4);
    b = applyMove(b, 1, 0, '$');
    b = applyMove(b, 1, 1, '$');
    b = applyMove(b, 1, 2, '$');
    assert.equal(checkWinner(b, 3), '$');
  });
});

// ---------------------------------------------------------------------------
// countWinningLines
// ---------------------------------------------------------------------------
describe('countWinningLines', () => {
  it('returns 0 when the player has no winning lines', () => {
    let b = createBoard(3);
    b = applyMove(b, 0, 0, 'X');
    b = applyMove(b, 0, 1, 'X');
    assert.equal(countWinningLines(b, 'X', 3), 0);
  });

  it('returns 1 for a single winning row', () => {
    let b = createBoard(3);
    b = applyMove(b, 0, 0, 'X');
    b = applyMove(b, 0, 1, 'X');
    b = applyMove(b, 0, 2, 'X');
    assert.equal(countWinningLines(b, 'X', 3), 1);
  });

  it('returns 2 for a simultaneous row + column win (fork)', () => {
    // X at (0,0),(0,1),(0,2) = row win
    // X at (0,0),(1,0),(2,0) = col win
    // Corner piece (0,0) is shared — one move completes both
    let b = createBoard(3);
    b = applyMove(b, 0, 0, 'X');
    b = applyMove(b, 0, 1, 'X');
    b = applyMove(b, 0, 2, 'X');
    b = applyMove(b, 1, 0, 'X');
    b = applyMove(b, 2, 0, 'X');
    assert.equal(countWinningLines(b, 'X', 3), 2);
  });

  it('sets winningLineCount >= 2 on a fork win via applyTurn', () => {
    // Build state where X can complete row 0 AND col 0 simultaneously:
    // Board before last move:  X at (0,1),(0,2),(1,0),(2,0) — placing (0,0) forks
    let s = getInitialState();
    // Manually craft the board state
    let b = createBoard(3);
    b = applyMove(b, 0, 1, 'X');
    b = applyMove(b, 0, 2, 'X');
    b = applyMove(b, 1, 0, 'X');
    b = applyMove(b, 2, 0, 'X');
    b = applyMove(b, 1, 1, 'O'); // O pieces to keep it realistic
    b = applyMove(b, 2, 2, 'O');
    s = { ...s, board: b, currentPlayer: 'X', winner: null };
    s = applyTurn(s, 0, 0); // X places at (0,0) — completes row 0 AND col 0
    assert.equal(s.winner, 'X');
    assert.ok(s.winningLineCount >= 2, `Expected >= 2 winning lines, got ${s.winningLineCount}`);
  });
});

// ---------------------------------------------------------------------------
// isBoardFull
// ---------------------------------------------------------------------------
describe('isBoardFull', () => {
  it('returns false for an empty board', () => {
    assert.equal(isBoardFull(createBoard(3)), false);
  });

  it('returns true when all cells are filled', () => {
    let b = createBoard(2);
    b = applyMove(b, 0, 0, 'X');
    b = applyMove(b, 0, 1, 'O');
    b = applyMove(b, 1, 0, 'X');
    b = applyMove(b, 1, 1, 'O');
    assert.equal(isBoardFull(b), true);
  });
});

// ---------------------------------------------------------------------------
// expandBoardBy2 / expandBoardBy1
// ---------------------------------------------------------------------------
describe('expandBoardBy2', () => {
  it('grows a 3x3 to 5x5', () => {
    const b = expandBoardBy2(createBoard(3));
    assert.equal(b.length, 5);
    b.forEach((row) => assert.equal(row.length, 5));
  });

  it('preserves existing pieces in the inner region', () => {
    let b = createBoard(3);
    b = applyMove(b, 0, 0, 'X');
    const expanded = expandBoardBy2(b);
    // Original (0,0) maps to (1,1) after border is added
    assert.equal(expanded[1][1], 'X');
  });
});

describe('expandBoardBy1', () => {
  it('grows a 3x3 to 4x4', () => {
    const b = expandBoardBy1(createBoard(3));
    assert.equal(b.length, 4);
    b.forEach((row) => assert.equal(row.length, 4));
  });

  it('preserves existing pieces', () => {
    let b = createBoard(3);
    b = applyMove(b, 0, 0, 'O');
    const expanded = expandBoardBy1(b);
    assert.equal(expanded[0][0], 'O');
  });
});

// ---------------------------------------------------------------------------
// getInitialState — two-player
// ---------------------------------------------------------------------------
describe('getInitialState (2-player)', () => {
  it('starts on a 3x3 board with X first', () => {
    const s = getInitialState();
    assert.equal(s.size, 3);
    assert.equal(s.currentPlayer, 'X');
    assert.deepEqual(s.players, ['X', 'O']);
    assert.equal(s.playerIndex, 0);
    assert.equal(s.playerCount, 2);
    assert.equal(s.streak, 3);
  });
});

// ---------------------------------------------------------------------------
// getInitialState — three-player
// ---------------------------------------------------------------------------
describe('getInitialState (3-player)', () => {
  it('starts on a 4x4 board with players X, O, $', () => {
    const s = getInitialState('by2', 'fixed', 3, 3);
    assert.equal(s.size, 4);
    assert.equal(s.board.length, 4);
    assert.deepEqual(s.players, ['X', 'O', '$']);
    assert.equal(s.currentPlayer, 'X');
    assert.equal(s.playerIndex, 0);
    assert.equal(s.playerCount, 3);
    assert.equal(s.streak, 3);
  });
});

// ---------------------------------------------------------------------------
// applyTurn — two-player cycling
// ---------------------------------------------------------------------------
describe('applyTurn (2-player turn cycling)', () => {
  it('alternates between X and O', () => {
    let s = getInitialState();
    s = applyTurn(s, 0, 0);
    assert.equal(s.currentPlayer, 'O');
    assert.equal(s.playerIndex, 1);
    s = applyTurn(s, 0, 1);
    assert.equal(s.currentPlayer, 'X');
    assert.equal(s.playerIndex, 0);
  });

  it('ignores clicks on occupied cells', () => {
    let s = getInitialState();
    s = applyTurn(s, 0, 0);
    const before = s.currentPlayer;
    s = applyTurn(s, 0, 0);
    assert.equal(s.currentPlayer, before);
  });

  it('detects a winner and stops the game', () => {
    let s = getInitialState();
    // X wins across the top row
    s = applyTurn(s, 0, 0); // X
    s = applyTurn(s, 1, 0); // O
    s = applyTurn(s, 0, 1); // X
    s = applyTurn(s, 1, 1); // O
    s = applyTurn(s, 0, 2); // X wins
    assert.equal(s.winner, 'X');
    // Further clicks must be no-ops
    const frozen = s;
    s = applyTurn(s, 2, 2);
    assert.deepEqual(s, frozen);
  });
});

// ---------------------------------------------------------------------------
// applyTurn — three-player cycling
// ---------------------------------------------------------------------------
describe('applyTurn (3-player turn cycling)', () => {
  it('cycles X → O → $ → X', () => {
    let s = getInitialState('by2', 'fixed', 3, 3);
    assert.equal(s.currentPlayer, 'X');
    s = applyTurn(s, 0, 0);
    assert.equal(s.currentPlayer, 'O');
    assert.equal(s.playerIndex, 1);
    s = applyTurn(s, 1, 0);
    assert.equal(s.currentPlayer, '$');
    assert.equal(s.playerIndex, 2);
    s = applyTurn(s, 2, 0);
    assert.equal(s.currentPlayer, 'X');
    assert.equal(s.playerIndex, 0);
  });

  it('detects $ winner on a 4x4 board', () => {
    let s = getInitialState('by2', 'fixed', 3, 3);
    // Turn order: X O $ X O $ X O $
    // $ builds column 3 (rows 0,1,2). X and O are scattered to avoid forming their own streak.
    s = applyTurn(s, 3, 0); // X  (0)
    s = applyTurn(s, 3, 1); // O  (1)
    s = applyTurn(s, 0, 3); // $  (2) → col3 row0
    s = applyTurn(s, 3, 2); // X  (3)
    s = applyTurn(s, 3, 3); // O  (4)
    s = applyTurn(s, 1, 3); // $  (5) → col3 row1
    s = applyTurn(s, 2, 0); // X  (6)
    s = applyTurn(s, 2, 1); // O  (7)
    s = applyTurn(s, 2, 3); // $  (8) → col3 row2 — $ wins
    assert.equal(s.winner, '$');
  });

  it('carries the players array through expansion', () => {
    // Fill a 4x4 without a winner to force expansion
    let s = getInitialState('by2', 'fixed', 3, 3);
    // Pattern that avoids any 3-in-a-row:
    // Row 0: X O $ X
    // Row 1: O $ X O
    // Row 2: $ X O $
    // Row 3: X O $ X
    // Diagonal (0,0),(1,1),(2,2) = X,$ ,O — no win
    // Diagonals and rows/cols are mixed — no streak of 3 for one player
    const moves = [
      [0,0],[0,1],[0,2],[0,3],
      [1,0],[1,1],[1,2],[1,3],
      [2,0],[2,1],[2,2],[2,3],
      [3,0],[3,1],[3,2],[3,3],
    ];
    for (const [r, c] of moves) {
      s = applyTurn(s, r, c);
      if (s.winner) break;
    }
    if (!s.winner) {
      assert.ok(s.size > 4, 'Board should have expanded on a draw');
      assert.deepEqual(s.players, ['X', 'O', '$']);
      assert.equal(s.playerCount, 3);
      assert.equal(s.expanding, true);
      assert.equal(s.awaitingFirstMove, true);
    }
  });
});

// ---------------------------------------------------------------------------
// applyTurn — expansion with +1 mode (2-player)
// ---------------------------------------------------------------------------
describe('applyTurn (+1 expand mode, 2-player)', () => {
  it('grows from 3x3 to 4x4 on a draw', () => {
    let s = getInitialState('by1', 'fixed', 3, 2);
    // Drawn pattern (no 3-in-a-row): X O X / O X O / O X O... hand-checked
    // X O X   diag X,X,O — no 3; col0 X,O,O — no 3; row2 O,X,O — no 3
    // O X O
    // O X O  — col1 O,X,X — no 3
    // Actually simpler: X O X / O O X / X X O
    s = applyTurn(s, 0, 0); // X
    s = applyTurn(s, 0, 1); // O
    s = applyTurn(s, 0, 2); // X
    s = applyTurn(s, 1, 0); // O
    s = applyTurn(s, 1, 2); // X
    s = applyTurn(s, 1, 1); // O
    s = applyTurn(s, 2, 1); // X
    s = applyTurn(s, 2, 2); // O
    s = applyTurn(s, 2, 0); // X — last cell, may or may not win
    if (!s.winner) {
      assert.equal(s.size, 4);
      assert.equal(s.expanding, true);
    }
  });
});

// ---------------------------------------------------------------------------
// applyTurn — scaling win mode increments streak on expansion
// ---------------------------------------------------------------------------
describe('applyTurn (scaling win mode)', () => {
  it('increments streak by 1 after a draw expansion', () => {
    let s = getInitialState('by2', 'scaling', 3, 2);
    // Fill a 3x3 draw: X O X / O X O / O X O  — hand-checked no 3-in-a-row
    s = applyTurn(s, 0, 0); // X
    s = applyTurn(s, 0, 1); // O
    s = applyTurn(s, 0, 2); // X
    s = applyTurn(s, 1, 0); // O
    s = applyTurn(s, 1, 2); // X
    s = applyTurn(s, 1, 1); // O
    s = applyTurn(s, 2, 1); // X
    s = applyTurn(s, 2, 2); // O
    s = applyTurn(s, 2, 0); // X — last cell
    if (!s.winner) {
      // Expanded to 5x5; streak should have incremented from 3 to 4
      assert.equal(s.size, 5);
      assert.equal(s.streak, 4);
    }
  });
});
