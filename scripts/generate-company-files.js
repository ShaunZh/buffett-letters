import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const INDEX_PATH = join("src", "data", "companies", "index.json");
const OUTPUT_DIR = join("src", "content", "companies");

const companies = JSON.parse(readFileSync(INDEX_PATH, "utf-8"));

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

for (const company of companies) {
  const filePath = join(OUTPUT_DIR, `${company.slug}.md`);

  if (existsSync(filePath)) {
    console.log(`  Skipping existing: ${company.slug}`);
    continue;
  }

  const frontmatter = [
    `name_en: "${company.name_en}"`,
    `name_zh: "${company.name_zh}"`,
    `draft: false`,
  ].join("\n");

  const content = `---\n${frontmatter}\n---\n\n（待补充）\n`;

  writeFileSync(filePath, content, "utf-8");
  console.log(`  Created: ${company.slug}`);
}

console.log(`\nDone. Generated files for ${companies.length} companies.`);