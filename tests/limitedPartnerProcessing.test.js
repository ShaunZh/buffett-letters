import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildLimitedPartnerDeepSeekPrompt,
  deriveLimitedPartnerLetterSlug,
} from "../src/lib/letterPipeline.js";

const configPath = new URL("../src/content.config.js", import.meta.url);
const layoutPath = new URL("../src/layouts/BaseLayout.astro", import.meta.url);
const scriptPath = new URL("../scripts/process-limited-partners-with-deepseek.js", import.meta.url);

test("deriveLimitedPartnerLetterSlug uses the same filename convention as shareholder letters", () => {
  assert.equal(deriveLimitedPartnerLetterSlug("limited-partners-letters/letters/1957.md"), "1957-letter");
  assert.equal(
    deriveLimitedPartnerLetterSlug("limited-partners-letters/letters/1962-01-24.md"),
    "1962-01-24-letter",
  );
});

test("limited partner processing targets the partner letters content collection", () => {
  const config = readFileSync(configPath, "utf8");
  const script = readFileSync(scriptPath, "utf8");

  assert.match(config, /"partner-letters":\s*partnerLetters/);
  assert.match(script, /"src",\s*"content",\s*"partner-letters"/);
});

test("buildLimitedPartnerDeepSeekPrompt requires partner letter frontmatter and output paths", () => {
  const prompt = buildLimitedPartnerDeepSeekPrompt({
    rawMarkdown: "Our Performance in 1961",
    rawMarkdownPath: "limited-partners-letters/letters/1962-01-24.md",
    sourcePdfPath: "limited-partners-letters/1956-1970.pdf",
    letterOutputPath: "src/content/partner-letters/1962-01-24-letter.md",
    mentionsOutputPath: "src/data/company-mentions/1962-01-24-letter.json",
    slug: "1962-01-24-letter",
  });

  assert.match(prompt, /type` 必须固定写为 `limited-partner-letter`/);
  assert.match(prompt, /1962-01-24-letter/);
  assert.match(prompt, /limited-partners-letters\/letters\/1962-01-24\.md/);
  assert.match(prompt, /"companyMentions"/);
});

test("base layout renders separate navigation sections for shareholder and limited partner letters", () => {
  const source = readFileSync(layoutPath, "utf8");

  assert.match(source, /shareholderNavEntries/);
  assert.match(source, /await getCollection\("partner-letters"\)/);
  assert.match(source, /limitedPartnerNavEntries/);
  assert.match(source, /const isShareholderNavActive = shareholderNavEntries\.some/);
  assert.match(source, /const isLimitedPartnerNavActive = limitedPartnerNavEntries\.some/);
  assert.match(source, /<div class="site-directories">/);
  assert.match(source, /open=\{isShareholderNavActive \|\| !isLimitedPartnerNavActive\}/);
  assert.match(source, /open=\{isLimitedPartnerNavActive\}/);
  assert.match(source, /伯克希尔股东信/);
  assert.match(source, /致合伙人的信/);
});
