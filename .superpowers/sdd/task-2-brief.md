# Task 2: Add Opname State & Subscriptions to App.jsx

## File
- Modify: `src/App.jsx`

## Changes Needed

### 1. Add imports (line 11, after `syncToSheets,`)
Change line 11 from:
```
11:   fbLogActivity, verifyPassword, syncToSheets,
```
to:
```
11:   fbLogActivity, verifyPassword, syncToSheets,
12:   subscribeOpnames, subscribeOpnameItems, fbCreateOpname, fbCloseOpname,
13:   fbDeleteOpname, fbUpdateOpnameItem, fbBulkUpdateOpnameItems, fbApplyOpnameAdjustments,
```

### 2. Add subscription in useEffect (line 1341, after `subscribeTargets`)
After line 1341:
```
1341:       subscribeTargets(d=>setTargets(d)),
```
Add:
```
1342:       subscribeOpnames(d=>setOpnames(d)),
```
Note: The line below already has `];` on line 1342, so after adding this, the `];` moves to line 1343.

### 3. Add state variables (after line 1537: `const [slogType,setSlogType]=useState("ALL");`)
After the `slogType` line, add:
```js
  // ─── Opname state ───
  const [opnames, setOpnames] = useState([]);
  const [opnameItems, setOpnameItems] = useState([]);
  const [selectedOpname, setSelectedOpname] = useState(null);
  const [opnameTab, setOpnameTab] = useState("opname"); // "opname" | "ringkasan" | "kartustok"
  const [opnameBiz, setOpnameBiz] = useState(null);
  const [showCreateOpname, setShowCreateOpname] = useState(false);
  const [showImportOpname, setShowImportOpname] = useState(false);
  const [importOpnameRows, setImportOpnameRows] = useState([]);
```

### 4. Add useEffect for item subscription (after line 1344, the `}``` block)
After the subscription cleanup effect closes (line 1344 `  },[fbReady]);`), add:
```js
  // ─── Subscribe opname items when session selected ───
  useEffect(() => {
    if (!selectedOpname || !fbReady) { setOpnameItems([]); return; }
    const unsub = subscribeOpnameItems(selectedOpname, d => setOpnameItems(d));
    return () => unsub();
  }, [selectedOpname, fbReady]);
```

## Verification
Run: `npm run build` (or `npx vite build`) — no errors.

## Global Constraints
- No comments other than the ones shown
- Follow existing code style (2-space indent, no semicolons on import lines)
