import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pagePath = new URL("../src/pages/letters/[slug].astro", import.meta.url);
const partnerPagePath = new URL("../src/pages/partner-letters/[slug].astro", import.meta.url);
const cssPath = new URL("../src/styles/global.css", import.meta.url);

test("letter detail page computes previous and next entries from the same collection", () => {
  const pageSource = readFileSync(pagePath, "utf8");

  assert.match(pageSource, /const previousEntry = entries\[index - 1\];/);
  assert.match(pageSource, /const nextEntry = entries\[index \+ 1\];/);
  assert.match(pageSource, /props:\s*\{\s*entry,\s*previousEntry,\s*nextEntry\s*\}/);
});

test("partner letter page uses the partner letters collection and route prefix", () => {
  const pageSource = readFileSync(partnerPagePath, "utf8");

  assert.match(pageSource, /getCollection\("partner-letters"\)/);
  assert.match(pageSource, /href=\{`\/partner-letters\/\$\{previousEntry\.slug\}\/`\}/);
  assert.match(pageSource, /href=\{`\/partner-letters\/\$\{nextEntry\.slug\}\/`\}/);
  assert.match(pageSource, /data-letter-slug=\{`partner-\$\{entry\.slug\}`\}/);
});

test("letter detail page renders bottom centered previous and next controls with disabled states", () => {
  const pageSource = readFileSync(pagePath, "utf8");
  const css = readFileSync(cssPath, "utf8");

  assert.match(pageSource, /<nav class="letter-page-nav"/);
  assert.match(pageSource, /上一篇/);
  assert.match(pageSource, /下一篇/);
  assert.match(pageSource, /aria-disabled="true"/);
  assert.match(css, /\.letter-page-nav\s*\{[\s\S]*position:\s*fixed;/);
  assert.match(css, /\.letter-page-nav\s*\{[\s\S]*left:\s*50%;/);
  assert.match(css, /\.letter-detail\s*\{[\s\S]*padding-bottom:\s*5\.5rem;/);
  assert.match(css, /\.letter-page-nav\s*\{[\s\S]*bottom:\s*0\.55rem;/);
  assert.match(css, /\.letter-page-nav__button\[aria-disabled="true"\]/);
});
