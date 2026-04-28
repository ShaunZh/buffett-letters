import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import {
  filterEntriesByRequestedFile,
  getExtractOptions,
  normalizeExtractedText,
} from "../src/lib/letterPipeline.js";

const rootDir = process.cwd();
const rawLettersDir = path.join(rootDir, "raw-letters");
const outputDir = path.join(rootDir, "tmp", "raw-markdown");
const options = getExtractOptions(process.argv.slice(2));

await mkdir(outputDir, { recursive: true });

const entries = await readdir(rawLettersDir, { withFileTypes: true });
const pdfEntries = filterEntriesByRequestedFile(
  entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".pdf")
    .sort((left, right) => left.name.localeCompare(right.name)),
  options.file,
);

if (pdfEntries.length === 0) {
  console.log("No PDF files found in raw-letters/.");
  process.exit(0);
}

for (const entry of pdfEntries) {
  const pdfPath = path.join(rawLettersDir, entry.name);
  const tempTextPath = path.join(outputDir, `${path.basename(entry.name, ".pdf")}.txt`);
  const markdownPath = path.join(outputDir, `${path.basename(entry.name, ".pdf")}.md`);

  await runPdftotext(pdfPath, tempTextPath, options);

  const extractedText = await readFile(tempTextPath, "utf8");
  const markdown = normalizeExtractedText(extractedText, options);

  await writeFile(markdownPath, `${markdown}\n`, "utf8");
  await rm(tempTextPath, { force: true });

  console.log(`Extracted ${path.relative(rootDir, pdfPath)} -> ${path.relative(rootDir, markdownPath)}`);
}

async function runPdftotext(pdfPath, textPath, options) {
  await new Promise((resolve, reject) => {
    const args = ["-enc", "UTF-8", "-nopgbrk"];

    if (options.preserveLayout) {
      args.push("-layout");
    }

    args.push(pdfPath, textPath);

    const child = spawn("pdftotext", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        reject(new Error("pdftotext is not installed or not available on PATH."));
        return;
      }

      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`pdftotext failed for ${pdfPath}: ${stderr.trim() || `exit code ${code}`}`));
    });
  });
}
