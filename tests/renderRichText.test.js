import test from "node:test";
import assert from "node:assert/strict";

import { renderRichText } from "../src/lib/renderRichText.js";

test("renderRichText renders markdown headings instead of literal hashes", () => {
  const html = renderRichText("## The Scorecard in 2023");

  assert.match(html, /<h2>.*The Scorecard in .*2023.*<\/h2>/);
});

test("renderRichText renders markdown tables into semantic table markup", () => {
  const markdown = `| (in $ millions) | 2023 | 2022 |
|----------------|------|------|
| Insurance-underwriting | $5,428 | $(30) |
| Railroad | 5,087 | 5,946 |`;

  const html = renderRichText(markdown);

  assert.match(html, /<table>/);
  assert.match(html, /<thead>/);
  assert.match(html, /<tbody>/);
  assert.match(html, /<th[^>]*>.*2023.*<\/th>/);
  assert.match(html, /<td[^>]*>.*5,087.*<\/td>/);
});

test("renderRichText highlights financial numbers with semantic classes", () => {
  const html = renderRichText("Operating earnings were $37,350 while underwriting fell to $(30).");

  assert.match(html, /rich-number rich-number--currency/);
  assert.match(html, /rich-number [^"]*rich-number--negative/);
});
