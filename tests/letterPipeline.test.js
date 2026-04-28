import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCompanyIndex,
  filterEntriesByRequestedFile,
  getExtractOptions,
  normalizeExtractedText,
  parseDeepSeekResponse,
} from "../src/lib/letterPipeline.js";

test("normalizeExtractedText merges hard wraps inside paragraphs and preserves blank lines", () => {
  const raw = `To the Shareholders of Berkshire Hathaway Inc.:
This letter comes to you as part
of Berkshire's annual report.


"Report," however, implies a greater responsibility.
`;

  assert.equal(
    normalizeExtractedText(raw),
    `To the Shareholders of Berkshire Hathaway Inc.: This letter comes to you as part of Berkshire's annual report.

"Report," however, implies a greater responsibility.`,
  );
});

test("normalizeExtractedText removes isolated page numbers but leaves table-like lines alone", () => {
  const raw = `1

American Express 18.7% 261 998
Apple 5.7% 773 2519

2`;

  assert.equal(
    normalizeExtractedText(raw),
    `American Express 18.7% 261 998 Apple 5.7% 773 2519`,
  );
});

test("parseDeepSeekResponse unwraps fenced JSON output", () => {
  const payload = parseDeepSeekResponse(`\`\`\`json
{
  "letterMarkdown": "---\\ntitle: Demo\\n---",
  "companyMentions": {
    "letter_slug": "2024-letter",
    "companies": [
      {
        "slug": "geico",
        "name_en": "GEICO",
        "name_zh": "盖可保险",
        "blocks": ["p28", "p29"]
      }
    ]
  }
}
\`\`\``);

  assert.equal(payload.letterMarkdown, "---\ntitle: Demo\n---");
  assert.deepEqual(payload.companyMentions, {
    letter_slug: "2024-letter",
    companies: [
      {
        slug: "geico",
        name_en: "GEICO",
        name_zh: "盖可保险",
        blocks: ["p28", "p29"],
      },
    ],
  });
});

test("buildCompanyIndex deduplicates letters and sorts companies by chinese then english name", () => {
  const index = buildCompanyIndex([
    {
      letter_slug: "2024-letter",
      companies: [
        { slug: "apple", name_en: "Apple", name_zh: "苹果公司", blocks: ["p1"] },
        { slug: "geico", name_en: "GEICO", name_zh: "盖可保险", blocks: ["p2", "p3"] },
      ],
    },
    {
      letter_slug: "2023-letter",
      companies: [
        { slug: "geico", name_en: "GEICO", name_zh: "盖可保险", blocks: ["p9"] },
      ],
    },
  ]);

  assert.deepEqual(index, [
    {
      slug: "geico",
      name_en: "GEICO",
      name_zh: "盖可保险",
      letters: ["2023-letter", "2024-letter"],
      mention_count: 3,
    },
    {
      slug: "apple",
      name_en: "Apple",
      name_zh: "苹果公司",
      letters: ["2024-letter"],
      mention_count: 1,
    },
  ]);
});

test("filterEntriesByRequestedFile keeps the requested markdown file only", () => {
  const entries = [
    { name: "2023.md" },
    { name: "2024.md" },
    { name: "notes.txt" },
  ];

  assert.deepEqual(
    filterEntriesByRequestedFile(entries, "2024.md"),
    [{ name: "2024.md" }],
  );
});

test("filterEntriesByRequestedFile accepts a base name without extension", () => {
  const entries = [
    { name: "2023.pdf" },
    { name: "2024.pdf" },
  ];

  assert.deepEqual(
    filterEntriesByRequestedFile(entries, "2024"),
    [{ name: "2024.pdf" }],
  );
});

test("filterEntriesByRequestedFile throws when the requested file is missing", () => {
  assert.throws(
    () => filterEntriesByRequestedFile([{ name: "2024.md" }], "2025.md"),
    /Requested file not found/u,
  );
});

test("normalizeExtractedText preserves line breaks in layout mode", () => {
  const raw = `BERKSHIRE HATHAWAY INC.

To the Shareholders of Berkshire Hathaway Inc.:
    This letter comes to you as part of Berkshire's annual report.
As a public company, we are required to periodically tell you many specific facts.

1`;

  assert.equal(
    normalizeExtractedText(raw, { preserveLayout: true }),
    `BERKSHIRE HATHAWAY INC.

To the Shareholders of Berkshire Hathaway Inc.:
    This letter comes to you as part of Berkshire's annual report.
As a public company, we are required to periodically tell you many specific facts.`,
  );
});

test("getExtractOptions reads file and layout flags together", () => {
  assert.deepEqual(
    getExtractOptions(["--file", "2024.pdf", "--layout"]),
    {
      file: "2024.pdf",
      preserveLayout: true,
    },
  );
});

test("getExtractOptions preserves layout by default", () => {
  assert.deepEqual(
    getExtractOptions([]),
    {
      file: "",
      preserveLayout: true,
    },
  );
});
