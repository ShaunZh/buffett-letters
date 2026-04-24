# 项目实现说明：30 分钟内做出一个中英对照信件网站 MVP

你是一个资深全栈工程师。请直接在当前项目中实现一个“中英对照长文阅读网站”的最小可运行版本，目标是在最短时间内完成、可本地运行、代码清晰、后续易扩展。

## 一、总体目标

实现一个内容型静态网站，支持：

1. 首页：列出所有信件
2. 详情页：展示单篇信件的中英对照内容
3. 标签页：按标签查看文章列表
4. 页面顶部支持 3 种阅读模式：
   - bilingual（中英对照）
   - en（仅英文）
   - zh（仅中文）

这是一个 MVP，不做复杂功能，不做数据库，不做 CMS，不做登录，不做搜索，不做 AI 问答，不做 PDF 自动导入。

重点是：
- 结构简单
- 跑得起来
- 内容源可直接用 Markdown + YAML front matter
- 后续容易扩展成概念页、公司页、人物页、双括号链接等

---

## 二、技术要求

请使用以下技术方案：

- Astro
- 本地 Markdown 内容文件
- YAML front matter 作为页面级元数据
- 最少依赖，尽量不额外引入复杂库
- 样式保持简洁、干净、可读、移动端友好

如果当前目录还没有项目，请直接初始化一个新的 Astro 项目并完成后续实现。

---

## 三、页面与路由

请实现以下页面：

### 1. 首页
路由：
- `/`

功能：
- 读取所有信件内容
- 按日期倒序展示
- 每个卡片展示：
  - 中文标题
  - 英文标题
  - 日期
  - tags
  - 摘要（如果有）
  - 进入详情页链接

### 2. 信件详情页
路由：
- `/letters/[slug]`

功能：
- 根据 slug 读取对应 Markdown 文件
- 渲染 front matter 中的元数据
- 渲染正文内容
- 页面顶部提供阅读模式切换：
  - bilingual
  - en
  - zh
- 将正文按 block 展示
- 每个 block 需要有 block id，例如：p1, p2, p3
- bilingual 模式：英文在上，中文在下
- en 模式：只显示英文
- zh 模式：只显示中文

### 3. 标签页
路由：
- `/tags/[tag]`

功能：
- 显示所有具有该 tag 的文章
- 文章卡片样式可与首页复用

---

## 四、内容组织方式

### 1. 内容目录
请使用如下目录：

- `src/content/letters/`

其中每篇文章一个 Markdown 文件，例如：

- `src/content/letters/2024-letter.md`

### 2. Front matter 规范
每篇文章的 front matter 至少支持这些字段：

- `title`
- `title_zh`
- `slug`
- `date`
- `type`
- `tags`
- `summary`
- `draft`

例如：

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
summary: 巴菲特 2024 年致股东信的中英对照演示稿。
draft: false
---
```

### 3. 正文格式
正文使用固定格式表示 block。请先支持如下格式：

```md
## p1

**EN**
To the Shareholders of Berkshire Hathaway Inc...

**ZH**
致伯克希尔·哈撒韦公司的股东：

## p2

**EN**
Berkshire has done better than I expected...

**ZH**
伯克希尔的表现比我预期得更好……
```

你需要在详情页中解析这种结构，把每个 `## pX` 识别为一个内容 block。

要求：
- block id = p1 / p2 / p3 ...
- block 内部包含 en 与 zh 两部分
- 页面渲染时以卡片形式显示每个 block

---

## 五、UI 要求

整体风格：
- 极简
- 内容优先
- 类似知识网站 / 长文阅读站
- 不要过度设计

请实现以下 UI 细节：

### 1. 全局布局
- 页面宽度适中，正文最大宽度不要太宽
- 顶部保留简单站点标题，例如：Learn Letters
- 页面有基础留白
- 字号、行高适合长文阅读

### 2. 首页卡片
- 每篇文章用卡片展示
- 显示中文标题优先，英文标题次级显示
- tags 显示为小标签
- 整体可点击进入详情页

### 3. 详情页 block 卡片
- 每个 block 独立边框卡片
- 卡片左上角显示 block id，例如 p1
- bilingual 模式：EN 区块在上，ZH 区块在下
- EN 和 ZH 之间有明显分隔
- en / zh 单语模式只显示对应内容
- 移动端可正常阅读

### 4. 阅读模式切换
- 详情页顶部放 3 个按钮：
  - Bilingual
  - English
  - 中文
- 点击后在前端切换显示，不需要服务端参与
- 默认是 bilingual

---

## 六、实现方式要求

### 1. 尽量使用 Astro 原生能力
优先使用 Astro 的内容读取和页面生成功能，不要引入不必要的复杂架构。

### 2. 正文 block 解析
详情页中请写一个清晰、可维护的解析函数，把 Markdown 正文按如下规则拆分：
- 遇到 `## pX` 视为新 block
- block 中的 `**EN**` 到 `**ZH**` 之间为英文
- `**ZH**` 之后到下一个 `## pX` 前为中文

请把解析逻辑封装清楚，不要写成难维护的杂糅代码。

### 3. 组件化
请至少拆出这些组件：
- `BaseLayout`
- `LetterCard`
- `LetterBlock`
- `ViewModeToggle`

如果你认为还需要一个辅助组件，可以自行添加。

### 4. 样式
可以用普通 CSS，也可以用一个简单的全局样式文件。
不要为了这个 MVP 引入复杂 UI 框架。

---

## 七、需要你创建的文件

请至少创建并实现以下文件（如果 Astro 默认结构不同，可做合理调整，但最终效果必须一致）：

- `src/layouts/BaseLayout.astro`
- `src/components/LetterCard.astro`
- `src/components/LetterBlock.astro`
- `src/components/ViewModeToggle.astro`
- `src/pages/index.astro`
- `src/pages/letters/[slug].astro`
- `src/pages/tags/[tag].astro`
- `src/content/letters/2024-letter.md`

如果需要额外的工具文件，也请自行补充，例如：
- `src/lib/parseLetterBlocks.ts`
- `src/styles/global.css`

---

## 八、示例内容文件

请创建这个示例内容文件：

文件路径：
- `src/content/letters/2024-letter.md`

内容如下：

```md
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
summary: 巴菲特 2024 年致股东信中英对照演示稿。
draft: false
---

## p1

**EN**
To the Shareholders of Berkshire Hathaway Inc.:

**ZH**
致伯克希尔·哈撒韦公司的股东：

## p2

**EN**
Berkshire has done better than I expected, though 53% of our 189 operating businesses reported a decline in earnings.

**ZH**
伯克希尔的表现比我预期得更好，不过我们 189 家运营企业中有 53% 的盈利出现了下滑。

## p3

**EN**
We own a small percentage of a dozen or so very large and highly profitable businesses with household names such as Apple, American Express, Coca-Cola, and Moody's.

**ZH**
我们持有十几家规模庞大、盈利能力极强且家喻户晓企业的一小部分股权，例如苹果、美国运通、可口可乐和穆迪。

## p4

**EN**
Over time, it takes just a few winners to work wonders.

**ZH**
从长期来看，只需要少数几个赢家，就足以创造惊人的成果。
```

---

## 九、实现细节建议

### 1. 首页
首页展示：
- 中文标题
- 英文标题
- 日期
- summary
- tags
- 链接到 `/letters/2024-letter`

### 2. 标签页
例如访问：
- `/tags/apple`

应能看到 2024 这篇文章。

### 3. 详情页
详情页结构建议：

- 顶部返回首页链接
- 标题区：
  - 中文标题
  - 英文标题
  - 日期
  - tags
- 阅读模式切换按钮
- 正文 block 列表

### 4. 无障碍与语义化
尽量使用合理的 HTML 结构，例如：
- `main`
- `article`
- `section`
- `nav`
- `header`

---

## 十、验收标准

完成后请确保：

1. `npm install` 可以成功
2. `npm run dev` 可以启动本地开发服务器
3. 首页能显示文章列表
4. 点击文章能进入详情页
5. 详情页能正确解析并显示 p1 ~ p4 四个 block
6. 阅读模式切换有效
7. 标签页可访问，例如 `/tags/apple`
8. 页面在桌面和移动端都可读
9. 代码结构清晰，不要把所有逻辑堆在一个文件里

---

## 十一、执行策略

请直接开始实现，不要先停下来问我一堆问题。

执行顺序建议：
1. 初始化 Astro 项目（如果当前目录为空）
2. 创建内容文件和基础布局
3. 实现首页
4. 实现详情页和 block 解析
5. 实现标签页
6. 添加基本样式
7. 运行并修复错误
8. 最后总结已实现内容和下一步建议

如果遇到小问题，请自行决定最合理的实现，不要因为小问题中断。

---

## 十二、完成后输出要求

完成后请告诉我：

1. 新建了哪些文件
2. 如何运行项目
3. 当前已实现哪些功能
4. 下一步最值得加的 3 个功能是什么

现在开始实现。
