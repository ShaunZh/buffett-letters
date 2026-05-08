#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const companiesDir = path.join(__dirname, "../src/content/companies");

/**
 * Parse reference-style link definition
 * Pattern: [id]: url "title" or [id]: url 'title' or [id]: url (title)
 */
function parseRefLink(line) {
  const match = line.match(/^\[([^\]]+)\]:\s*(\S+)\s*(?:"([^"]*)"|'([^']*)'|\(([^)]*)\))?/);
  if (!match) return null;

  const id = match[1];
  const url = match[2];
  const title = match[3] || match[4] || match[5] || "";

  return { id, url, title };
}

/**
 * Convert reference links to bullet list items
 */
function convertRefLinksToBulletList(content) {
  const lines = content.split("\n");
  const refLinks = [];
  const nonRefLines = [];
  let inRefSection = false;
  let refSectionHeaderIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for reference section header
    if (/^##\s+参考引用/.test(trimmed)) {
      inRefSection = true;
      refSectionHeaderIndex = i;
      nonRefLines.push(line);
      continue;
    }

    // Check if we're leaving the reference section (another header)
    if (inRefSection && /^##\s+/.test(trimmed) && !/参考引用/.test(trimmed)) {
      inRefSection = false;
    }

    if (inRefSection) {
      const refLink = parseRefLink(trimmed);
      if (refLink) {
        refLinks.push(refLink);
      } else if (trimmed && !trimmed.startsWith("[")) {
        // Non-empty, non-ref-link line in ref section - keep it
        nonRefLines.push(line);
      }
    } else {
      nonRefLines.push(line);
    }
  }

  // If no ref links found, return original content
  if (refLinks.length === 0) {
    return { content, changed: false };
  }

  // Build bullet list from ref links
  const bulletItems = refLinks.map((ref) => {
    if (ref.title) {
      return `- [${ref.title}](${ref.url})`;
    }
    return `- [${ref.id}](${ref.url})`;
  });

  // Find where to insert bullet list (after the header)
  const resultLines = [];
  let inserted = false;

  for (let i = 0; i < nonRefLines.length; i++) {
    const line = nonRefLines[i];
    resultLines.push(line);

    if (/^##\s+参考引用/.test(line.trim())) {
      resultLines.push("");
      resultLines.push(...bulletItems);
      inserted = true;
    }
  }

  return {
    content: resultLines.join("\n"),
    changed: true,
    count: refLinks.length,
  };
}

/**
 * Process all company markdown files
 */
function processFiles() {
  const files = fs.readdirSync(companiesDir).filter((f) => f.endsWith(".md"));

  let totalConverted = 0;
  let filesChanged = 0;

  for (const file of files) {
    const filePath = path.join(companiesDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    const result = convertRefLinksToBulletList(content);

    if (result.changed) {
      fs.writeFileSync(filePath, result.content, "utf-8");
      console.log(`✓ ${file}: converted ${result.count} reference links`);
      filesChanged++;
      totalConverted += result.count;
    }
  }

  console.log(`\nDone! ${filesChanged} files updated, ${totalConverted} links converted.`);
}

processFiles();