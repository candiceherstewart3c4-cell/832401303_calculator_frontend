# Local acceptance record

Course: EE308FZ · FZU student ID: 832401303 · MUID: 241215237
Acceptance date: 2026-10-03

## Environment and scope

The original browser acceptance run used Windows, Node.js 24.15.0 and the in-app browser. The frontend ran independently at http://127.0.0.1:4187 and the backend at http://127.0.0.1:3187, communicating through HTTP/JSON with a configured CORS origin.

That run used a separate acceptance database, leaving the working calculation database unchanged. Times in the screenshots use the browser's local timezone. The 24 images below show the interface before the later number-display settings were added.

## Verified behavior

- Arithmetic, decimals, precedence, parentheses and unary signs returned expected results.
- Division by zero and invalid expressions returned backend errors without creating records.
- Refresh retained history. Deleting a selected record removed its ID from SQLite, verified by a direct query.
- Favorites, search, pagination and history recall worked.
- Scientific DEG/RAD modes, Enter, base conversion and unit conversion worked.
- Stopping the backend prevented a new successful calculation while expression editing remained usable. Restarting restored saved history and favorites.
- The 390 × 844 mobile layout had no horizontal overflow. A scrolling issue in which the campus marker covered the calculator was corrected.

The original suite had 11 passing tests. After adding automatic notation, decimal-place settings and static-host coverage, the current combined suite has 18 passing tests (11 backend and 7 frontend). Each repository runs independently with npm test and has no third-party dependencies.

## Screenshots and captions

| Image | Actual demonstration |
|---|---|
| [01 Main interface](docs/screenshots/01-main-interface.jpg) | The frontend connects to a separate backend; initial history is empty. |
| [02 Addition](docs/screenshots/02-addition.jpg) | 12 + 8 = 20. |
| [03 Subtraction](docs/screenshots/03-subtraction.jpg) | 8 - 3 = 5. |
| [04 Multiplication](docs/screenshots/04-multiplication.jpg) | 6 × 7 = 42; the API expression uses *. |
| [05 Division](docs/screenshots/05-division.jpg) | 10 ÷ 2 = 5; the API expression uses /. |
| [06 Decimals](docs/screenshots/06-decimal.jpg) | 0.1 + 0.2 = 0.3, with backend results normalized to 15 significant digits. |
| [07 Precedence](docs/screenshots/07-precedence.jpg) | 1 + 2 × 3 = 7; multiplication is evaluated first. |
| [08 Parentheses](docs/screenshots/08-parentheses.jpg) | (1 + 2) × 3 = 9. |
| [09 Unary minus](docs/screenshots/09-unary-signs.jpg) | -5 + 3 × -2 = -11. |
| [10 Unary plus](docs/screenshots/10-unary-plus.jpg) | +5 × +2 = 10. |
| [11 Division by zero](docs/screenshots/11-division-by-zero.jpg) | 1/0 is rejected; no failed record is saved. |
| [12 Invalid expression](docs/screenshots/12-invalid-expression.jpg) | 1+ produces a syntax error without a saved record. |
| [13 Refresh persistence](docs/screenshots/13-refresh-persistence.jpg) | All nine successful records remain after refreshing. |
| [14 Favorites](docs/screenshots/14-favorites.jpg) | Favorites filtering shows one entry while the database total remains nine. |
| [15 Search](docs/screenshots/15-history-search.jpg) | Searching 12+8 returns the matching record. |
| [16 Single-record deletion](docs/screenshots/16-delete-record.jpg) | Deleting ID 1 removes the search match and changes the total from nine to eight. |
| [17 Scientific DEG](docs/screenshots/17-science-deg.jpg) | Function keys insert sin(30); the backend returns 0.5. |
| [18 Scientific RAD](docs/screenshots/18-science-rad.jpg) | sin(pi/6) returns 0.5 in RAD mode. |
| [19 Base conversion](docs/screenshots/19-base-conversion.jpg) | Decimal 255 becomes hexadecimal FF and is saved. |
| [20 Temperature conversion](docs/screenshots/20-unit-conversion.jpg) | 0°C becomes 32°F and is saved. |
| [21 Pagination](docs/screenshots/21-history-pagination.jpg) | Twelve records appear across pages of ten and two. |
| [22 Mobile layout](docs/screenshots/22-mobile-calculator.jpg) | The 390px layout remains usable without marker overlap. |
| [23 Backend stopped](docs/screenshots/23-backend-offline.jpg) | 100+23 cannot produce a new result while the backend is stopped. |
| [24 Backend restart](docs/screenshots/24-backend-restart.jpg) | All thirteen saved records are read again from SQLite after restart. |

A subsequent mobile regression calculation left fourteen records in that acceptance database. Each screenshot reflects the state at its own capture time.

## Later display-setting checks

Separate browser checks confirmed scientific notation, full decimal expansion, decimal-place selection, history formatting and preservation of the original value for Ans. Examples include 1.235 displayed as 1.24 at two places, Full values restoring 1.235 without adding a record, and Ans inserting (1.235). Unit conversion displayed 1.23 × 10¹² m at two places. A 390px layout showed no horizontal overflow.

These later checks used the working database and added demonstration records; existing records were preserved. Automated tests use separate temporary databases.

## Remaining submission work

Public HTTPS access, deployment storage persistence and the final published blog still need verification. Local acceptance does not demonstrate public hosting. For the blog, upload actual images to the chosen platform and retain their English captions. The earlier screenshots do not demonstrate the later display-setting controls.
