import path from "node:path";

export function normalizeExtractedText(text, options = {}) {
  const preserveLayout = options.preserveLayout === true;
  const normalized = text.replace(/\r\n?/g, "\n");
  const lines = normalized
    .split("\n")
    .map((line) => preserveLayout ? line.replace(/[ \t]+$/g, "") : line.replace(/[ \t]+/g, " ").trim());

  const paragraphs = [];
  let current = [];

  for (const line of lines) {
    if (!line) {
      if (current.length > 0) {
        paragraphs.push(current.join(preserveLayout ? "\n" : " "));
        current = [];
      }
      continue;
    }

    if (/^\d+$/.test(line)) {
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    paragraphs.push(current.join(preserveLayout ? "\n" : " "));
  }

  return paragraphs.join("\n\n").trim();
}

export function deriveLetterSlug(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath));
  const exactYear = baseName.match(/^(\d{4})$/)?.[1];

  if (exactYear) {
    return `${exactYear}-letter`;
  }

  return `${slugify(baseName)}-letter`;
}

export function deriveLimitedPartnerLetterSlug(filePath) {
  return deriveLetterSlug(filePath);
}

export function buildDeepSeekPrompt({
  template,
  rawMarkdown,
  rawMarkdownPath,
  sourcePdfPath,
  letterOutputPath,
  mentionsOutputPath,
  slug,
}) {
  const templateWithPath = template.replace(
    "`[在这里替换成你的原始 md 文件路径]`",
    `\`${rawMarkdownPath}\``,
  );

  return `${templateWithPath}

---

请额外遵守下面的输出协议。

1. 不要解释，不要输出多余说明。
2. 你的整个回复必须是一个 JSON 对象，不要加 Markdown 代码块。
3. JSON 结构固定为：

{
  "letterMarkdown": "完整 Markdown 文件内容",
  "companyMentions": {
    "letter_slug": "${slug}",
    "companies": [
      {
        "slug": "company-slug",
        "name_en": "Company Name",
        "name_zh": "公司中文名",
        "blocks": ["p1", "p2"]
      }
    ]
  }
}

4. \`letterMarkdown\` 必须是要写入 ${letterOutputPath} 的完整文件内容。
5. \`companyMentions\` 必须是要写入 ${mentionsOutputPath} 的 JSON 数据。
6. \`companies\` 只保留确实出现且值得收集的公司，不要过度泛化。
7. \`blocks\` 只能引用你在正文里真正生成的 block id。
8. 如果没有可收集公司，返回 "companies": []。

当前文件信息：
- 原始 Markdown 路径：${rawMarkdownPath}
- 原始 PDF 路径：${sourcePdfPath}
- 目标信件文件：${letterOutputPath}
- 目标公司提及文件：${mentionsOutputPath}
- 推荐 slug：${slug}

原始 Markdown 正文如下：

${rawMarkdown}`;
}

export function buildLimitedPartnerDeepSeekPrompt({
  rawMarkdown,
  rawMarkdownPath,
  sourcePdfPath,
  letterOutputPath,
  mentionsOutputPath,
  slug,
}) {
  return `# Codex 合伙人信处理 Prompt

你现在在一个内容网站项目中工作。请把我提供的原始 md 格式巴菲特致合伙人的信，处理成一个可直接用于网站展示的标准化内容文件。

## 输出目标

生成一个新的内容文件，文件路径为：

- ${letterOutputPath}

同时生成公司提及数据，文件路径为：

- ${mentionsOutputPath}

## Front matter 规范

请在文件顶部生成 YAML front matter，至少包含以下字段：

- \`title\`: 英文标题
- \`title_zh\`: 中文标题
- \`slug\`: 固定写为 \`${slug}\`
- \`date\`: 信件日期，格式 \`YYYY-MM-DD\`，优先从原文标题、页眉或日期行推断；如果只能确定年份，使用该年最可信日期
- \`type\` 必须固定写为 \`limited-partner-letter\`
- \`tags\`: 标签数组，必须包含 \`partnership\` 和 \`limited-partners\`
- \`summary\`: 1 句中文摘要
- \`draft\`: 固定写为 \`false\`

## 正文整理规则

请把正文整理为固定 block 结构：

\`\`\`md
## p1

**EN**
English paragraph here.

**ZH**
Chinese translation here.
\`\`\`

要求：

1. 按自然段拆分，不要整篇只做成一个大块。
2. block id 按顺序编号：\`p1\`, \`p2\`, \`p3\`。
3. 每个 block 都必须同时包含 \`**EN**\` 和 \`**ZH**\`。
4. 英文部分尽量保留原文，不要润色成现代文章。
5. 中文部分翻译自然、准确，保留巴菲特合伙时期的语气。
6. 不要省略重要数字、年份、人物名、投资术语。
7. 小节标题可单独成 block。
8. 表格必须输出为标准 Markdown 表格；英文和中文都要保留表格结构，不能改写成叙述段落。

## 公司提及数据

请基于正文提取值得收集的公司提及，输出 \`companyMentions\`。如果没有明确公司提及，返回空数组。

## 输出协议

1. 不要解释，不要输出多余说明。
2. 你的整个回复必须是一个 JSON 对象，不要加 Markdown 代码块。
3. JSON 结构固定为：

{
  "letterMarkdown": "完整 Markdown 文件内容",
  "companyMentions": {
    "letter_slug": "${slug}",
    "companies": [
      {
        "slug": "company-slug",
        "name_en": "Company Name",
        "name_zh": "公司中文名",
        "blocks": ["p1", "p2"]
      }
    ]
  }
}

4. \`letterMarkdown\` 必须是要写入 ${letterOutputPath} 的完整文件内容。
5. \`companyMentions\` 必须是要写入 ${mentionsOutputPath} 的 JSON 数据。
6. \`blocks\` 只能引用你在正文里真正生成的 block id。

当前文件信息：
- 原始 Markdown 路径：${rawMarkdownPath}
- 原始 PDF 路径：${sourcePdfPath}
- 目标信件文件：${letterOutputPath}
- 目标公司提及文件：${mentionsOutputPath}
- 推荐 slug：${slug}

原始 Markdown 正文如下：

${rawMarkdown}`;
}

export function parseDeepSeekResponse(content) {
  const trimmed = content.trim();
  const unwrapped = trimmed
    .replace(/^```(?:json)?\s*/u, "")
    .replace(/\s*```$/u, "");
  const parsed = JSON.parse(unwrapped);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("DeepSeek response is not a JSON object.");
  }

  if (typeof parsed.letterMarkdown !== "string" || !parsed.letterMarkdown.trim()) {
    throw new Error("DeepSeek response is missing a non-empty letterMarkdown string.");
  }

  const mentions = parsed.companyMentions;

  if (!mentions || typeof mentions !== "object" || Array.isArray(mentions)) {
    throw new Error("DeepSeek response is missing companyMentions.");
  }

  if (typeof mentions.letter_slug !== "string" || !Array.isArray(mentions.companies)) {
    throw new Error("DeepSeek response has an invalid companyMentions payload.");
  }

  return {
    letterMarkdown: parsed.letterMarkdown.trim(),
    companyMentions: {
      letter_slug: mentions.letter_slug,
      companies: mentions.companies.map(normalizeCompanyMention),
    },
  };
}

export function buildCompanyIndex(mentionDocuments) {
  const bySlug = new Map();

  for (const document of mentionDocuments) {
    const letterSlug = document?.letter_slug;
    const companies = Array.isArray(document?.companies) ? document.companies : [];

    for (const company of companies.map(normalizeCompanyMention)) {
      const existing = bySlug.get(company.slug) ?? {
        slug: company.slug,
        name_en: company.name_en,
        name_zh: company.name_zh,
        letters: new Set(),
        mention_count: 0,
      };

      existing.letters.add(letterSlug);
      existing.mention_count += company.blocks.length;
      bySlug.set(company.slug, existing);
    }
  }

  return [...bySlug.values()]
    .map((entry) => ({
      slug: entry.slug,
      name_en: entry.name_en,
      name_zh: entry.name_zh,
      letters: [...entry.letters].sort(),
      mention_count: entry.mention_count,
    }))
    .sort((left, right) => {
      const leftKey = left.name_zh || left.name_en;
      const rightKey = right.name_zh || right.name_en;
      return leftKey.localeCompare(rightKey, "zh-Hans-CN-u-co-pinyin");
    });
}

export function filterEntriesByRequestedFile(entries, requestedFile) {
  if (!requestedFile) {
    return entries;
  }

  const normalizedRequest = requestedFile.trim();
  const matchedEntries = entries.filter((entry) => {
    const name = entry.name;
    return name === normalizedRequest || path.basename(name, path.extname(name)) === normalizedRequest;
  });

  if (matchedEntries.length === 0) {
    throw new Error(`Requested file not found: ${requestedFile}`);
  }

  return matchedEntries;
}

export function getExtractOptions(argv) {
  const fileFlagIndex = argv.indexOf("--file");
  const preserveLayout = !argv.includes("--no-layout");

  if (fileFlagIndex === -1) {
    return {
      file: "",
      preserveLayout,
    };
  }

  const requestedFile = argv[fileFlagIndex + 1];

  if (!requestedFile) {
    throw new Error("Missing value for --file.");
  }

  return {
    file: requestedFile,
    preserveLayout,
  };
}

export function getProcessOptions(argv) {
  const fileFlagIndex = argv.indexOf("--file");
  const requestedFile = fileFlagIndex === -1 ? "" : argv[fileFlagIndex + 1];

  if (fileFlagIndex !== -1 && !requestedFile) {
    throw new Error("Missing value for --file.");
  }

  return {
    file: requestedFile,
    force: argv.includes("--force"),
    layoutInput: argv.includes("--layout-input"),
  };
}

export function shouldSkipLetterProcessing({ force, letterExists, mentionsExist }) {
  if (force) {
    return false;
  }

  return letterExists && mentionsExist;
}

export function formatElapsed(milliseconds) {
  const totalSeconds = Math.max(1, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${totalSeconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function normalizeCompanyMention(company) {
  if (!company || typeof company !== "object") {
    throw new Error("Company mention must be an object.");
  }

  const slug = typeof company.slug === "string" && company.slug.trim()
    ? slugify(company.slug)
    : slugify(company.name_en ?? company.name_zh ?? "");

  const nameEn = typeof company.name_en === "string" ? company.name_en.trim() : "";
  const nameZh = typeof company.name_zh === "string" ? company.name_zh.trim() : "";

  if (!slug || !nameEn || !nameZh) {
    throw new Error("Company mention must include slug, name_en, and name_zh.");
  }

  const blocks = Array.isArray(company.blocks)
    ? [...new Set(company.blocks.filter((block) => typeof block === "string" && /^p\d+$/u.test(block.trim())).map((block) => block.trim()))]
    : [];

  return {
    slug,
    name_en: nameEn,
    name_zh: nameZh,
    blocks,
  };
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
