import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pagePath = new URL("../src/pages/letters/[slug].astro", import.meta.url);
const viewModePath = new URL("../src/components/ViewModeToggle.astro", import.meta.url);

test("letter page mounts notes through a component instead of a raw source import", () => {
  const pageSource = readFileSync(pagePath, "utf8");

  assert.match(pageSource, /<LetterNotes\s*\/>/);
  assert.doesNotMatch(pageSource, /import\s+\{\s*setupLetterNotes\s*\}\s+from\s+"..\/..\/lib\/notesClient\.js"/);
});

test("letter notes are opened from the floating action menu drawer", () => {
  const pageSource = readFileSync(pagePath, "utf8");
  const viewModeSource = readFileSync(viewModePath, "utf8");

  assert.doesNotMatch(pageSource, /notes-toolbar/);
  assert.match(viewModeSource, /data-notes-drawer-toggle/);
  assert.match(viewModeSource, /data-notes-drawer/);
});
