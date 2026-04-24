import test from "node:test";
import assert from "node:assert/strict";

import { parseLetterBlocks } from "../src/lib/parseLetterBlocks.js";

const sampleBody = `
## p1

**EN**
To the Shareholders of Berkshire Hathaway Inc.:

**ZH**
致伯克希尔·哈撒韦公司的股东：

## p2

**EN**
Berkshire has done better than I expected.

**ZH**
伯克希尔的表现比我预期得更好。
`;

test("parseLetterBlocks extracts ordered bilingual blocks from markdown body", () => {
  const blocks = parseLetterBlocks(sampleBody);

  assert.deepEqual(blocks, [
    {
      id: "p1",
      en: "To the Shareholders of Berkshire Hathaway Inc.:",
      zh: "致伯克希尔·哈撒韦公司的股东：",
    },
    {
      id: "p2",
      en: "Berkshire has done better than I expected.",
      zh: "伯克希尔的表现比我预期得更好。",
    },
  ]);
});

test("parseLetterBlocks ignores incomplete sections and trims block content", () => {
  const body = `
## p9

**EN**
  English line with spaces.  

**ZH**

  中文内容。  

## p10

**EN**
Missing zh section
`;

  const blocks = parseLetterBlocks(body);

  assert.deepEqual(blocks, [
    {
      id: "p9",
      en: "English line with spaces.",
      zh: "中文内容。",
    },
  ]);
});
