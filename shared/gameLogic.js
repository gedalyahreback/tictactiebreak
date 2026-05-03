// Expanding Tic Tac Toe — Shared Game Logic
// Framework-agnostic pure JS. No DOM or React Native runtime required.

/**
 * Creates a 2D array of null values representing an empty board.
 * @param {number} size - Board dimension (must be odd: 3, 5, 7, …)
 * @returns {Array<Array<null>>}
 */
export function createBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

/**
 * Returns a new board with the player's move applied at (row, col).
 * Does not mutate the original board.
 * @param {Array<Array<string|null>>} board
 * @param {number} row
 * @param {number} col
 * @param {'X'|'O'} player
 * @returns {Array<Array<string|null>>}
 */
export function applyMove(board, row, col, player) {
  return board.map((r, ri) =>
    r.map((cell, ci) => (ri === row && ci === col ? player : cell))
  );
}

/**
 * Checks the board for a streak-in-a-row win in any row, column, or diagonal.
 * @param {Array<Array<string|null>>} board
 * @param {number} [streak=3] - Number of consecutive identical marks required to win.
 * @returns {'X'|'O'|null}
 */
export function checkWinner(board, streak = 3) {
  const size = board.length;

  const checkLine = (cells) => {
    for (let i = 0; i <= cells.length - streak; i++) {
      const first = cells[i];
      if (!first) continue;
      let count = 1;
      while (count < streak && cells[i + count] === first) count++;
      if (count === streak) return first;
    }
    return null;
  };

  // Rows
  for (let r = 0; r < size; r++) {
    const winner = checkLine(board[r]);
    if (winner) return winner;
  }

  // Columns
  for (let c = 0; c < size; c++) {
    const col = board.map((row) => row[c]);
    const winner = checkLine(col);
    if (winner) return winner;
  }

  // Diagonals (top-left to bottom-right)
  for (let startRow = 0; startRow <= size - streak; startRow++) {
    for (let startCol = 0; startCol <= size - streak; startCol++) {
      const diag = [];
      for (let i = 0; startRow + i < size && startCol + i < size; i++) {
        diag.push(board[startRow + i][startCol + i]);
      }
      const winner = checkLine(diag);
      if (winner) return winner;
    }
  }

  // Diagonals (top-right to bottom-left)
  for (let startRow = 0; startRow <= size - streak; startRow++) {
    for (let startCol = streak - 1; startCol < size; startCol++) {
      const diag = [];
      for (let i = 0; startRow + i < size && startCol - i >= 0; i++) {
        diag.push(board[startRow + i][startCol - i]);
      }
      const winner = checkLine(diag);
      if (winner) return winner;
    }
  }

  return null;
}

/**
 * Counts the number of distinct winning lines (rows, columns, diagonals) that contain
 * a complete streak for the given player. Used to detect double-win (fork) victories.
 * @param {Array<Array<string|null>>} board
 * @param {string} player
 * @param {number} streak
 * @returns {number}
 */
export function countWinningLines(board, player, streak) {
  const size = board.length;
  let count = 0;

  const lineHasWin = (cells) => {
    for (let i = 0; i <= cells.length - streak; i++) {
      if (cells[i] !== player) continue;
      let k = 1;
      while (k < streak && cells[i + k] === player) k++;
      if (k === streak) return true;
    }
    return false;
  };

  // Rows
  for (let r = 0; r < size; r++) {
    if (lineHasWin(board[r])) count++;
  }

  // Columns
  for (let c = 0; c < size; c++) {
    if (lineHasWin(board.map((row) => row[c]))) count++;
  }

  // Diagonals (top-left → bottom-right)
  for (let startRow = 0; startRow <= size - streak; startRow++) {
    for (let startCol = 0; startCol <= size - streak; startCol++) {
      const diag = [];
      for (let i = 0; startRow + i < size && startCol + i < size; i++) {
        diag.push(board[startRow + i][startCol + i]);
      }
      if (lineHasWin(diag)) count++;
    }
  }

  // Diagonals (top-right → bottom-left)
  for (let startRow = 0; startRow <= size - streak; startRow++) {
    for (let startCol = streak - 1; startCol < size; startCol++) {
      const diag = [];
      for (let i = 0; startRow + i < size && startCol - i >= 0; i++) {
        diag.push(board[startRow + i][startCol - i]);
      }
      if (lineHasWin(diag)) count++;
    }
  }

  return count;
}

/**
 * Returns true if every cell on the board is occupied.
 * @param {Array<Array<string|null>>} board
 * @returns {boolean}
 */
export function isBoardFull(board) {
  return board.every((row) => row.every((cell) => cell !== null));
}

/**
 * Grows the board by 2 in each dimension (N×N → (N+2)×(N+2)).
 * The old board is centered — one column/row of nulls is added on every side.
 * @param {Array<Array<string|null>>} board
 * @returns {Array<Array<string|null>>}
 */
export function expandBoardBy2(board) {
  const oldSize = board.length;
  const newSize = oldSize + 2;
  const newBoard = createBoard(newSize);
  for (let r = 0; r < oldSize; r++) {
    for (let c = 0; c < oldSize; c++) {
      newBoard[r + 1][c + 1] = board[r][c];
    }
  }
  return newBoard;
}

/**
 * Grows the board by 1 in each dimension (N×N → (N+1)×(N+1)).
 * The old board is anchored to the top-left; a new column is added on the right
 * and a new row is added at the bottom.
 * @param {Array<Array<string|null>>} board
 * @returns {Array<Array<string|null>>}
 */
export function expandBoardBy1(board) {
  const oldSize = board.length;
  const newSize = oldSize + 1;
  const newBoard = createBoard(newSize);
  for (let r = 0; r < oldSize; r++) {
    for (let c = 0; c < oldSize; c++) {
      newBoard[r][c] = board[r][c];
    }
  }
  return newBoard;
}

/**
 * Returns the initial game state.
 * @param {'by2'|'by1'} [expandMode='by2']
 * @param {'fixed'|'scaling'|'manual'} [winMode='fixed']
 * @param {number} [streak=3]
 * @param {2|3} [playerCount=2] - Number of players. 3-player uses ['X','O','$'] and starts on a 4×4 board.
 * @returns {object}
 */
export function getInitialState(expandMode = 'by2', winMode = 'fixed', streak = 3, playerCount = 2) {
  const players   = playerCount === 3 ? ['X', 'O', '$'] : ['X', 'O'];
  const startSize = playerCount === 3 ? 4 : 3;
  return {
    board: createBoard(startSize),
    players,
    playerIndex: 0,
    currentPlayer: players[0],
    winner: null,
    size: startSize,
    expanding: false,
    awaitingFirstMove: false,
    expandMode,
    winMode,
    streak,
    playerCount,
  };
}

/**
 * Applies a full turn: validates the move, checks for a winner, expands the board on a draw.
 * Returns the updated state (immutable — does not mutate the input state).
 *
 * Win streak behaviour on expansion:
 *   - 'fixed'   → streak never changes.
 *   - 'scaling' → streak increments by 1, capped at newSize - 1.
 *   - 'manual'  → streak is preserved as-is; the UI is responsible for updating it post-expansion.
 *
 * `awaitingFirstMove` is true for the entire window between an expansion and the first subsequent
 * move. The UI uses this to keep the streak input unlocked for manual editing before play resumes.
 *
 * @param {object} state
 * @param {number} row
 * @param {number} col
 * @returns {object}
 */
export function applyTurn(state, row, col) {
  const { board, currentPlayer, winner, expandMode, winMode, streak, players, playerIndex } = state;

  // Ignore moves on occupied cells or after game is over
  if (winner || board[row][col] !== null) return state;

  const newBoard    = applyMove(board, row, col, currentPlayer);
  const newWinner   = checkWinner(newBoard, streak);
  const nextIndex   = (playerIndex + 1) % players.length;
  const nextPlayer  = players[nextIndex];

  if (newWinner) {
    const winningLineCount = countWinningLines(newBoard, newWinner, streak);
    return { ...state, board: newBoard, winner: newWinner, winningLineCount, expanding: false, awaitingFirstMove: false };
  }

  if (isBoardFull(newBoard)) {
    // Draw — expand the board; turn passes to the next player as normal.
    const expanded = expandMode === 'by1'
      ? expandBoardBy1(newBoard)
      : expandBoardBy2(newBoard);
    const newSize = expanded.length;

    // Compute next streak
    let nextStreak = streak;
    if (expandMode === 'by2' && winMode === 'scaling') {
      nextStreak = Math.min(streak + 1, newSize - 1);
    }

    return {
      board: expanded,
      players,
      playerIndex: nextIndex,
      currentPlayer: nextPlayer,
      winner: null,
      size: newSize,
      expanding: true,
      awaitingFirstMove: true,
      expandMode,
      winMode,
      streak: nextStreak,
      playerCount: state.playerCount,
    };
  }

  return {
    ...state,
    board: newBoard,
    playerIndex: nextIndex,
    currentPlayer: nextPlayer,
    expanding: false,
    awaitingFirstMove: false,
  };
}
