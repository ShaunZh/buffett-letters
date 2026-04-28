import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildCompanyIndex } from "../src/lib/letterPipeline.js";

const rootDir = process.cwd();
const mentionsDir = path.join(rootDir, "src", "data", "company-mentions");
const companiesDir = path.join(rootDir, "src", "data", "companies");
const indexPath = path.join(companiesDir, "index.json");

await mkdir(companiesDir, { recursive: true });

const entries = await readdir(mentionsDir, { withFileTypes: true }).catch((error) => {
  if (error.code === "ENOENT") {
    return [];
  }

  throw error;
});

const mentionDocuments = [];

for (const entry of entries
  .filter((item) => item.isFile() && path.extname(item.name).toLowerCase() === ".json")
  .sort((left, right) => left.name.localeCompare(right.name))) {
  const filePath = path.join(mentionsDir, entry.name);
  const fileContents = await readFile(filePath, "utf8");
  mentionDocuments.push(JSON.parse(fileContents));
}

const index = buildCompanyIndex(mentionDocuments);

await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

console.log(`Wrote ${path.relative(rootDir, indexPath)} with ${index.length} companies.`);
