# Task 2 Report: Add Opname State & Subscriptions to App.jsx

## Status: DONE

## Changes Made

### 1. Added imports (src/App.jsx:12-13)
Added 8 firebase function imports for opname feature:
`subscribeOpnames`, `subscribeOpnameItems`, `fbCreateOpname`, `fbCloseOpname`,
`fbDeleteOpname`, `fbUpdateOpnameItem`, `fbBulkUpdateOpnameItems`, `fbApplyOpnameAdjustments`

### 2. Added subscription (src/App.jsx:1344)
Added `subscribeOpnames(d=>setOpnames(d))` to the Firestore subscriptions array.

### 3. Added state variables (src/App.jsx:1540-1548)
Added 7 opname state variables:
- `opnames`, `opnameItems`, `selectedOpname`, `opnameTab`, `opnameBiz`
- `showCreateOpname`, `showImportOpname`, `importOpnameRows`

### 4. Added useEffect for item subscription (src/App.jsx:1350-1355)
Added `useEffect` that subscribes to `subscribeOpnameItems` when `selectedOpname` changes, with cleanup.

## Verification
- Build: `npx vite build` — **succeeded** (43 modules, 1.82s)
- No errors, no warnings related to these changes
