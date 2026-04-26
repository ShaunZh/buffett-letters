import test from "node:test";
import assert from "node:assert/strict";

import {
  STORAGE_KEY,
  MAX_ENTRIES,
  loadReadingPositions,
  saveReadingPosition,
  prunePositions,
} from "../src/lib/readingPosition.js";

test("STORAGE_KEY and MAX_ENTRIES have correct values", () => {
  assert.equal(STORAGE_KEY, "buffett-reading-position");
  assert.equal(MAX_ENTRIES, 20);
});

test("loadReadingPositions returns empty object for null/undefined", () => {
  assert.deepEqual(loadReadingPositions(null), {});
  assert.deepEqual(loadReadingPositions(undefined), {});
});

test("loadReadingPositions returns empty object for invalid JSON", () => {
  assert.deepEqual(loadReadingPositions("{bad json"), {});
  assert.deepEqual(loadReadingPositions("not json at all"), {});
});

test("loadReadingPositions returns empty object for non-object JSON", () => {
  assert.deepEqual(loadReadingPositions(JSON.stringify([1, 2, 3])), {});
  assert.deepEqual(loadReadingPositions(JSON.stringify("hello")), {});
  assert.deepEqual(loadReadingPositions(JSON.stringify(42)), {});
});

test("loadReadingPositions parses valid JSON object", () => {
  const data = { "2024-letter": "p5", "2023-letter": "p12" };
  assert.deepEqual(loadReadingPositions(JSON.stringify(data)), data);
});

test("loadReadingPositions returns empty object for empty string", () => {
  assert.deepEqual(loadReadingPositions(""), {});
});

test("saveReadingPosition adds a new entry", () => {
  const positions = { "2023-letter": "p3" };
  const result = saveReadingPosition(positions, "2024-letter", "p7");

  assert.deepEqual(result, { "2023-letter": "p3", "2024-letter": "p7" });
});

test("saveReadingPosition updates an existing entry", () => {
  const positions = { "2024-letter": "p3" };
  const result = saveReadingPosition(positions, "2024-letter", "p10");

  assert.deepEqual(result, { "2024-letter": "p10" });
});

test("saveReadingPosition does not mutate the input object", () => {
  const positions = { "2023-letter": "p3" };
  const result = saveReadingPosition(positions, "2024-letter", "p7");

  assert.deepEqual(positions, { "2023-letter": "p3" });
  assert.notEqual(result, positions);
});

test("saveReadingPosition works with empty positions object", () => {
  const result = saveReadingPosition({}, "2024-letter", "p1");
  assert.deepEqual(result, { "2024-letter": "p1" });
});

test("prunePositions returns same object when under MAX_ENTRIES", () => {
  const positions = {};
  for (let i = 0; i < MAX_ENTRIES; i++) {
    positions[`letter-${i}`] = `p${i}`;
  }
  const result = prunePositions(positions);
  assert.deepEqual(result, positions);
});

test("prunePositions removes oldest entries when over MAX_ENTRIES", () => {
  const positions = {};
  for (let i = 0; i < MAX_ENTRIES + 5; i++) {
    positions[`letter-${i}`] = `p${i}`;
  }
  const result = prunePositions(positions);

  assert.equal(Object.keys(result).length, MAX_ENTRIES);
  // Oldest entries (0-4) should be removed, newest (5-24) kept
  assert.equal(result["letter-4"], undefined);
  assert.equal(result["letter-5"], "p5");
  assert.equal(result["letter-24"], "p24");
});

test("prunePositions does not mutate the input object", () => {
  const positions = {};
  for (let i = 0; i < MAX_ENTRIES + 3; i++) {
    positions[`letter-${i}`] = `p${i}`;
  }
  const originalKeys = Object.keys(positions);
  const result = prunePositions(positions);

  assert.equal(Object.keys(positions).length, originalKeys.length);
  assert.notEqual(result, positions);
});

test("prunePositions returns same object for empty input", () => {
  const result = prunePositions({});
  assert.deepEqual(result, {});
});

test("saveReadingPosition and prunePositions work together", () => {
  const positions = {};
  for (let i = 0; i < MAX_ENTRIES; i++) {
    positions[`letter-${i}`] = `p${i}`;
  }
  // Adding one more entry exceeds MAX_ENTRIES
  const updated = saveReadingPosition(positions, "new-letter", "p1");
  const pruned = prunePositions(updated);

  assert.equal(Object.keys(pruned).length, MAX_ENTRIES);
  // The oldest entry (letter-0) should be pruned
  assert.equal(pruned["letter-0"], undefined);
  // The newest entry should be present
  assert.equal(pruned["new-letter"], "p1");
});