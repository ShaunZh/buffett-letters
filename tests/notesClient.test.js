import test from "node:test";
import assert from "node:assert/strict";

import {
  ensureSingleSelectionMenu,
  shouldRefreshSelectionTrigger,
  syncBodyModalScrollLock,
} from "../src/lib/notesClient.js";

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

test("syncBodyModalScrollLock locks page scrolling while any AI modal is open", () => {
  const classes = new Set();
  const body = {
    classList: {
      toggle(name, enabled) {
        if (enabled) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
      },
    },
  };
  const modals = [{ hidden: true }, { hidden: false }, { hidden: true }];

  syncBodyModalScrollLock({ body, modals });

  assert.equal(classes.has("ai-modal-open"), true);

  modals[1].hidden = true;
  syncBodyModalScrollLock({ body, modals });

  assert.equal(classes.has("ai-modal-open"), false);
});
