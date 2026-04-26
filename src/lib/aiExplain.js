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

const SYSTEM_PROMPT = `你是一名帮助用户理解沃伦·巴菲特致股东信的中文阅读助手。

你的核心任务不是翻译润色，而是帮助用户理解巴菲特在文字背后的思想、判断标准、商业哲学和投资原则。

用户会提供巴菲特致股东信中的英文或中文片段。你需要用简洁、准确、自然的中文说明：

1. 这段话表面上在说什么；
2. 巴菲特真正想强调的原则是什么；
3. 这反映了他的哪些投资、经营或人生哲学；
4. 普通读者容易误解的地方是什么；
5. 这段话对现实决策有什么启发。

回答要求：

- 默认用中文回答。
- 不要写成长篇文章。
- 不要逐字逐句翻译，除非用户明确要求。
- 不要过度关注遣词造句和翻译风格。
- 不要把简单内容解释得很玄。
- 不要写鸡汤、口号或空泛赞美。
- 不要强行拔高到“人生智慧”。
- 不确定的背景事实要说明“不确定”或“需要查证”，不要编造。
- 可以补充必要背景，但必须简短。
- 重点放在“他为什么这么说”以及“这体现了什么判断框架”。

输出格式固定如下：

【一句话概括】
用一句话说明这段话的核心意思。

【他真正想说的】
用 2-4 条说明巴菲特真正强调的原则或判断。

【背后的思想】
说明这段话体现的投资哲学、管理哲学或商业观念。

【容易误解的地方】
指出这段话中最容易被误读、过度解读或翻译错的地方。

【现实启发】
用简短几句话说明这段话对投资、管理或个人决策的启发。

如果用户提供的片段较短，回答也要短；不要为了完整格式而硬凑内容。。
`


function trimValue(value = "") {
  return String(value).trim();
}

export function createDefaultAiSettings() {
  return {
    provider: "deepseek",
    deepseekKey: "",
    openaiKey: "",
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

export function buildExplainPrompt({ sourceText, question }) {
  return [
    "请基于用户选中的原文回答问题。",
    "要求：使用中文；先解释核心含义，再补充必要背景；如果原文是英文，请顺手解释关键表达；保持简洁。",
    "",
    `原文：${trimValue(sourceText)}`,
    `问题：${trimValue(question) || "解释一下"}`,
  ].join("\n");
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

async function requestOpenAI({ key, sourceText, question, fetcher = fetch }) {
  const response = await fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: PROVIDERS.openai.model,
      input: buildExplainPrompt({ sourceText, question }),
      temperature: 0.2,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI 请求失败");
  }

  return readOpenAIText(data) || "没有收到可展示的解释。";
}

async function requestDeepSeek({ key, sourceText, question, fetcher = fetch }) {
  const response = await fetcher("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: PROVIDERS.deepseek.model,
      messages: [
        {
          role: "system",
          // content: "你是一个帮助读者理解巴菲特股东信的中文阅读助手。",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: buildExplainPrompt({ sourceText, question }),
        },
      ],
      temperature: 0.2,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "DeepSeek 请求失败");
  }

  return data.choices?.[0]?.message?.content?.trim() || "没有收到可展示的解释。";
}

export async function requestAiExplanation({ settings, sourceText, question, fetcher = fetch }) {
  const provider = getActiveProvider(settings);

  if (provider === "openai") {
    return requestOpenAI({
      key: settings.openaiKey,
      sourceText,
      question,
      fetcher,
    });
  }

  if (provider === "deepseek") {
    return requestDeepSeek({
      key: settings.deepseekKey,
      sourceText,
      question,
      fetcher,
    });
  }

  throw new Error("请先配置 AI Key");
}

export { AI_SETTINGS_KEY, PROVIDERS };
