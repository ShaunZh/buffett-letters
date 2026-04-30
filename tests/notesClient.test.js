import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  ensureSingleSelectionMenu,
  findNoteById,
  getNoteMenuMode,
  shouldRefreshSelectionTrigger,
  syncBodyModalScrollLock,
} from "../src/lib/notesClient.js";

const notesClientPath = new URL("../src/lib/notesClient.js", import.meta.url);

test("findNoteById returns the matching note for highlight popovers", () => {
  const notes = [
    { id: "note-1", note: "alpha" },
    { id: "note-2", note: "beta" },
  ];

  assert.deepEqual(findNoteById(notes, "note-2"), { id: "note-2", note: "beta" });
  assert.equal(findNoteById(notes, "missing"), null);
});

test("getNoteMenuMode chooses the correct surface for trigger, preview, and editor states", () => {
  assert.equal(getNoteMenuMode({ hasSelectionContext: true, activeNoteId: "", editingNoteId: "" }), "trigger");
  assert.equal(getNoteMenuMode({ hasSelectionContext: false, activeNoteId: "note-1", editingNoteId: "" }), "viewer");
  assert.equal(getNoteMenuMode({ hasSelectionContext: false, activeNoteId: "note-1", editingNoteId: "note-1" }), "editor");
  assert.equal(getNoteMenuMode({ hasSelectionContext: false, activeNoteId: "", editingNoteId: "" }), "hidden");
});

test("viewer popover exposes a delete action for existing notes", () => {
  const source = readFileSync(notesClientPath, "utf8");

  assert.match(source, /data-selection-viewer-delete/);
});

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

test("shouldRefreshSelectionTrigger ignores refreshes while viewer mode is open", () => {
  const menu = {
    contains() {
      return false;
    },
  };

  assert.equal(shouldRefreshSelectionTrigger({ menu, mode: "viewer", target: "outside" }), false);
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
