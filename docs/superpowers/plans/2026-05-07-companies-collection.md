# Companies Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `companies` Astro Content Collection with detail pages for every company mentioned in Buffett's letters.

**Architecture:** Register a new `companies` collection in Astro's content config, batch-generate MD files from the existing `index.json`, create a dynamic route page, and add a sidebar directory section. The existing `companiese` directory is migrated into the new `companies` collection.

**Tech Stack:** Astro v5 Content Collections, Zod schema, Node.js script for batch generation

---

### Task 1: Register companies collection in content config

**Files:**
- Modify: `src/content.config.js`

- [ ] **Step 1: Add companySchema and companies collection to content.config.js**

Replace the entire file content:

```js
import { defineCollection, z } from "astro:content";

const letterSchema = z.object({
  title: z.string(),
  title_zh: z.string(),
  date: z.coerce.date(),
  type: z.string(),
  tags: z.array(z.string()),
  summary: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  pdfPath: z.string().optional(),
  draft: z.boolean().default(false),
});

const companySchema = z.object({
  name_en: z.string(),
  name_zh: z.string(),
  industry: z.string().optional(),
  founded: z.string().optional(),
  headquarters: z.string().optional(),
  draft: z.boolean().default(false),
});

function defineLetterCollection() {
  return defineCollection({
    type: "content",
    schema: letterSchema,
  });
}

const letters = defineLetterCollection();
const partnerLetters = defineLetterCollection();
const specialLetters = defineLetterCollection();
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

- [ ] **Step 2: Commit**

```bash
git add src/content.config.js
git commit -m "feat: add companies content collection schema"
```

---

### Task 2: Migrate existing company file

**Files:**
- Delete: `src/content/companiese/新泽西州联合市联邦信托公司.md`
- Create: `src/content/companies/commonwealth-trust-co-union-city-new-jersey.md`

- [ ] **Step 1: Create companies directory and the migrated file with frontmatter**

Create `src/content/companies/commonwealth-trust-co-union-city-new-jersey.md` with frontmatter added to the existing content:

```markdown
---
name_en: "Commonwealth Trust Co. of Union City, New Jersey"
name_zh: "新泽西州联合市联邦信托公司"
industry: "银行/信托"
draft: false
---

## 1. 公司基本情况

**Commonwealth Trust Co. of Union City, New Jersey**，可译为"新泽西州联合市联邦信托公司"，是一家地方性银行/信托公司。1957 年新泽西州最高法院案件《Union City Housing Authority v. Commonwealth Trust Co.》中，案名和正文称其为 **Commonwealth Trust Company, a banking corporation of New Jersey**，也就是新泽西州的银行公司；该案还显示，1950 年联合市住房管理局曾在 Commonwealth Trust Company 开设支票账户，说明它至少从事普通商业银行存款与支付业务。([Justia Law][1])

在巴菲特信中，它的规模约为 **总资产 5,000 万美元**，巴菲特拿它与奥马哈的 First National 作比较，称其资产规模大约是后者的一半。对于 1950 年代的地方银行来说，这不是微型银行，但也远不是大银行，更像是区域性、社区型银行。([Ivey Business School][2])

它的股票非常不活跃：巴菲特说公司大约只有 **300 名股东**，平均每月可能只有 **两笔交易**。这意味着它不是纽约证券交易所那种高流动性股票，而是典型的"冷门、小盘、场外/地方性"股票。([Ivey Business School][2])

## 2. 巴菲特为什么会买它

这是巴菲特早期"烟蒂型价值投资 + 潜在催化剂"的典型案例。他在 1958 年信中把它放在 **Typical Situation** 章节，用来说明自己当时的投资方法。1957 年，他已经提到各合伙企业最大持仓占资产的 10%—20%；1958 年他披露，这只最大持仓就是 Commonwealth Trust。([Ivey Business School][2])

核心买入逻辑有四层。

第一，**价格远低于保守估算的内在价值**。巴菲特称，他开始买入时，保守估计每股内在价值约 **125 美元**，但股票价格约 **50 美元**。这相当于按内在价值的约 40% 买入，折价非常大。([Ivey Business School][2])

第二，**公司盈利能力不差，但市场不喜欢它不分红**。巴菲特说公司每股收益约 **10 美元**，但"出于正当理由"没有支付现金股息，这在当时导致股价低迷。换句话说，市场把"不分红"当作坏消息，巴菲特则更关注公司是否在真实积累价值。([Ivey Business School][2])

第三，**管理良好、下行风险小**。巴菲特明确评价它是一家"管理良好、具有实质盈利能力"的银行，而且管理层对他们这些新股东友好；他还说最终发生亏损的风险看起来很小。([Ivey Business School][2])

第四，**存在价值释放催化剂：潜在并购**。Commonwealth 有 **25.5% 股份由一家更大的银行持有**，这家大银行多年来希望与 Commonwealth 合并；合并因"个人原因"受阻，但巴菲特认为有迹象表明这种阻碍不会无限期持续。([Ivey Business School][2])

所以，这不是单纯"便宜就买"。它同时具备：

| 维度   | 巴菲特看到的情况                  |
| ---- | ------------------------- |
| 估值   | 约 50 美元买入，对比保守内在价值 125 美元 |
| 质量   | 银行业务稳定，盈利能力强，管理良好         |
| 安全边际 | 价格低、银行资产真实、亏损概率低          |
| 催化剂  | 大股东长期希望合并，未来可能释放价值        |
| 可积累性 | 股价冷清时可以继续慢慢买入             |

## 3. 巴菲特的持仓规模与买入方式

巴菲特用了约一年时间，最终买到 Commonwealth Trust 约 **12% 股权**，平均成本约 **51 美元/股**。由于公司股东少、交易稀少，他不能快速买入，只能耐心积累。([Ivey Business School][2])

这点非常重要：巴菲特当时不是在做"看图交易"，而是在做"流动性换收益"。他希望股价不要涨，甚至希望它下跌或保持平稳，因为这样可以继续以低价买入更多股份。1958 年大牛市中，这类冷门股短期可能拖累相对表现，但长期能提供更大的安全边际。([Ivey Business School][2])

买到 12% 后，巴菲特成为 **第二大股东**，并拥有足够的投票权，使他在任何潜在合并提议中都值得被咨询。这也是一个关键点：他不是只买几股等市场发现，而是买到足以影响局势的位置。([Ivey Business School][2])

## 4. 投资收益：约 57% 的已实现收益

巴菲特的平均买入价约 **51 美元/股**，后来以约 **80 美元/股**卖出。

粗略收益率为：

\frac{80-51}{51} \approx 56.9%

也就是大约 **57% 的资本收益**，不含税费等因素。由于公司不派现金股息，这笔收益主要来自价格上涨和大宗交易溢价，而不是分红。巴菲特还特别提到，当时市场报价比 80 美元低约 20%，但他卖出整块持股时取得了 80 美元价格。([Ivey Business School][2])

这里有一个很有意思的细节：他并不是因为 Commonwealth 已经"完全到达内在价值"才卖。巴菲特说，80 美元价格对应约 **135 美元内在价值**，买家长期看仍可能做得不错；但 80 对 135 的折价，已经不如 50 对 125 那么诱人。([Ivey Business School][2])

也就是说，这笔交易的卖出逻辑不是"它贵了"，而是"有更好的资本配置机会"。

## 5. 最终持有情况：1958 年末卖出整块 Commonwealth，转向更好的特殊情况

1958 年末，巴菲特发现了另一个特殊情况，可以用有吸引力的价格成为第一大股东，于是卖出了 Commonwealth Trust 的整块持仓，价格约 80 美元/股。1958 年信没有直接说这个新投资的名字，但 1960 年信回顾时披露，1958 年开始的大型新投资是 **Sanborn Map**；巴菲特及其关联方后来持有 Sanborn 约 24,000 股，并成为推动资产价值释放的重要股东。([Ivey Business School][2]) ([Ivey Business School][2])

因此，**巴菲特对 Commonwealth Trust 的最终持有情况是：1958 年末已卖出，不再持有该块股份**。他卖出后仍认为买家"多年后应当做得不错"，但他判断合伙企业的资金放到替代机会中更划算。([Ivey Business School][2])

## 6. 这笔投资体现的巴菲特早期风格

Commonwealth Trust 不是后来那种"买伟大公司长期持有"的典型案例，而更接近格雷厄姆式、早期巴菲特式投资：

**低估 + 安全边际 + 冷门流动性 + 潜在催化剂 + 集中持仓。**

它体现了几个非常早期的巴菲特特征。

第一，**他愿意买无聊、冷门、无人关注的资产**。300 名股东、每月两笔交易，对多数投资者来说流动性太差；但对资金规模还小的巴菲特来说，这正是优势来源。([Ivey Business School][2])

第二，**他关注价值实现路径**。Commonwealth 不只是便宜，还有潜在并购方；买到 12% 后，他从普通小股东变成需要被咨询的重要股东。([Ivey Business School][2])

第三，**他不迷恋账面浮盈，而是比较机会成本**。80 美元卖出时，公司仍低于他估计的 135 美元内在价值；但新的特殊情况更有吸引力，所以他换仓。([Ivey Business School][2])

第四，**他强调保密和耐心**。因为这种股票流动性极低，小额买盘就能把价格从 50 多美元推到 65 美元；巴菲特因此强调投资组合信息不能泄露。([Ivey Business School][2])

## 7. 一句话总结

Commonwealth Trust Co. of Union City 是巴菲特 1958 年披露的早期代表性投资：他以约 51 美元均价买入一家保守内在价值约 125 美元、每股盈利约 10 美元、管理良好但不分红而被冷落的地方银行，最终持有约 12% 并成为第二大股东；1958 年末因发现更好的特殊情况，以约 80 美元卖出整块持股，实现约 57% 的资本收益，并把资金转向后来更著名的 Sanborn Map。

[1]: https://law.justia.com/cases/new-jersey/supreme-court/1957/25-n-j-330-0.html "                Union City Housing Authority v. Commonwealth Trust Co. :: 1957 :: Supreme Court of New Jersey Decisions :: New Jersey Case Law :: New Jersey Law :: U.S. Law :: Justia    "
[2]: https://www.ivey.uwo.ca/media/2975913/buffett-partnership-letters.pdf "WARREN E"
```

- [ ] **Step 2: Delete the old companiese directory**

```bash
rm -rf src/content/companiese
```

- [ ] **Step 3: Commit**

```bash
git add src/content/companies/commonwealth-trust-co-union-city-new-jersey.md
git rm -r src/content/companiese
git commit -m "feat: migrate companiese to companies collection with frontmatter"
```

---

### Task 3: Create company detail page route

**Files:**
- Create: `src/pages/companies/[slug].astro`

- [ ] **Step 1: Create the company detail page**

Create `src/pages/companies/[slug].astro`:

```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";

export async function getStaticPaths() {
  const entries = await getCollection("companies", ({ data }) => !data.draft);
  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();
---

<BaseLayout title={`${entry.data.name_zh} | 巴菲特的信`}>
  <article class="company-detail">
    <a class="back-link" href="/">← 返回首页</a>

    <header class="company-detail__header">
      <h1 class="company-detail__title">{entry.data.name_zh}</h1>
      <p class="company-detail__subtitle">{entry.data.name_en}</p>
      {(entry.data.industry || entry.data.founded || entry.data.headquarters) && (
        <div class="company-detail__meta">
          {entry.data.industry && <span class="company-detail__meta-item">行业：{entry.data.industry}</span>}
          {entry.data.founded && <span class="company-detail__meta-item">成立：{entry.data.founded}</span>}
          {entry.data.headquarters && <span class="company-detail__meta-item">总部：{entry.data.headquarters}</span>}
        </div>
      )}
    </header>

    <section class="company-detail__content">
      <Content />
    </section>
  </article>
</BaseLayout>
```

- [ ] **Step 2: Add company detail page styles to global.css**

Add the following styles at the end of `src/styles/global.css`:

```css
/* ── Company detail page ── */

.company-detail__header {
  border-bottom: 2px solid var(--accent-soft);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.company-detail__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
  margin: 0;
}

.company-detail__subtitle {
  font-size: 0.95rem;
  color: #666;
  margin: 0.25rem 0 0;
}

.company-detail__meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #888;
}

.company-detail__meta-item {
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.company-detail__content {
  line-height: 1.7;
}

.company-detail__content h2 {
  font-size: 1.2rem;
  color: var(--accent);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.company-detail__content p {
  margin-bottom: 1rem;
}

.company-detail__content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.company-detail__content th,
.company-detail__content td {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.company-detail__content th {
  background: #f8f9fa;
  font-weight: 600;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/companies/[slug].astro src/styles/global.css
git commit -m "feat: add company detail page route and styles"
```

---

### Task 4: Add companies sidebar navigation

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Add companies collection and nav entries to BaseLayout.astro**

In the frontmatter section (after line 17), add:

```astro
const companyEntries = await getCollection("companies", ({ data }) => !data.draft);
const companyNavEntries = companyEntries
  .sort((a, b) => a.data.name_zh.localeCompare(b.data.name_zh, "zh-CN"))
  .map((entry) => ({
    href: `/companies/${entry.slug}/`,
    label: entry.data.name_zh,
    slug: entry.slug,
  }));
const isCompanyNavActive = companyNavEntries.some((entry) => entry.href === currentPath);
```

- [ ] **Step 2: Add companies directory section to sidebar HTML**

After the special-letters `<details>` block (after line 112), add:

```astro
<details class="site-directory" open={isCompanyNavActive}>
  <summary class="site-directory__heading">
    <span class="site-directory__heading-main">
      <span class="site-directory__caret" aria-hidden="true">▾</span>
      <span class="site-directory__title">公司</span>
    </span>
    <span>{companyNavEntries.length}</span>
  </summary>

  <div class="site-directory__list">
    {companyNavEntries.map((entry) => (
      <a class:list={["site-directory__item", currentPath === entry.href && "is-active"]} href={entry.href}>
        <span class="site-directory__label">{entry.label}</span>
      </a>
    ))}
  </div>
</details>
```

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: add companies directory section to sidebar"
```

---

### Task 5: Create generation script

**Files:**
- Create: `scripts/generate-company-files.js`

- [ ] **Step 1: Create the batch generation script**

Create `scripts/generate-company-files.js`:

```js
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const indexJsonPath = join(projectRoot, "src", "data", "companies", "index.json");
const companiesDir = join(projectRoot, "src", "content", "companies");

if (!existsSync(companiesDir)) {
  mkdirSync(companiesDir, { recursive: true });
}

const companies = JSON.parse(readFileSync(indexJsonPath, "utf-8"));

for (const company of companies) {
  const filePath = join(companiesDir, `${company.slug}.md`);

  if (existsSync(filePath)) {
    console.log(`Skipping existing file: ${company.slug}.md`);
    continue;
  }

  const frontmatter = [
    `name_en: "${company.name_en}"`,
    `name_zh: "${company.name_zh}"`,
    `draft: false`,
  ].join("\n");

  const content = `---\n${frontmatter}\n---\n\n（待补充）\n`;

  writeFileSync(filePath, content, "utf-8");
  console.log(`Created: ${company.slug}.md`);
}

console.log(`\nDone. ${companies.length} companies processed.`);
```

- [ ] **Step 2: Add npm script to package.json**

Add to the `scripts` section of `package.json`:

```json
"letters:generate-companies": "node scripts/generate-company-files.js"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-company-files.js package.json
git commit -m "feat: add company files generation script"
```

---

### Task 6: Run generation script and verify build

- [ ] **Step 1: Run the generation script**

```bash
node scripts/generate-company-files.js
```

Expected: Output listing all created/skipped company MD files. The Commonwealth Trust file should be skipped since it already exists from Task 2.

- [ ] **Step 2: Verify Astro build succeeds**

```bash
npm run build
```

Expected: Build completes without errors. All company pages are generated.

- [ ] **Step 3: Commit generated company files**

```bash
git add src/content/companies/
git commit -m "feat: generate company MD files from index.json"
```

---

## Self-Review

**Spec coverage:**
- Content collection registration → Task 1 ✓
- Company MD files (initial state) → Task 5 + Task 6 ✓
- Company MD files (full state, migration) → Task 2 ✓
- Page route → Task 3 ✓
- Sidebar navigation → Task 4 ✓
- Generation script → Task 5 ✓
- Existing file migration → Task 2 ✓

**Placeholder scan:** No TBD/TODO found. All code is complete.

**Type consistency:** `companySchema` fields (`name_en`, `name_zh`, `industry`, `founded`, `headquarters`, `draft`) match the frontmatter in Task 2 and the page template in Task 3. The `slug` field comes from Astro's content collection automatically (filename-based). The `companyNavEntries` structure matches the existing `shareholderNavEntries` pattern.