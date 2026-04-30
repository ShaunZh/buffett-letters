import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  normalizeCompanyMentionsForSplitBlocks,
  normalizeLetterContentBlocksWithMap,
} from "../src/lib/letterBlockTransforms.js";
import { buildCompanyIndex, filterEntriesByRequestedFile } from "../src/lib/letterPipeline.js";

const rootDir = process.cwd();
const lettersDir = path.join(rootDir, "src", "content", "letters");
const mentionsDir = path.join(rootDir, "src", "data", "company-mentions");
const companiesDir = path.join(rootDir, "src", "data", "companies");
const companyIndexPath = path.join(companiesDir, "index.json");
const argv = process.argv.slice(2);
const fileFlagIndex = argv.indexOf("--file");
const requestedFile = fileFlagIndex === -1 ? "" : argv[fileFlagIndex + 1];

if (fileFlagIndex !== -1 && !requestedFile) {
  throw new Error("Missing value for --file.");
}

const entries = await readdir(lettersDir, { withFileTypes: true });
const markdownEntries = filterEntriesByRequestedFile(
  entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".md")
    .sort((left, right) => left.name.localeCompare(right.name)),
  requestedFile,
);

await mkdir(companiesDir, { recursive: true });

for (const entry of markdownEntries) {
  const filePath = path.join(lettersDir, entry.name);
  const source = await readFile(filePath, "utf8");
  const normalized = normalizeLetterContentBlocksWithMap(source);

  if (normalized.markdown !== source) {
    await writeFile(filePath, normalized.markdown, "utf8");
    console.log(`Updated ${path.relative(rootDir, filePath)}`);
  } else {
    console.log(`No changes ${path.relative(rootDir, filePath)}`);
  }

  const mentionPath = path.join(mentionsDir, `${path.basename(entry.name, ".md")}.json`);
  const mentionSource = await readFile(mentionPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") {
      return "";
    }

    throw error;
  });

  if (mentionSource) {
    const mentionDocument = JSON.parse(mentionSource);
    const normalizedMentionDocument = normalizeCompanyMentionsForSplitBlocks(
      mentionDocument,
      normalized.blockIdMap,
    );
    const serializedMentionDocument = `${JSON.stringify(normalizedMentionDocument, null, 2)}\n`;

    if (serializedMentionDocument !== mentionSource) {
      await writeFile(mentionPath, serializedMentionDocument, "utf8");
      console.log(`Updated ${path.relative(rootDir, mentionPath)}`);
    } else {
      console.log(`No changes ${path.relative(rootDir, mentionPath)}`);
    }
  }
}

const mentionEntries = await readdir(mentionsDir, { withFileTypes: true }).catch((error) => {
  if (error.code === "ENOENT") {
    return [];
  }

  throw error;
});
const mentionDocuments = [];

for (const entry of mentionEntries
  .filter((item) => item.isFile() && path.extname(item.name).toLowerCase() === ".json")
  .sort((left, right) => left.name.localeCompare(right.name))) {
  const filePath = path.join(mentionsDir, entry.name);
  mentionDocuments.push(JSON.parse(await readFile(filePath, "utf8")));
}

const companyIndex = buildCompanyIndex(mentionDocuments);
await writeFile(companyIndexPath, `${JSON.stringify(companyIndex, null, 2)}\n`, "utf8");
console.log(`Updated ${path.relative(rootDir, companyIndexPath)}`);
