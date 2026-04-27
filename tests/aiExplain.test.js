import test from "node:test";
import assert from "node:assert/strict";

import {
  buildExplainPrompt,
  getActiveProvider,
  hasAiKey,
  parseAiSettings,
  requestAiExplanation,
  serializeAiSettings,
} from "../src/lib/aiExplain.js";

test("parseAiSettings falls back to an empty DeepSeek setup", () => {
  assert.deepEqual(parseAiSettings("not json"), {
    provider: "deepseek",
    deepseekKey: "",
    openaiKey: "",
    promptMode: "default",
    systemPrompt: "",
    userPromptTemplate: "",
  });
});

test("serializeAiSettings trims keys and getActiveProvider chooses a configured key", () => {
  const settings = parseAiSettings(
    serializeAiSettings({
      provider: "openai",
      deepseekKey: "",
      openaiKey: "  sk-test  ",
    }),
  );

  assert.equal(settings.openaiKey, "sk-test");
  assert.equal(settings.promptMode, "default");
  assert.equal(hasAiKey(settings), true);
  assert.equal(getActiveProvider(settings), "openai");
});

test("buildExplainPrompt includes selected text and the user question", () => {
  const prompt = buildExplainPrompt({
    sourceText: "Berkshire keeps ample cash.",
    question: "为什么重要？",
  });

  assert.match(prompt, /Berkshire keeps ample cash\./);
  assert.match(prompt, /为什么重要？/);
});

test("buildExplainPrompt renders a custom template and one-off instruction", () => {
  const prompt = buildExplainPrompt({
    sourceText: "Berkshire keeps ample cash.",
    question: "为什么重要？",
    settings: {
      promptMode: "custom",
      userPromptTemplate: "原文={{sourceText}}\n问题={{question}}",
    },
    extraInstruction: "请更短一点。",
  });

  assert.equal(
    prompt,
    [
      "原文=Berkshire keeps ample cash.",
      "问题=为什么重要？",
      "",
      "本次额外要求：",
      "请更短一点。",
    ].join("\n"),
  );
});

test("buildExplainPrompt falls back to the default template when custom template omits source text", () => {
  const prompt = buildExplainPrompt({
    sourceText: "Berkshire keeps ample cash.",
    question: "为什么重要？",
    settings: {
      promptMode: "custom",
      userPromptTemplate: "问题={{question}}",
    },
  });

  assert.match(prompt, /请基于以下原文回答问题:/);
  assert.match(prompt, /原文：Berkshire keeps ample cash\./);
});

test("requestAiExplanation calls OpenAI Responses API for OpenAI settings", async () => {
  const calls = [];
  const answer = await requestAiExplanation({
    settings: {
      provider: "openai",
      openaiKey: "sk-openai",
      deepseekKey: "",
    },
    sourceText: "Float matters.",
    question: "解释一下",
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        async json() {
          return { output_text: "这是解释。" };
        },
      };
    },
  });

  assert.equal(answer, "这是解释。");
  assert.equal(calls[0].url, "https://api.openai.com/v1/responses");
  assert.equal(calls[0].options.headers.Authorization, "Bearer sk-openai");
});

test("requestAiExplanation calls DeepSeek chat completions for DeepSeek settings", async () => {
  const calls = [];
  const answer = await requestAiExplanation({
    settings: {
      provider: "deepseek",
      openaiKey: "",
      deepseekKey: "sk-deepseek",
    },
    sourceText: "Insurance float is valuable.",
    question: "解释一下",
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        async json() {
          return { choices: [{ message: { content: "这是 DeepSeek 解释。" } }] };
        },
      };
    },
  });

  assert.equal(answer, "这是 DeepSeek 解释。");
  assert.equal(calls[0].url, "https://api.deepseek.com/chat/completions");
  assert.equal(calls[0].options.headers.Authorization, "Bearer sk-deepseek");
});

test("requestAiExplanation sends custom system prompt and one-off instruction to DeepSeek", async () => {
  const calls = [];
  await requestAiExplanation({
    settings: {
      provider: "deepseek",
      openaiKey: "",
      deepseekKey: "sk-deepseek",
      promptMode: "custom",
      systemPrompt: "只用一句话回答。",
      userPromptTemplate: "原文：{{sourceText}}\n问题：{{question}}",
    },
    sourceText: "Insurance float is valuable.",
    question: "为什么？",
    extraInstruction: "不要分标题。",
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        async json() {
          return { choices: [{ message: { content: "解释。" } }] };
        },
      };
    },
  });

  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.messages[0].role, "system");
  assert.equal(body.messages[0].content, "只用一句话回答。");
  assert.match(body.messages[1].content, /原文：Insurance float is valuable\./);
  assert.match(body.messages[1].content, /本次额外要求：\n不要分标题。/);
});
