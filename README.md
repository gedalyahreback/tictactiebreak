# Tic-Tac-Tiebreak

A browser game where a draw expands the board and play continues.

## Play Locally

Requires Python 3 to serve the files. No build step or dependency installation is needed for the web game.

```sh
python3 -m http.server 8000 --directory web
```

Open http://localhost:8000. Choose **With a friend**, **Vs computer**, or **Custom game** for 2–5 players on the same device. Scores are saved in the browser.

Published game: https://tic-tac-tiebreak.gedalyahreback.chatgpt.site (currently owner-private).

## Current Web Rules

- Quick play begins on a 3 × 3 board with 3 in a row required to win.
- A full board without a winner expands symmetrically; existing marks remain centered and the turn passes to the next player.
- Expansion adds either **1 row and column on every side** (3 → 5 → 7 board dimensions) or **2 on every side** (3 → 7 → 11 board dimensions).
- **Both expansion options always add 2 to the winning length per expansion**, so a starting target of 3 becomes 5, then 7. Fixed targets are no longer offered in the web game.
- Win horizontally, vertically, or diagonally. Custom games allow different starting board sizes and initial winning lengths.

## Tests

Requires Node.js 18 or newer. No npm packages are needed.

```sh
npm test
npm run test:web
npm run test:legacy
```

The web regression suite covers symmetric expansion, mark preservation, win-length growth, win detection, and computer moves. It also checks that no first move after expanding any drawn 3 × 3 board can win under either expansion option.

## Source Layout

- `web/`: current web game, matching the deployed Sites version. `game.js` contains its pure game engine; `app.js` connects it to the UI.
- `tests/game.test.cjs`: current web engine regression tests.
- `mobile/`: existing Expo/React Native scaffold.
- `shared/`: legacy engine and tests used by the mobile scaffold. These retain the older rule options; the mobile version has not been migrated to the current web rules.

The Sites deployment configuration is managed separately and is not needed to serve the web game from this repository.
