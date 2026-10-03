# Clover Calc Frontend

HTML/CSS/JavaScript frontend. Requires a modern browser and any static HTTP server.

Course: EE308FZ. FZU student ID: 832401303. MUID: 241215237.

Companion repository: [Clover Calc Backend](https://github.com/candiceherstewart3c4-cell/832401303_calculator_backend).

## Install and start independently

Requires Node.js 22.13+ for the included preview server. There are no dependencies to install and no build step. From this frontend repository run:

```bash
npm start
```

Open http://127.0.0.1:4173. In the separately cloned backend repository run `npm start`; its default API is http://127.0.0.1:3000/api. The two repositories need not be adjacent.

The local preview can override the API and port through environment variables. PowerShell example:

```powershell
$env:PORT = '4187'
$env:CALCULATOR_API_URL = 'http://127.0.0.1:3187/api'
npm start
```

Use port 3187 for the backend in this example. `HOST` defaults to `127.0.0.1`. Variables are read from the process environment; `.env` files are not loaded automatically.

## Connect and deploy

For a separate static frontend host, edit `backendApiUrl` in `scripts/config.js` to the real backend HTTPS URL, including `/api` and omitting a trailing slash. Set backend `FRONTEND_ORIGIN` to the frontend's exact origin (scheme, host and optional port, without a path).

If a reverse proxy routes this site's `/api` to the backend, leave `backendApiUrl` empty. Port 4173 defaults to the local API at port 3000. When using the included server with `CALCULATOR_API_URL`, it supplies the configured URL instead of the file. This override does not apply to other static hosts.

Upload `index.html`, `assets/`, `scripts/`, and `styles/` to the public static directory. Repository metadata, preview code, documentation and tests need not be publicly served. Keep the backend accessible and its database on persistent storage during evaluation. Public deployment has not yet been verified.

Database initialization is handled automatically by the backend. This client only sends expressions, displays API results, reads history and requests deletion.
This directory is the standalone frontend repository root. It contains README.md, codestyle.md, package.json, preview tests and asset attribution in ASSETS.md. Commit source and assets; do not commit secrets or runtime files.

## Verify

```bash
npm test
```

The smoke test verifies page/assets, API configuration, missing files and directory traversal protection. Actual browser checks and 24 screenshots are documented in [ACCEPTANCE.md](ACCEPTANCE.md).

Open **Scientific** for sin, cos, tan and π. DEG (default) interprets angles in degrees; RAD uses radians. For example, `sin(30)` in DEG and `sin(pi/6)` in RAD both give 0.5. A function wraps the selected text or entire expression; on empty input it inserts parentheses with the cursor inside. History recall restores the stored angle unit. The frontend sends `{ expression, angleMode }`; all evaluation stays on the backend.

The scientific panel also has log, ln and xʸ. **SHIFT** selects a secondary function for the next function key: asin/acos/atan, 10ˣ/eˣ, or Euler's constant e. Gold secondary labels remain visible; SHIFT resets after use, clearing or collapsing the panel. Functions insert after an operator, allowing button entry of `2+sin(30)`. Power entry uses `^`; type an exponent inside the inserted parentheses.

The functional grouping and clear separation of numeric/scientific keys reference [Casio ClassWiz](https://www.casio.com/intl/scientific-calculators/product.FX-991CW/) and its [official function catalog](https://support.casio.com/global/en/calc/manual/fx-570CW_991CW_en/advanced_calculations/). This is an independent coursework calculator, not a Casio emulator: it does not reproduce the full model, textbook fractions, symbolic results, equations or matrices.

## Responsive workspace

At 1000px and wider, calculation and database history appear side by side; the history list scrolls independently. Scientific keys and history start expanded on wide screens. Narrow screens use one column and initially collapse these panels; both remain available through their buttons. Crossing the breakpoint restores the layout defaults, without changing the expression or angle unit. The five-column numeric keypad retains every original action. Square, square root, reciprocal and Undo live in the quick-function row. Calculation requests and database behavior are unchanged.

## Conversion tools and history

**Number display:** Automatic uses scientific notation for absolute values at least 10^9 or nonzero values below 10^-6. Decimal places offers Auto (no extra rounding) or 0–10 fixed decimal places, retaining trailing zeros. Ties round away from zero using decimal-text formatting; scientific notation rounds the coefficient and normalizes carries. Full values bypasses rounding and temporarily disables Decimal places. These options apply to arithmetic, units and history, never to base-conversion results. Copy actions copy full values; Ans continues to use the backend result. Display settings do not change stored data, input syntax or numerical precision. They reset to Auto on page reload.

Use Calculate / Number bases / Unit converter to switch working surfaces. Base conversion supports signed integers in bases 2, 8, 10, 16 (up to 128 input digits, no 0x prefixes or fractional values). Units cover metric length (mm/cm/m/km), mass (mg/g/kg), and temperature (C/F/K). Convert & save sends inputs to the backend; it does not calculate in the browser. Invalid conversions are not saved. Clicking a conversion in history restores its tool, value and units without automatically running it.

History search now queries all stored records, with 10 results per page. The star toggles a database-backed favorite; Favorites only combines with the search. The header count is the total database record count, not the page length. All users share records and favorites. Clear history deletes all records including favorites and entries outside the current filter, with an explicit confirmation.
