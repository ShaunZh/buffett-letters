# Reading Position Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically save and restore the user's last reading position (paragraph-level) when reopening a letter.

**Architecture:** New standalone module `readingPosition.js` handles scroll tracking (debounced) and position restoration via localStorage. Integrated into the letter page via a client-side script block, following the same pattern as `LetterNotes.astro`.

**Tech Stack:** Vanilla JS, localStorage, Node test runner (`node --test`)

---

### Task 1: Core data functions — save, load, prune

**Files:**
- Create: `src/lib/readingPosition.js`
- Create: `tests/readingPosition.test.js`

- [ ] **Step 1: Write failing tests for data functions**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  STORAGE_KEY,
  MAX_ENTRIES,
  loadReadingPositions,
  saveReadingPosition,
  prunePositions,
} from "../src/lib/readingPosition.js";

test("loadReadingPositions returns empty object for null/undefined", () => {
  assert.deepEqual(loadReadingPositions(null), {});
  assert.deepEqual(loadReadingPositions(undefined), {});
});

test("loadReadingPositions returns empty object for invalid JSON", () => {
  assert.deepEqual(loadReadingPositions("not-json"), {});
});

test("loadReadingPositions parses valid JSON object", () => {
  const raw = JSON.stringify({ "2024-letter": "p5", "2023-letter": "p12" });
  const result = loadReadingPositions(raw);
  assert.deepEqual(result, { "2024-letter": "p5", "2023-letter": "p12" });
});

test("saveReadingPosition adds entry to positions object", () => {
  const positions = { "2023-letter": "p3" };
  const updated = saveReadingPosition(positions, "2024-letter", "p5");
  assert.equal(updated["2024-letter"], "p5");
  assert.equal(updated["2023-letter"], "p3");
});

test("saveReadingPosition updates existing entry", () => {
  const positions = { "2024-letter": "p3" };
  const updated = saveReadingPosition(positions, "2024-letter", "p7");
  assert.equal(updated["2024-letter"], "p7");
});

test("prunePositions removes oldest entries when exceeding MAX_ENTRIES", () => {
  const positions = {};
  for (let i = 0; i < 25; i++) {
    positions[`letter-${i}`] = `p${i}`;
  }
  const pruned = prunePositions(positions);
  const keys = Object.keys(pruned);
  assert.equal(keys.length, 20);
  // oldest entries (letter-0 through letter-4) should be removed
  assert.equal(keys[0], "letter-5");
});

test("prunePositions does nothing when under MAX_ENTRIES", () => {
  const positions = { "2024-letter": "p5" };
  const pruned = prunePositions(positions);
  assert.deepEqual(pruned, { "2024-letter": "p5" });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/readingPosition.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```js
const STORAGE_KEY = "buffett-reading-position";
const MAX_ENTRIES = 20;

export function loadReadingPositions(rawValue) {
  if (!rawValue) return {};
  try {
    const parsed = JSON.parse(rawValue);
    return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveReadingPosition(positions, slug, blockId) {
  const updated = { ...positions };
  updated[slug] = blockId;
  return updated;
}

export function prunePositions(positions) {
  const keys = Object.keys(positions);
  if (keys.length <= MAX_ENTRIES) return positions;
  const excess = keys.length - MAX_ENTRIES;
  const pruned = {};
  for (let i = excess; i < keys.length; i++) {
    pruned[keys[i]] = positions[keys[i]];
  }
  return pruned;
}

export { STORAGE_KEY, MAX_ENTRIES };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/readingPosition.test.js`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/readingPosition.js tests/readingPosition.test.js
git commit -m "feat: add reading position data functions with tests"
```

---

### Task 2: DOM setup function — scroll tracking and position restoration

**Files:**
- Modify: `src/lib/readingPosition.js`
- Modify: `tests/readingPosition.test.js`

- [ ] **Step 1: Write failing test for findTopBlock**

```js
test("findTopBlock returns the block ID closest to viewport top", () => {
  // Simulate DOM elements with getBoundingClientRect
  const blocks = [
    { id: "p1", rect: { top: -500 } },
    { id: "p2", rect: { top: -200 } },
    { id: "p3", rect: { top: 50 } },
    { id: "p4", rect: { top: 300 } },
  ];
  // viewport top = 0, closest block whose top <= 0 is p2 (top=-200)
  // but p3 (top=50) is closer to 0 than p2 (top=-200, distance=200)
  // We want the block that is at or above viewport top, closest to it
  const result = findTopBlock(blocks, 0);
  assert.equal(result, "p2");
});

test("findTopBlock returns first block if all are below viewport", () => {
  const blocks = [
    { id: "p1", rect: { top: 100 } },
    { id: "p2", rect: { top: 300 } },
  ];
  const result = findTopBlock(blocks, 0);
  assert.equal(result, "p1");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/readingPosition.test.js`
Expected: FAIL — `findTopBlock` not defined

- [ ] **Step 3: Implement findTopBlock**

Add to `src/lib/readingPosition.js`:

```js
export function findTopBlock(blocks, viewportTop) {
  if (!blocks.length) return null;
  // Find the last block whose top is <= viewportTop
  let candidate = blocks[0];
  for (const block of blocks) {
    if (block.rect.top <= viewportTop) {
      candidate = block;
    } else {
      break;
    }
  }
  return candidate.id;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/readingPosition.test.js`
Expected: all PASS

- [ ] **Step 5: Add setupReadingPosition function**

Add to `src/lib/readingPosition.js`:

```js
export function setupReadingPosition() {
  const article = document.querySelector("[data-letter-page]");
  if (!article) return;

  const slug = article.dataset.letterSlug;
  if (!slug) return;

  // Restore position on load
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const positions = loadReadingPositions(raw);
  if (positions[slug]) {
    const target = document.querySelector(
      `[data-block-id="${positions[slug]}"]`,
    );
    if (target) {
      target.scrollIntoView({ block: "start" });
    }
  }

  // Save position on scroll (debounced 3s)
  let timer = null;
  window.addEventListener("scroll", () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      const allBlocks = Array.from(
        document.querySelectorAll("[data-block-id]"),
      ).map((el) => ({
        id: el.dataset.blockId,
        rect: el.getBoundingClientRect(),
      }));
      const blockId = findTopBlock(allBlocks, 0);
      if (!blockId) return;

      const currentRaw = window.localStorage.getItem(STORAGE_KEY);
      const currentPositions = loadReadingPositions(currentRaw);
      const updated = prunePositions(
        saveReadingPosition(currentPositions, slug, blockId),
      );
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }, 3000);
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/readingPosition.js tests/readingPosition.test.js
git commit -m "feat: add setupReadingPosition with scroll tracking and restoration"
```

---

### Task 3: Integration — wire into letter page

**Files:**
- Modify: `src/pages/letters/[slug].astro`

- [ ] **Step 1: Add client-side script to letter page**

In `src/pages/letters/[slug].astro`, add after the `<LetterNotes />` line (line 53):

```astro
  <LetterNotes />

  <script>
    import { setupReadingPosition } from "../lib/readingPosition.js";
    setupReadingPosition();
  </script>
```

- [ ] **Step 2: Verify build succeeds**

Run: `npm run build`
Expected: build completes without errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/letters/[slug].astro
git commit -m "feat: integrate reading position persistence into letter page"
```

---

### Task 4: Manual verification

- [ ] **Step 1: Start dev server and test manually**

Run: `npm run dev`

1. Open a letter page, scroll to a middle paragraph
2. Wait 3+ seconds for debounce to fire
3. Check localStorage in browser DevTools: `buffett-reading-position` should contain `{ "2024-letter": "pN" }`
4. Refresh the page — it should auto-scroll to the saved paragraph
5. Navigate to a different letter, scroll, then go back to the first letter — position should still be restored