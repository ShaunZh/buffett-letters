import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildDeepSeekPrompt,
  deriveLetterSlug,
  filterEntriesByRequestedFile,
  parseDeepSeekResponse,
} from "../src/lib/letterPipeline.js";

const rootDir = process.cwd();
const rawMarkdownDir = path.join(rootDir, "tmp", "raw-markdown");
const lettersDir = path.join(rootDir, "src", "content", "letters");
const mentionsDir = path.join(rootDir, "src", "data", "company-mentions");
const templatePath = path.join(rootDir, "codex_letter_processing_prompt_template.md");
const requestedFile = getRequestedFile(process.argv.slice(2));

const apiKey = process.env.DEEPSEEK_API_KEY;
const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";

if (!apiKey) {
  throw new Error("Missing DEEPSEEK_API_KEY environment variable.");
}

await mkdir(lettersDir, { recursive: true });
await mkdir(mentionsDir, { recursive: true });

const template = await readFile(templatePath, "utf8");
const entries = await readdir(rawMarkdownDir, { withFileTypes: true });
const markdownEntries = filterEntriesByRequestedFile(
  entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".md")
    .sort((left, right) => left.name.localeCompare(right.name)),
  requestedFile,
);

if (markdownEntries.length === 0) {
  console.log("No extracted markdown files found in tmp/raw-markdown/.");
  process.exit(0);
}

for (const entry of markdownEntries) {
  const rawMarkdownPath = path.join(rawMarkdownDir, entry.name);
  const rawMarkdown = await readFile(rawMarkdownPath, "utf8");
  const slug = deriveLetterSlug(rawMarkdownPath);
  const sourcePdfPath = path.join(rootDir, "raw-letters", `${path.basename(entry.name, ".md")}.pdf`);
  const letterOutputPath = path.join(lettersDir, `${slug}.md`);
  const mentionsOutputPath = path.join(mentionsDir, `${slug}.json`);
  const prompt = buildDeepSeekPrompt({
    template,
    rawMarkdown,
    rawMarkdownPath: path.relative(rootDir, rawMarkdownPath),
    sourcePdfPath: path.relative(rootDir, sourcePdfPath),
    letterOutputPath: path.relative(rootDir, letterOutputPath),
    mentionsOutputPath: path.relative(rootDir, mentionsOutputPath),
    slug,
  });

  const responseText = await callDeepSeek({ apiKey, baseUrl, model, prompt });
  const payload = parseDeepSeekResponse(responseText);

  await writeFile(letterOutputPath, `${payload.letterMarkdown}\n`, "utf8");
  await writeFile(mentionsOutputPath, `${JSON.stringify(payload.companyMentions, null, 2)}\n`, "utf8");

  console.log(`Processed ${path.relative(rootDir, rawMarkdownPath)} -> ${path.relative(rootDir, letterOutputPath)}`);
}

async function callDeepSeek({ apiKey, baseUrl, model, prompt }) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
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
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

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

function getRequestedFile(argv) {
  const fileFlagIndex = argv.indexOf("--file");

  if (fileFlagIndex === -1) {
    return "";
  }

  const requestedFile = argv[fileFlagIndex + 1];

  if (!requestedFile) {
    throw new Error("Missing value for --file.");
  }

  return requestedFile;
}
