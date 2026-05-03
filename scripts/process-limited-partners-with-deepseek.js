import { access, constants, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildLimitedPartnerDeepSeekPrompt,
  deriveLimitedPartnerLetterSlug,
  filterEntriesByRequestedFile,
  formatElapsed,
  getProcessOptions,
  parseDeepSeekResponse,
  shouldSkipLetterProcessing,
} from "../src/lib/letterPipeline.js";
import {
  normalizeCompanyMentionsForSplitBlocks,
  normalizeLetterContentBlocksWithMap,
} from "../src/lib/letterBlockTransforms.js";

const rootDir = process.cwd();
const rawMarkdownDir = path.join(rootDir, "limited-partners-letters", "letters");
const sourcePdfPath = path.join(rootDir, "limited-partners-letters", "1956-1970.pdf");
const lettersDir = path.join(rootDir, "src", "content", "partner-letters");
const mentionsDir = path.join(rootDir, "src", "data", "company-mentions");
const options = getProcessOptions(process.argv.slice(2));

const apiKey = process.env.DEEPSEEK_API_KEY;
const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";

if (!apiKey) {
  throw new Error("Missing DEEPSEEK_API_KEY environment variable.");
}

await mkdir(lettersDir, { recursive: true });
await mkdir(mentionsDir, { recursive: true });

const entries = await readdir(rawMarkdownDir, { withFileTypes: true });
const markdownEntries = filterEntriesByRequestedFile(
  entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".md")
    .sort((left, right) => left.name.localeCompare(right.name)),
  options.file,
);

if (markdownEntries.length === 0) {
  console.log("No limited partner markdown files found in limited-partners-letters/letters/.");
  process.exit(0);
}

console.log(`Found ${markdownEntries.length} limited partner letter file(s) to inspect.`);

let processedCount = 0;
let skippedCount = 0;
const batchStartedAt = Date.now();

for (const [index, entry] of markdownEntries.entries()) {
  const rawMarkdownPath = path.join(rawMarkdownDir, entry.name);
  const rawMarkdown = await readFile(rawMarkdownPath, "utf8");
  const slug = deriveLimitedPartnerLetterSlug(rawMarkdownPath);
  const letterOutputPath = path.join(lettersDir, `${slug}.md`);
  const mentionsOutputPath = path.join(mentionsDir, `${slug}.json`);
  const letterExists = await fileExists(letterOutputPath);
  const mentionsExist = await fileExists(mentionsOutputPath);
  const label = `[${index + 1}/${markdownEntries.length}] ${path.basename(rawMarkdownPath)}`;

  if (shouldSkipLetterProcessing({
    force: options.force,
    letterExists,
    mentionsExist,
  })) {
    skippedCount += 1;
    console.log(`${label} skipped because output files already exist.`);
    continue;
  }

  console.log(`${label} preparing prompt for slug "${slug}".`);

  const prompt = buildLimitedPartnerDeepSeekPrompt({
    rawMarkdown,
    rawMarkdownPath: path.relative(rootDir, rawMarkdownPath),
    sourcePdfPath: path.relative(rootDir, sourcePdfPath),
    letterOutputPath: path.relative(rootDir, letterOutputPath),
    mentionsOutputPath: path.relative(rootDir, mentionsOutputPath),
    slug,
  });

  console.log(`${label} sending request to DeepSeek with model "${model}".`);
  const requestStartedAt = Date.now();
  const responseText = await callDeepSeek({
    apiKey,
    baseUrl,
    model,
    prompt,
    onHeartbeat: (elapsed) => {
      console.log(`${label} still waiting for DeepSeek... ${formatElapsed(elapsed)} elapsed.`);
    },
  });
  console.log(`${label} received DeepSeek response after ${formatElapsed(Date.now() - requestStartedAt)}.`);

  const payload = parseDeepSeekResponse(responseText);
  const normalizedLetter = normalizeLetterContentBlocksWithMap(payload.letterMarkdown);
  const normalizedMentions = normalizeCompanyMentionsForSplitBlocks(
    payload.companyMentions,
    normalizedLetter.blockIdMap,
  );

  await writeFile(letterOutputPath, normalizedLetter.markdown, "utf8");
  await writeFile(mentionsOutputPath, `${JSON.stringify(normalizedMentions, null, 2)}\n`, "utf8");
  processedCount += 1;

  console.log(
    `${label} wrote ${path.relative(rootDir, letterOutputPath)} and ${path.relative(rootDir, mentionsOutputPath)}.`,
  );
}

console.log(
  `Batch complete: processed ${processedCount}, skipped ${skippedCount}, total ${markdownEntries.length} in ${formatElapsed(Date.now() - batchStartedAt)}.`,
);

async function callDeepSeek({ apiKey, baseUrl, model, prompt, onHeartbeat }) {
  const startedAt = Date.now();
  const heartbeat = typeof onHeartbeat === "function"
    ? setInterval(() => onHeartbeat(Date.now() - startedAt), 15_000)
    : null;

  let response;

  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
  } finally {
    if (heartbeat) {
      clearInterval(heartbeat);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("DeepSeek API returned an empty response.");
  }

  return content;
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}
