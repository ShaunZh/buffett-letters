---
name: companies-collection-design
description: Design for adding a companies content collection with detail pages for all companies mentioned in Buffett's letters
type: project
---

# Companies Content Collection Design

**Date:** 2026-05-07

## Overview

Add a `companies` Astro Content Collection to the buffett-letters site, providing a dedicated detail page for every company mentioned in Buffett's letters. Each company gets an independent page with article-style content (matching the existing Commonwealth Trust Co. file format).

## Requirements

- All companies from `src/data/companies/index.json` get a page
- Content is Chinese-first, with English name as reference
- Article-style layout (Markdown headings, paragraphs, tables) — consistent with existing company profile file
- Pages start with frontmatter only; body content added manually over time
- Company links in letter pages are a future task (manual or script-based)

## Architecture

### 1. Content Collection

Rename `src/content/companiese/` → `src/content/companies/` and register as an Astro Content Collection in `src/content.config.js`.

**Schema:**

```js
const companySchema = z.object({
  name_en: z.string(),
  name_zh: z.string(),
  industry: z.string().optional(),
  founded: z.string().optional(),
  headquarters: z.string().optional(),
  draft: z.boolean().default(false),
});
```

**Collection definition:**

```js
const companies = defineCollection({
  type: "content",
  schema: companySchema,
});

export const collections = {
  letters,
  "partner-letters": partnerLetters,
  "special-letters": specialLetters,
  companies,
};
```

### 2. Company MD Files

Each company gets a Markdown file at `src/content/companies/{slug}.md`.

**Initial state (generated from index.json):**

```markdown
---
name_en: "Berkshire Hathaway Inc."
name_zh: "伯克希尔·哈撒韦公司"
draft: false
---

（待补充）
```

**Full state (manually written later):**

```markdown
---
name_en: "Commonwealth Trust Co. of Union City, New Jersey"
name_zh: "新泽西州联合市联邦信托公司"
industry: "银行/信托"
draft: false
---

## 1. 公司基本情况

...detailed content...

## 2. 巴菲特的投资

...detailed content...
```

### 3. Page Route

Create `src/pages/companies/[slug].astro` with `getStaticPaths()`.

**Page structure:**

- Header: Chinese name (h1) + English name (subtitle)
- Meta row: industry, founded, headquarters (if present)
- Body: rendered Markdown content
- Back link: "← 返回首页"

### 4. Sidebar Navigation

Add a "公司" directory section in `BaseLayout.astro`, alongside the existing three letter directories.

- Collapsible `<details>` element
- Sorted by Chinese name (pinyin order)
- Shows company count

### 5. Generation Script

Create `scripts/generate-company-files.js` to batch-generate MD files from `src/data/companies/index.json`.

- Reads index.json
- Creates `src/content/companies/{slug}.md` for each entry
- Frontmatter populated from index data
- Body contains placeholder text "（待补充）"
- Skips files that already exist (to preserve manually-written content)

### 6. Existing File Migration

Move `src/content/companiese/新泽西州联合市联邦信托公司.md` → `src/content/companies/commonwealth-trust-co-union-city-new-jersey.md`.

- Add frontmatter to the existing file (it currently has none)
- Use the slug from index.json as filename
- Delete the `companiese` directory after migration

## File Changes Summary

| File | Action |
|------|--------|
| `src/content.config.js` | Add `companies` collection with `companySchema` |
| `src/content/companiese/` | Rename to `src/content/companies/`, migrate existing file |
| `src/pages/companies/[slug].astro` | New — company detail page |
| `src/layouts/BaseLayout.astro` | Add companies directory section to sidebar |
| `scripts/generate-company-files.js` | New — batch generate MD files from index.json |

## Out of Scope

- Linking company mentions in letter pages to company detail pages
- AI-generated company content
- Company list/index page (sidebar navigation is sufficient)
- Deduplication of company index (existing variant slugs kept as-is)