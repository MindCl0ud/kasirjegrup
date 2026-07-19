# Task 7 Report: Export Excel (4-Sheet Workbook)

## Status: DONE

## Changes Made

### src/App.jsx

1. **Added `exportOpnameExcel` function** (lines ~1420-1523) — `async function` declaration before `OpnamePanel`. Generates a 4-sheet XLSX workbook (PETUNJUK, KARTU STOCK, TEMPLATE OPNAME, RINGKASAN).

2. **TemplateOpnameTab toolbar** — Added ⬇ Export and ⬆ Import buttons after the search input. Added `opnames` and `slogs` to destructured props and to the JSX render call.

3. **KartuStockTab toolbar** — Added ⬇ Export button before the closing toolbar div. Added `selectedOpname`, `opnameItems`, `opnames`, `toast` to destructured props and JSX render call.

## Verification
- `npx vite build` — passed (43 modules, ~1.86s)
