# Codex 信件处理 Prompt 模板

你现在在一个内容网站项目中工作。请把我提供的原始 md 格式巴菲特信件，处理成一个可直接用于网站展示的标准化内容文件。

## 目标

将原始信件整理为一个发布文件，放到：

- `src/content/letters/`

输出文件格式为 Markdown 或 MDX，要求包含：

1. YAML front matter
2. 按 block 拆分的正文
3. 中英对照内容
4. 可直接被网站详情页读取和渲染

---

## 输入文件

原始文件路径：
`[在这里替换成你的原始 md 文件路径]`

请先读取该文件内容，再开始处理。

---

## 输出要求

请生成一个新的内容文件，文件路径为：

- `src/content/letters/[slug].md`

其中 `[slug]` 请根据标题和年份生成，例如：
- `2024-letter`
- `1965-letter`

如果项目中已有同名文件，请覆盖更新，并保留结构一致性。

---

## Front matter 规范

请在文件顶部生成 YAML front matter，至少包含以下字段：

- `title`: 英文标题
- `title_zh`: 中文标题
- `slug`: 页面 slug
- `date`: 信件日期，格式 `YYYY-MM-DD`，如果只能确定年份可尽量补足合理日期；若无法确定，请保留最可信信息
- `type`: 固定写为 `shareholder-letter`
- `tags`: 标签数组
- `summary`: 1 句中文摘要
- `draft`: 布尔值，默认 `false`

示例格式：

```yaml
---
title: 2024 Letter to Shareholders
title_zh: 2024 年致股东信
slug: 2024-letter
date: 2024-02-24
type: shareholder-letter
tags:
  - berkshire
  - shareholders
  - apple
summary: 巴菲特 2024 年致股东信中英对照整理稿。
draft: false
---
```

---

## 正文整理规则

请把正文整理为固定 block 结构。

每个 block 使用以下格式：

```md
## p1

**EN**
English paragraph here.

**ZH**
Chinese translation here.
```

要求：

1. 按自然段拆分，不要整篇只做成一个大块
2. block id 按顺序编号：`p1`, `p2`, `p3` ...
3. 每个 block 都必须同时包含：
   - `**EN**`
   - `**ZH**`
4. 英文部分保留原意和原文语气
5. 中文部分翻译自然、准确，尽量保留巴菲特的语气和行文风格
6. 不要省略重要数字、公司名、年份、人物名
7. 遇到非常短、明显依附前文的残句，可合理合并到前一个 block
8. 遇到列表、标题、小节标题时，可单独成 block
9. 不要输出额外解释，不要加入“译者注”之类内容，除非原文确有必要说明且非常简短

---

## 标签与内容提取要求

请基于信件内容，自动补充合理的 `tags`。

标签优先从这些维度选择：
- 年份相关
- 伯克希尔 / 合伙人时期
- 涉及的重点公司
- 核心投资主题

例如可能出现：
- `berkshire`
- `partnership`
- `shareholders`
- `apple`
- `coca-cola`
- `insurance`
- `capital-allocation`
- `intrinsic-value`

请控制数量，通常 3 到 8 个即可，不要泛滥。

---

## 翻译要求

翻译时遵循以下原则：

1. 准确优先，不要过度润色
2. 保留投资语境
3. 保留巴菲特偏口语但清晰的表达风格
4. 公司名、人名、投资术语尽量统一
5. 遇到金额、百分比、年份、倍数时务必准确
6. 不要把比喻误译为字面事实
7. 不确定时优先忠实表达，不要擅自延展

常见术语可参考以下翻法：
- Berkshire Hathaway → 伯克希尔·哈撒韦
- intrinsic value → 内在价值
- capital allocation → 资本配置
- float → 浮存金
- shareholder → 股东
- moat → 护城河
- owner earnings → 所有者收益

请在整篇中保持术语一致。

---

## 内容清洗要求

在处理原始 md 时，请自动清理这些内容：

- 多余的一级标题重复
- 无关说明文字
- 多余空行
- 格式混乱的分隔符
- 与正文无关的页脚信息
- 明显不是正文的噪音

但不要删除真正属于信件正文的标题、小节标题、列表、数字和引用。

---

## 文件质量要求

完成后请自查：

1. front matter 是否完整
2. slug 是否合理
3. block 编号是否连续
4. 每个 block 是否都有 EN 和 ZH
5. 中文是否遗漏数字或专有名词
6. 文件是否可以直接被内容站读取
7. Markdown 结构是否干净稳定

---

## 输出方式

请直接在项目中创建或更新目标文件，不要只在聊天里展示结果。

完成后请告诉我：

1. 生成的文件路径
2. 文章总共拆成多少个 block
3. 你自动生成了哪些 tags
4. 你发现了哪些需要我人工复核的地方（如果有）

现在开始执行。

---

## 极速版

读取 `content/raw/buffett-2024-letter.md`，把它整理成可发布的信件内容文件，输出到 `src/content/letters/2024-letter.md`。

要求：
1. 生成完整 YAML front matter：
   - title
   - title_zh
   - slug
   - date
   - type=shareholder-letter
   - tags
   - summary
   - draft=false
2. 正文按段落拆成 block，格式固定为：

## p1

**EN**
...

**ZH**
...

3. 翻译成自然、准确、保留巴菲特语气的中文
4. 保持公司名、人名、数字、术语准确
5. 自动清洗原始 md 里的噪音
6. 处理完成后直接写入项目文件，不要只展示在聊天里
7. 最后告诉我：
   - 输出文件路径
   - block 数量
   - tags
   - 需要人工复核的点
