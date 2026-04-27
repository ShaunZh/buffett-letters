const AI_SETTINGS_KEY = "buffett-ai-settings";

const PROVIDERS = {
  deepseek: {
    label: "DeepSeek",
    model: "deepseek-chat",
  },
  openai: {
    label: "OpenAI",
    model: "gpt-4o-mini",
  },
};

const DEFAULT_SYSTEM_PROMPT = `你是一名帮助用户理解沃伦·巴菲特致股东信的中文阅读助手。

你的核心任务是帮助用户理解巴菲特在具体文字中明确表达的意思、判断标准和投资原则，而不是替他发挥、拔高或套用标签。

用户会提供巴菲特致股东信中的英文或中文片段。你需要用简洁、准确、自然的中文说明这段话的含义。

回答要求：

- 默认用中文回答。
- 不要写成长篇文章。
- 不要把简单内容解释得很玄。
- 不要写鸡汤、口号或空泛赞美。
- 不要强行拔高到“人生智慧”。
- 不确定的背景事实要说明“不确定”或“需要查证”，不要编造。
- 可以补充必要背景，但必须简短。
- 重点放在“这段话明确说了什么”以及“这些话体现了什么直接可见的判断框架”。

翻译要求：

- 【翻译】部分必须先给出忠实、自然、符合中文表达习惯的译文。
- 不要逐词硬译，也不要保留英文句法。
- 先理解原文含义，再用自然、克制、准确的中文表达。
- 可以适当调整语序、拆分长句，但不得改变原文意思。
- 保留原文中的关键信息、判断、语气和逻辑关系。
- 对投资、保险、会计、企业经营、资本配置等术语，要使用中文财经语境中的自然说法。
- 遇到英文习惯表达、比喻或口语化表达，要转译成中文读者能自然理解的表达，不要直译。
- 重要英文术语或容易误解的表达，可以在中文后用括号保留英文原词。
- 翻译完成后自检一次：如果译文出现英文腔、生硬词组或不符合中文习惯的表达，请先润色后再输出。

解释边界：

- 必须区分三类内容：
  1. 原文明确表达的内容；
  2. 根据上下文可以合理推断的内容；
  3. 与巴菲特一贯思想相关、但原文没有直接说出的延伸理解。
- 不要把第 2 类和第 3 类内容写成巴菲特在这段话中明确说过的话。
- 避免过度使用“重仓”“极端机会”“市场恐慌”“持有现金”“护城河”“安全边际”“能力圈”“棒球击球”等巴菲特相关概念，除非原文或上下文确实涉及。
- 如果片段很短，只做短解释；不要为了完整格式而硬凑内容。

输出格式固定如下：

【翻译】
给出自然、准确、符合中文表达习惯的译文。不要逐词硬译，也不要添加原文没有的信息。

【原文在说什么】
用 1-2 句话说明这段话表面表达的意思，只写原文明确说出的内容。

【明确表达的原则】
用 1-3 条概括巴菲特在这段话中明确表达的判断或原则。
不要加入原文没有直接支持的概念。

【可合理推断】
只有当原文或用户提供的上下文足以支持时，才写 1-2 条克制推断。
不要引入原文没有出现的市场场景、投资动作或宏观判断。
如果证据不足，写“这段话本身没有提供足够信息，不展开推断”。

【容易误解的地方】
只指出最容易误译或误读的 1-3 点。
重点说明哪些说法是原文没有直接说的。
不要为了完整格式而硬凑。

【现实启发】
仅用 1-2 句话说明对现实决策的启发。
必须紧贴原文，不要扩展到“人生智慧”、宏大哲学或泛泛鸡汤。`

const DEFAULT_USER_PROMPT_TEMPLATE = [
  "请基于以下原文回答问题:",
  "1. 严格按照系统设定的输出格式回答；",
  "2.【翻译】必须自然、准确、符合中文表达习惯，避免机器翻译腔；",
  "3.【原文在说什么】和【明确表达的原则】只能写原文直接支持的内容；",
  "4.【可合理推断】只能写从这段话本身或紧邻上下文能推出的内容；不要引入“市场恐慌”、“危机”、“重仓”、“大举投资”、“持有现金”、“普通投资者”等原文没有出现的概念；",
  "5.【现实启发】必须紧贴原文，不要给泛化投资建议‘",
  "6. 如果证据不足，就写“不展开推断’",
  "7. 保持简洁。",
  "原文：{{sourceText}}",
  "问题：{{question}}",
].join("\n");

function trimValue(value = "") {
  return String(value).trim();
}

export function createDefaultAiSettings() {
  return {
    provider: "deepseek",
    deepseekKey: "",
    openaiKey: "",
    promptMode: "default",
    systemPrompt: "",
    userPromptTemplate: "",
  };
}

export function parseAiSettings(rawValue) {
  if (!rawValue) {
    return createDefaultAiSettings();
  }

  try {
    const parsed = JSON.parse(rawValue);
    const provider = parsed.provider === "openai" ? "openai" : "deepseek";

    return {
      provider,
      deepseekKey: trimValue(parsed.deepseekKey),
      openaiKey: trimValue(parsed.openaiKey),
      promptMode: parsed.promptMode === "custom" ? "custom" : "default",
      systemPrompt: trimValue(parsed.systemPrompt),
      userPromptTemplate: trimValue(parsed.userPromptTemplate),
    };
  } catch {
    return createDefaultAiSettings();
  }
}

export function serializeAiSettings(settings) {
  return JSON.stringify({
    provider: settings.provider === "openai" ? "openai" : "deepseek",
    deepseekKey: trimValue(settings.deepseekKey),
    openaiKey: trimValue(settings.openaiKey),
    promptMode: settings.promptMode === "custom" ? "custom" : "default",
    systemPrompt: trimValue(settings.systemPrompt),
    userPromptTemplate: trimValue(settings.userPromptTemplate),
  });
}

export function getActiveProvider(settings) {
  if (settings.provider === "openai" && settings.openaiKey) {
    return "openai";
  }

  if (settings.provider === "deepseek" && settings.deepseekKey) {
    return "deepseek";
  }

  if (settings.deepseekKey) {
    return "deepseek";
  }

  if (settings.openaiKey) {
    return "openai";
  }

  return null;
}

export function hasAiKey(settings) {
  return Boolean(getActiveProvider(settings));
}

function renderPromptTemplate(template, { sourceText, question }) {
  return template
    .replaceAll("{{sourceText}}", trimValue(sourceText))
    .replaceAll("{{question}}", trimValue(question) || "解释一下");
}

function getUserPromptTemplate(settings) {
  if (settings?.promptMode === "custom" && trimValue(settings.userPromptTemplate).includes("{{sourceText}}")) {
    return trimValue(settings.userPromptTemplate);
  }

  return DEFAULT_USER_PROMPT_TEMPLATE;
}

function getSystemPrompt(settings) {
  if (settings?.promptMode === "custom") {
    return trimValue(settings.systemPrompt);
  }

  return DEFAULT_SYSTEM_PROMPT;
}

export function buildExplainPrompt({ sourceText, question, settings, extraInstruction = "" }) {
  const prompt = renderPromptTemplate(getUserPromptTemplate(settings), { sourceText, question });
  const trimmedExtraInstruction = trimValue(extraInstruction);

  if (!trimmedExtraInstruction) {
    return prompt;
  }

  return [prompt, "", "本次额外要求：", trimmedExtraInstruction].join("\n");
}

function readOpenAIText(data) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n")
      .trim() ?? ""
  );
}

async function requestOpenAI({ key, settings, sourceText, question, extraInstruction, fetcher = fetch }) {
  const systemPrompt = getSystemPrompt(settings);
  const body = {
    model: PROVIDERS.openai.model,
    input: buildExplainPrompt({ sourceText, question, settings, extraInstruction }),
    temperature: 0.2,
  };

  if (systemPrompt) {
    body.instructions = systemPrompt;
  }

  const response = await fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI 请求失败");
  }

  return readOpenAIText(data) || "没有收到可展示的解释。";
}

async function requestDeepSeek({ key, settings, sourceText, question, extraInstruction, fetcher = fetch }) {
  const systemPrompt = getSystemPrompt(settings);
  const messages = [
    {
      role: "user",
      content: buildExplainPrompt({ sourceText, question, settings, extraInstruction }),
    },
  ];

  if (systemPrompt) {
    messages.unshift({
      role: "system",
      content: systemPrompt,
    });
  }

  const response = await fetcher("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: PROVIDERS.deepseek.model,
      messages,
      temperature: 0.2,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "DeepSeek 请求失败");
  }

  return data.choices?.[0]?.message?.content?.trim() || "没有收到可展示的解释。";
}

export async function requestAiExplanation({ settings, sourceText, question, extraInstruction = "", fetcher = fetch }) {
  const provider = getActiveProvider(settings);

  if (provider === "openai") {
    return requestOpenAI({
      key: settings.openaiKey,
      settings,
      sourceText,
      question,
      extraInstruction,
      fetcher,
    });
  }

  if (provider === "deepseek") {
    return requestDeepSeek({
      key: settings.deepseekKey,
      settings,
      sourceText,
      question,
      extraInstruction,
      fetcher,
    });
  }

  throw new Error("请先配置 AI Key");
}

export { AI_SETTINGS_KEY, DEFAULT_SYSTEM_PROMPT, DEFAULT_USER_PROMPT_TEMPLATE, PROVIDERS };
