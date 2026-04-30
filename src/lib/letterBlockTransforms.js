import { parseLetterBlocks } from "./parseLetterBlocks.js";

function splitParagraphs(text = "") {
  return text
    .trim()
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function splitFrontMatter(markdown = "") {
  const match = markdown.match(/^---\n[\s\S]*?\n---\n*/u);

  if (!match) {
    return {
      frontMatter: "",
      body: markdown.trim(),
    };
  }

  return {
    frontMatter: match[0].trimEnd(),
    body: markdown.slice(match[0].length).trim(),
  };
}

function renderBlock(block) {
  return `## ${block.id}

**EN**
${block.en}

**ZH**
${block.zh}`;
}

export function splitBilingualBlockByParagraphs(block) {
  const enParagraphs = splitParagraphs(block.en);
  const zhParagraphs = splitParagraphs(block.zh);

  if (enParagraphs.length <= 1 || enParagraphs.length !== zhParagraphs.length) {
    return [block];
  }

  return enParagraphs.map((en, index) => ({
    id: block.id,
    en,
    zh: zhParagraphs[index],
  }));
}

export function normalizeLetterContentBlocksWithMap(markdown = "") {
  const { frontMatter, body } = splitFrontMatter(markdown);
  const expandedBlocks = parseLetterBlocks(body)
    .map((block) => ({
      originalId: block.id,
      parts: splitBilingualBlockByParagraphs(block),
    }));
  const blockIdMap = {};
  const blocks = [];

  for (const entry of expandedBlocks) {
    blockIdMap[entry.originalId] = entry.parts.map((part) => `p${blocks.length + entry.parts.indexOf(part) + 1}`);

    for (const part of entry.parts) {
      blocks.push({
        ...part,
        id: `p${blocks.length + 1}`,
      });
    }
  }

  const renderedBody = blocks.map((block) => renderBlock(block)).join("\n\n");

  let markdownOutput = "";

  if (!frontMatter) {
    markdownOutput = renderedBody ? `${renderedBody}\n` : "";
  } else if (!renderedBody) {
    markdownOutput = `${frontMatter}\n`;
  } else {
    markdownOutput = `${frontMatter}\n\n${renderedBody}\n`;
  }

  return {
    markdown: markdownOutput,
    blockIdMap,
  };
}

export function normalizeLetterContentBlocks(markdown = "") {
  return normalizeLetterContentBlocksWithMap(markdown).markdown;
}

export function normalizeCompanyMentionsForSplitBlocks(mentions, blockIdMap = {}) {
  if (!mentions || typeof mentions !== "object" || !Array.isArray(mentions.companies)) {
    return mentions;
  }

  return {
    ...mentions,
    companies: mentions.companies.map((company) => ({
      ...company,
      blocks: [...new Set(
        (Array.isArray(company.blocks) ? company.blocks : [])
          .flatMap((blockId) => blockIdMap[blockId] ?? [blockId]),
      )],
    })),
  };
}
