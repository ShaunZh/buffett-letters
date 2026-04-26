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
