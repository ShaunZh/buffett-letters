import test from "node:test";
import assert from "node:assert/strict";

import {
  filterPublishedLetters,
  getLetterNavItems,
  getLettersForTag,
  sortLettersByDateDesc,
} from "../src/lib/letterUtils.js";

const letters = [
  {
    id: "late",
    slug: "late-letter",
    data: {
      title: "Late",
      title_zh: "较晚信件",
      date: new Date("2024-02-24"),
      draft: false,
      tags: ["apple", "berkshire"],
      type: "shareholder-letter",
    },
  },
  {
    id: "draft",
    slug: "draft-letter",
    data: {
      title: "Draft",
      title_zh: "草稿信件",
      date: new Date("2025-01-01"),
      draft: true,
      tags: ["apple"],
      type: "shareholder-letter",
    },
  },
  {
    id: "early",
    slug: "early-letter",
    data: {
      title: "Early",
      title_zh: "较早信件",
      date: new Date("2023-01-01"),
      draft: false,
      tags: ["value"],
      type: "limited-partner-letter",
    },
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

test("getLetterNavItems filters by letter type when requested", () => {
  const result = getLetterNavItems(letters, {
    type: "limited-partner-letter",
    hrefBase: "/partner-letters",
  });

  assert.deepEqual(result, [
    {
      href: "/partner-letters/early-letter/",
      year: 2023,
      label: "较早信件",
      slug: "early-letter",
    },
  ]);
});
