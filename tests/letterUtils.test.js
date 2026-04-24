import test from "node:test";
import assert from "node:assert/strict";

import {
  filterPublishedLetters,
  getLettersForTag,
  sortLettersByDateDesc,
} from "../src/lib/letterUtils.js";

const letters = [
  {
    id: "late",
    data: { title: "Late", date: new Date("2024-02-24"), draft: false, tags: ["apple", "berkshire"] },
  },
  {
    id: "draft",
    data: { title: "Draft", date: new Date("2025-01-01"), draft: true, tags: ["apple"] },
  },
  {
    id: "early",
    data: { title: "Early", date: new Date("2023-01-01"), draft: false, tags: ["value"] },
  },
];

test("filterPublishedLetters removes draft entries", () => {
  const result = filterPublishedLetters(letters);

  assert.deepEqual(
    result.map((entry) => entry.id),
    ["late", "early"],
  );
});

test("sortLettersByDateDesc orders entries from newest to oldest", () => {
  const result = sortLettersByDateDesc(filterPublishedLetters(letters));

  assert.deepEqual(
    result.map((entry) => entry.id),
    ["late", "early"],
  );
});

test("getLettersForTag returns only published entries for the requested tag", () => {
  const result = getLettersForTag(letters, "apple");

  assert.deepEqual(
    result.map((entry) => entry.id),
    ["late"],
  );
});
