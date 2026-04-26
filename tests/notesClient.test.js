import test from "node:test";
import assert from "node:assert/strict";

import { ensureSingleSelectionMenu, shouldRefreshSelectionTrigger } from "../src/lib/notesClient.js";

test("shouldRefreshSelectionTrigger ignores interactions inside the menu", () => {
  const menu = {
    contains(target) {
      return target === "inside";
    },
  };

  assert.equal(shouldRefreshSelectionTrigger({ menu, mode: "trigger", target: "inside" }), false);
});

test("shouldRefreshSelectionTrigger ignores refreshes while editor mode is open", () => {
  const menu = {
    contains() {
      return false;
    },
  };

  assert.equal(shouldRefreshSelectionTrigger({ menu, mode: "editor", target: "outside" }), false);
});

test("shouldRefreshSelectionTrigger allows refresh for outside interactions in trigger mode", () => {
  const menu = {
    contains() {
      return false;
    },
  };

  assert.equal(shouldRefreshSelectionTrigger({ menu, mode: "trigger", target: "outside" }), true);
});

test("ensureSingleSelectionMenu keeps only the most recent menu instance", () => {
  const removed = [];
  const first = { remove() { removed.push("first"); } };
  const second = { remove() { removed.push("second"); } };
  const third = { remove() { removed.push("third"); } };

  const active = ensureSingleSelectionMenu([first, second, third]);

  assert.equal(active, third);
  assert.deepEqual(removed, ["first", "second"]);
});
