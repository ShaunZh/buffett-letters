import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const configPath = new URL("../src/content.config.js", import.meta.url);
const pagePath = new URL("../src/pages/letters/[slug].astro", import.meta.url);

test("letter collection schema supports official source and local pdf fields", () => {
  const configSource = readFileSync(configPath, "utf8");

  assert.match(configSource, /sourceUrl:\s*z\.string\(\)\.url\(\)\.optional\(\)/);
  assert.match(configSource, /pdfPath:\s*z\.string\(\)\.optional\(\)/);
});

test("letter detail page exposes a source document link when a pdf or source url exists", () => {
  const pageSource = readFileSync(pagePath, "utf8");

  assert.match(pageSource, /const sourceDocumentUrl = entry\.data\.pdfPath \?\? entry\.data\.sourceUrl;/);
  assert.match(pageSource, /sourceDocumentUrl &&/);
  assert.match(pageSource, /<div class="letter-detail__title-row">/);
  assert.match(pageSource, /class="source-link source-link--inline"/);
  assert.match(pageSource, /aria-label="查看原件"/);
  assert.match(pageSource, /title="查看原件"/);
  assert.doesNotMatch(pageSource, />\s*查看原件\s*</);
});
