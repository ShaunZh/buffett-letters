import test from "node:test";
import assert from "node:assert/strict";

import {
  createNoteRecord,
  getNotesForLetter,
  NOTE_COLORS,
  parseStoredNotes,
  removeNote,
  serializeNotes,
  upsertNote,
} from "../src/lib/letterNotes.js";

test("createNoteRecord normalizes selection text and trims note text", () => {
  const note = createNoteRecord({
    id: "note-1",
    createdAt: "2026-04-26T00:00:00.000Z",
    letterSlug: "2024-letter",
    blockId: "p2",
    language: "en",
    selectedText: "  Berkshire   Hathaway\nInc.  ",
    note: "  key point  ",
    startOffset: 4,
    endOffset: 28,
  });

  assert.equal(note.selectedText, "Berkshire Hathaway Inc.");
  assert.equal(note.note, "key point");
  assert.equal(note.color, "amber");
});

test("createNoteRecord keeps supported colors and falls back for unknown ones", () => {
  const greenNote = createNoteRecord({
    id: "note-color-1",
    createdAt: "2026-04-26T00:00:00.000Z",
    letterSlug: "2024-letter",
    blockId: "p2",
    language: "en",
    selectedText: "Capital",
    note: "",
    color: "mint",
    startOffset: 0,
    endOffset: 7,
  });

  const fallbackNote = createNoteRecord({
    id: "note-color-2",
    createdAt: "2026-04-26T00:00:00.000Z",
    letterSlug: "2024-letter",
    blockId: "p2",
    language: "en",
    selectedText: "Capital",
    note: "",
    color: "unknown",
    startOffset: 0,
    endOffset: 7,
  });

  assert.deepEqual(NOTE_COLORS, ["amber", "mint", "sky", "plum", "rose"]);
  assert.equal(greenNote.color, "mint");
  assert.equal(fallbackNote.color, "amber");
});

test("parseStoredNotes ignores malformed payloads", () => {
  assert.deepEqual(parseStoredNotes("{bad json"), []);
  assert.deepEqual(parseStoredNotes(JSON.stringify({ id: "x" })), []);
});

test("parseStoredNotes upgrades older notes without a color", () => {
  const notes = parseStoredNotes(
    JSON.stringify([
      {
        id: "legacy-1",
        createdAt: "2026-04-26T00:00:00.000Z",
        letterSlug: "2024-letter",
        blockId: "p8",
        language: "en",
        selectedText: "Legacy note",
        note: "",
        startOffset: 1,
        endOffset: 12,
      },
    ]),
  );

  assert.equal(notes.length, 1);
  assert.equal(notes[0].color, "amber");
});

test("serializeNotes and parseStoredNotes round-trip valid notes only", () => {
  const valid = createNoteRecord({
    id: "note-2",
    createdAt: "2026-04-26T00:00:00.000Z",
    letterSlug: "2024-letter",
    blockId: "p3",
    language: "zh",
    selectedText: "现金",
    note: "",
    startOffset: 0,
    endOffset: 2,
  });

  const serialized = serializeNotes([
    valid,
    { id: "broken", letterSlug: "2024-letter" },
  ]);

  assert.deepEqual(parseStoredNotes(serialized), [valid]);
});

test("getNotesForLetter returns only current letter notes in reading order", () => {
  const notes = [
    createNoteRecord({
      id: "b",
      createdAt: "2026-04-26T00:00:00.000Z",
      letterSlug: "2024-letter",
      blockId: "p10",
      language: "zh",
      selectedText: "第二条",
      note: "",
      startOffset: 8,
      endOffset: 11,
    }),
    createNoteRecord({
      id: "a",
      createdAt: "2026-04-26T00:00:00.000Z",
      letterSlug: "2024-letter",
      blockId: "p2",
      language: "en",
      selectedText: "First",
      note: "",
      startOffset: 2,
      endOffset: 7,
    }),
    createNoteRecord({
      id: "c",
      createdAt: "2026-04-26T00:00:00.000Z",
      letterSlug: "2023-letter",
      blockId: "p1",
      language: "en",
      selectedText: "Other",
      note: "",
      startOffset: 0,
      endOffset: 5,
    }),
  ];

  assert.deepEqual(
    getNotesForLetter(notes, "2024-letter").map((note) => note.id),
    ["a", "b"],
  );
});

test("upsertNote and removeNote update the note collection immutably", () => {
  const original = [
    createNoteRecord({
      id: "note-1",
      createdAt: "2026-04-26T00:00:00.000Z",
      letterSlug: "2024-letter",
      blockId: "p1",
      language: "en",
      selectedText: "Alpha",
      note: "",
      startOffset: 0,
      endOffset: 5,
    }),
  ];

  const updated = upsertNote(
    original,
    createNoteRecord({
      id: "note-1",
      createdAt: "2026-04-26T00:00:00.000Z",
      letterSlug: "2024-letter",
      blockId: "p1",
      language: "en",
      selectedText: "Alpha",
      note: "updated",
      startOffset: 0,
      endOffset: 5,
    }),
  );

  assert.equal(original[0].note, "");
  assert.equal(updated[0].note, "updated");
  assert.deepEqual(removeNote(updated, "note-1"), []);
});

test("upsertNote replaces an existing note at the same anchor", () => {
  const original = [
    createNoteRecord({
      id: "note-1",
      createdAt: "2026-04-26T00:00:00.000Z",
      letterSlug: "2024-letter",
      blockId: "p4",
      language: "zh",
      selectedText: "保险",
      note: "",
      startOffset: 10,
      endOffset: 12,
    }),
  ];

  const updated = upsertNote(
    original,
    createNoteRecord({
      id: "note-2",
      createdAt: "2026-04-26T00:00:00.000Z",
      letterSlug: "2024-letter",
      blockId: "p4",
      language: "zh",
      selectedText: "保险",
      note: "替换同一高亮",
      startOffset: 10,
      endOffset: 12,
    }),
  );

  assert.equal(updated.length, 1);
  assert.equal(updated[0].id, "note-2");
});
