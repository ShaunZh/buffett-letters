import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeCompanyMentionsForSplitBlocks,
  normalizeLetterContentBlocks,
  normalizeLetterContentBlocksWithMap,
  splitBilingualBlockByParagraphs,
} from "../src/lib/letterBlockTransforms.js";

test("splitBilingualBlockByParagraphs expands a block when english and chinese paragraph counts match", () => {
  const result = splitBilingualBlockByParagraphs({
    id: "p1",
    en: `To the Stockholders of Berkshire Hathaway Inc.:

Last year, when discussing the prospects for 1975, we stated "the outlook for 1975 is not encouraging."`,
    zh: `致伯克希尔·哈撒韦公司全体股东：

去年，在讨论 1975 年前景时，我们曾表示“1975 年的前景并不令人鼓舞”。`,
  });

  assert.deepEqual(result, [
    {
      id: "p1",
      en: "To the Stockholders of Berkshire Hathaway Inc.:",
      zh: "致伯克希尔·哈撒韦公司全体股东：",
    },
    {
      id: "p1",
      en: `Last year, when discussing the prospects for 1975, we stated "the outlook for 1975 is not encouraging."`,
      zh: "去年，在讨论 1975 年前景时，我们曾表示“1975 年的前景并不令人鼓舞”。",
    },
  ]);
});

test("splitBilingualBlockByParagraphs keeps a block intact when paragraph counts do not match", () => {
  const block = {
    id: "p9",
    en: `First paragraph.

Second paragraph.`,
    zh: "仍然只有一个中文段落。",
  };

  assert.deepEqual(splitBilingualBlockByParagraphs(block), [block]);
});

test("normalizeLetterContentBlocks renumbers expanded blocks sequentially", () => {
  const input = `---
title: "1975 Letter to Shareholders"
title_zh: "1975 年致股东信"
slug: "1975-letter"
date: "1976-02-28"
type: "shareholder-letter"
tags:
  - berkshire
summary: "demo"
draft: false
---

## p1

**EN**
To the Stockholders of Berkshire Hathaway Inc.:

Last year, when discussing the prospects for 1975, we stated "the outlook for 1975 is not encouraging."

**ZH**
致伯克希尔·哈撒韦公司全体股东：

去年，在讨论 1975 年前景时，我们曾表示“1975 年的前景并不令人鼓舞”。

## p2

**EN**
On balance, however, current trends indicate a somewhat brighter 1976.

**ZH**
总体来看，当前趋势预示 1976 年会略有好转。
`;

  assert.equal(
    normalizeLetterContentBlocks(input),
    `---
title: "1975 Letter to Shareholders"
title_zh: "1975 年致股东信"
slug: "1975-letter"
date: "1976-02-28"
type: "shareholder-letter"
tags:
  - berkshire
summary: "demo"
draft: false
---

## p1

**EN**
To the Stockholders of Berkshire Hathaway Inc.:

**ZH**
致伯克希尔·哈撒韦公司全体股东：

## p2

**EN**
Last year, when discussing the prospects for 1975, we stated "the outlook for 1975 is not encouraging."

**ZH**
去年，在讨论 1975 年前景时，我们曾表示“1975 年的前景并不令人鼓舞”。

## p3

**EN**
On balance, however, current trends indicate a somewhat brighter 1976.

**ZH**
总体来看，当前趋势预示 1976 年会略有好转。
`,
  );
});

test("normalizeLetterContentBlocksWithMap returns old-to-new block ids for downstream references", () => {
  const input = `## p1

**EN**
Heading line.

Body line.

**ZH**
标题行。

正文行。

## p2

**EN**
Standalone paragraph.

**ZH**
独立段落。`;

  const result = normalizeLetterContentBlocksWithMap(input);

  assert.deepEqual(result.blockIdMap, {
    p1: ["p1", "p2"],
    p2: ["p3"],
  });
});

test("normalizeCompanyMentionsForSplitBlocks remaps mentions onto expanded blocks", () => {
  const mentions = {
    letter_slug: "1975-letter",
    companies: [
      {
        slug: "berkshire-hathaway",
        name_en: "Berkshire Hathaway Inc.",
        name_zh: "伯克希尔·哈撒韦公司",
        blocks: ["p1", "p2"],
      },
    ],
  };

  const normalized = normalizeCompanyMentionsForSplitBlocks(mentions, {
    p1: ["p1", "p2"],
    p2: ["p3"],
  });

  assert.deepEqual(normalized, {
    letter_slug: "1975-letter",
    companies: [
      {
        slug: "berkshire-hathaway",
        name_en: "Berkshire Hathaway Inc.",
        name_zh: "伯克希尔·哈撒韦公司",
        blocks: ["p1", "p2", "p3"],
      },
    ],
  });
});
