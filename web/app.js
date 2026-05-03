// Expanding Tic Tac Toe — Web App (vanilla JS + ES modules, no build step)
import { getInitialState, applyTurn, countWinningLines } from '../shared/gameLogic.js?v=3';

// --- DOM references ---
const boardEl             = document.getElementById('board');
const statusText          = document.getElementById('status-text');
const playerBadge         = document.getElementById('player-badge');
const statusSuffix        = document.getElementById('status-suffix');
const streakBadge         = document.getElementById('streak-badge');
const streakDesc          = document.getElementById('streak-desc');
const winnerBanner        = document.getElementById('winner-banner');
const expandNotice        = document.getElementById('expand-notice');
const boardSizeNote       = document.getElementById('board-size-notice');
const newGameBtn          = document.getElementById('new-game-btn');
const modeToggle          = document.getElementById('mode-toggle');
const winModeSection      = document.getElementById('win-mode-section');
const winModeToggle       = document.getElementById('win-mode-toggle');
const manualSection       = document.getElementById('manual-streak-section');
const streakInput         = document.getElementById('streak-input');       // settings panel
const streakInputHint     = document.getElementById('streak-input-hint');
const houseRuleCheckbox   = document.getElementById('house-rule-no-decrease');
const expandPromptTop     = document.getElementById('expand-prompt-top');
const expandPromptBottom  = document.getElementById('expand-prompt-bottom');
const expandPromptSizeTop = document.getElementById('expand-prompt-size-top');
const streakInputTop      = document.getElementById('streak-input-top');    // top banner
const streakInputBottom   = document.getElementById('streak-input-bottom'); // bottom banner
const playerCountBadge    = document.getElementById('player-count-badge');
const twoPlayerBtn        = document.getElementById('two-player-btn');
const threePlayerBtn      = document.getElementById('three-player-btn');
const turnOrderEl         = document.getElementById('turn-order');

// --- Persistent settings (survive new games) ---
let expandMode          = 'by2';
let winMode             = 'fixed';
let manualStreak        = 3;
let houseRuleNoDecrease = false;
let playerCount         = 2;

// --- Game state ---
let state = getInitialState(expandMode, winMode, manualStreak, playerCount);

// --- Helpers ---
function isNewCell(ri, ci, size, expanding, mode) {
  if (!expanding) return false;
  if (mode === 'by1') return ri === size - 1 || ci === size - 1;
  return ri === 0 || ri === size - 1 || ci === 0 || ci === size - 1;
}

function clampStreak(value, size, floor = 3) {
  return Math.max(floor, Math.min(value, size - 1));
}

// Sync all three streak inputs (settings panel + two banners) to the same value.
function syncStreakInputs(value, size, floor, disabled) {
  [streakInput, streakInputTop, streakInputBottom].forEach((el) => {
    el.value    = value;
    el.min      = floor;
    el.max      = size - 1;
    el.disabled = disabled;
  });
}

// --- Render ---
function render() {
  const { board, currentPlayer, winner, size, expanding, expandMode: mode, streak, awaitingFirstMove } = state;
  const isManual  = winMode === 'manual';
  const unlocked  = isManual && awaitingFirstMove;
  const floor     = houseRuleNoDecrease ? streak : 3;

  // Subtitle streak description
  streakDesc.textContent = streak;

  // Board grid
  boardEl.style.gridTemplateColumns = `repeat(${size}, var(--cell-size))`;
  boardEl.innerHTML = '';
  board.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const btn = document.createElement('button');
      btn.className = 'cell';
      btn.setAttribute('aria-label', `Row ${ri + 1}, Column ${ci + 1}`);
      if (cell) {
        btn.textContent = cell;
        btn.classList.add(cell, 'occupied');
      }
      if (isNewCell(ri, ci, size, expanding, mode)) btn.classList.add('new-cell');
      if (winner) btn.classList.add('disabled');
      btn.addEventListener('click', () => handleClick(ri, ci));
      boardEl.appendChild(btn);
    });
  });

  // Turn order row
  const activeMark = winner ?? currentPlayer;
  turnOrderEl.innerHTML = state.players.map((p) => {
    const isActive = p === activeMark;
    return `<div class="turn-order-item${isActive ? ' active' : ''}">
      <span class="turn-arrow">${isActive ? '▼' : ''}</span>
      <span class="player-badge ${p}">${p}</span>
    </div>`;
  }).join('');

  // Status bar
  streakBadge.textContent = `${streak}-in-a-row`;
  if (winner) {
    statusText.textContent   = 'Player';
    playerBadge.textContent  = winner;
    playerBadge.className    = `player-badge ${winner}`;
    statusSuffix.textContent = ' wins!';
    const lineCount = state.winningLineCount ?? 1;
    let bannerHTML = `<span class="player-badge ${winner}">${winner}</span> Player ${winner} wins!`;
    if (lineCount >= 2) {
      const syllables = ['TIC', 'TAC', 'TOE'];
      const reps   = lineCount >= 3 ? 3 : 2;
      const label  = lineCount >= 3 ? 'TRIPLE' : 'DOUBLE';
      const lines  = syllables.slice(0, streak).map((s) => s.repeat(reps));
      lines.push(`${label} ${streak}-IN-A-ROW!`);
      bannerHTML += `<span class="double-win-shout">${lines.join('<br>')}</span>`;
    }
    winnerBanner.innerHTML   = bannerHTML;
    winnerBanner.classList.add('visible');
  } else {
    statusText.textContent   = 'Player';
    playerBadge.textContent  = currentPlayer;
    playerBadge.className    = `player-badge ${currentPlayer}`;
    statusSuffix.textContent = "'s turn";
    winnerBanner.classList.remove('visible');
    winnerBanner.innerHTML   = '';
  }

  // Expansion size notice (brief flash)
  if (expanding) {
    boardSizeNote.textContent = `${size}×${size}`;
    expandNotice.classList.add('visible');
    setTimeout(() => expandNotice.classList.remove('visible'), 2500);
  }

  // Expand prompt banners — show for ALL modes when awaiting first move,
  // but only show the input controls when winMode === 'manual'.
  const showPrompts = awaitingFirstMove && !winner;
  expandPromptTop.classList.toggle('hidden', !showPrompts);
  expandPromptBottom.classList.toggle('hidden', !showPrompts);
  expandPromptTop.classList.toggle('manual-mode', isManual);
  expandPromptBottom.classList.toggle('manual-mode', isManual);
  if (showPrompts) {
    expandPromptSizeTop.textContent = `${size}×${size}`;
  }

  // Expand mode toggle buttons
  modeToggle.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === expandMode);
  });

  // Win mode section (only for by2)
  winModeSection.classList.toggle('hidden', expandMode !== 'by2');

  // Win mode toggle buttons
  winModeToggle.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.winmode === winMode);
  });

  // Manual streak section — always visible when manual is selected
  manualSection.classList.toggle('hidden', !isManual);

  // Sync all streak inputs
  syncStreakInputs(streak, size, floor, !unlocked);

  // Hint text in settings panel
  streakInputHint.textContent = unlocked
    ? `Enter ${floor}–${size - 1} and press Enter`
    : 'Unlocks after each expansion';
  streakInputHint.classList.toggle('unlocked', unlocked);

  houseRuleCheckbox.checked = houseRuleNoDecrease;

  // Player count badge and button active states
  playerCountBadge.textContent = `${playerCount}P`;
  twoPlayerBtn.classList.toggle('active', playerCount === 2);
  threePlayerBtn.classList.toggle('active', playerCount === 3);
}

// --- Apply streak from any of the three inputs ---
function applyManualStreak(rawValue) {
  if (!state.awaitingFirstMove) return;
  const raw     = parseInt(rawValue, 10);
  const floor   = houseRuleNoDecrease ? state.streak : 3;
  const clamped = clampStreak(isNaN(raw) ? floor : raw, state.size, floor);
  manualStreak  = clamped;
  state = { ...state, streak: clamped };
  render();
}

function attachStreakListeners(el) {
  el.addEventListener('change', () => applyManualStreak(el.value));
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyManualStreak(el.value); });
}

attachStreakListeners(streakInput);
attachStreakListeners(streakInputTop);
attachStreakListeners(streakInputBottom);

// --- Cell click ---
function handleClick(row, col) {
  // If awaiting first move, the click itself acts as the confirmation + first move.
  if (state.awaitingFirstMove) {
    confirmStreak();       // lock in the streak and clear awaitingFirstMove
  }
  state = applyTurn(state, row, col);
  manualStreak = state.streak;
  render();
}

// --- Dismiss the expansion prompt and release the board for play ---
function confirmStreak() {
  if (winMode === 'manual') {
    // Apply whatever is currently in the input before releasing
    const raw     = parseInt(streakInputTop.value, 10);
    const floor   = houseRuleNoDecrease ? state.streak : 3;
    const clamped = clampStreak(isNaN(raw) ? floor : raw, state.size, floor);
    manualStreak  = clamped;
    state = { ...state, streak: clamped };
  }
  state = { ...state, awaitingFirstMove: false };
  render();
}

// Clicking anywhere on either banner (outside the input) confirms and dismisses it
expandPromptTop.addEventListener('click', (e) => {
  if (e.target.tagName === 'INPUT') return;
  confirmStreak();
});
expandPromptBottom.addEventListener('click', (e) => {
  if (e.target.tagName === 'INPUT') return;
  confirmStreak();
});

// House rule toggle
houseRuleCheckbox.addEventListener('change', () => {
  houseRuleNoDecrease = houseRuleCheckbox.checked;
  render();
});

// Expand mode toggle
modeToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-mode]');
  if (!btn || btn.dataset.mode === expandMode) return;
  expandMode = btn.dataset.mode;
  if (expandMode === 'by1') { winMode = 'fixed'; manualStreak = 3; }
  state = getInitialState(expandMode, winMode, manualStreak, playerCount);
  expandNotice.classList.remove('visible');
  render();
});

// Win mode toggle — applies to the current game without resetting it
winModeToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-winmode]');
  if (!btn || btn.dataset.winmode === winMode) return;
  winMode = btn.dataset.winmode;
  // When switching to manual, keep the current streak as the starting point.
  // When switching away from manual, reset streak to 3.
  if (winMode !== 'manual') manualStreak = 3;
  state = { ...state, winMode, streak: manualStreak };
  render();
});

// Player count buttons
twoPlayerBtn.addEventListener('click', () => {
  playerCount = 2;
  if (winMode !== 'manual') manualStreak = 3;
  state = getInitialState(expandMode, winMode, manualStreak, playerCount);
  expandNotice.classList.remove('visible');
  render();
});

threePlayerBtn.addEventListener('click', () => {
  playerCount = 3;
  if (winMode !== 'manual') manualStreak = 3;
  state = getInitialState(expandMode, winMode, manualStreak, playerCount);
  expandNotice.classList.remove('visible');
  render();
});

// New game
newGameBtn.addEventListener('click', () => {
  manualStreak = 3;
  state = getInitialState(expandMode, winMode, manualStreak, playerCount);
  expandNotice.classList.remove('visible');
  render();
});

// --- Initial render ---
render();
