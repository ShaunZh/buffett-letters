const COLLINS_URL = "/dicts/collins.json";
const WORDFORMS_URL = "/dicts/wordforms.json";

let collinsPromise;
let wordformsPromise;

function normalizeWord(text = "") {
  return String(text).trim().toLowerCase().replace(/^[^a-z]+|[^a-z-]+$/g, "");
}

async function loadJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("词库加载失败。");
  }

  return response.json();
}

function loadCollins() {
  collinsPromise ??= loadJson(COLLINS_URL);
  return collinsPromise;
}

function loadWordforms() {
  wordformsPromise ??= loadJson(WORDFORMS_URL);
  return wordformsPromise;
}

function buildCandidates(word, wordforms) {
  const list = [word];
  const stem = wordforms[word];
  if (stem) {
    list.push(stem);
  }
  return [...new Set(list.filter(Boolean))];
}

function highlightTerm(text, term) {
  if (!text) {
    return "";
  }

  const pattern = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(pattern, "gi"), (match) => `<mark>${match}</mark>`);
}

function mapCollinsEntry(word, result) {
  const definitions = (result.defs ?? []).map((item) => ({
    pos: item.pos_en || "",
    posCn: item.pos_cn || "",
    meaning: item.def_cn || "",
    gloss: highlightTerm(item.def_en || "", word),
    examples: (item.ext ?? []).map((example) => ({
      en: highlightTerm(example.ext_en || "", word),
      zh: example.ext_cn || "",
    })),
  }));

  return {
    expression: word,
    reading: result.readings?.[0] ? `/${result.readings[0]}/` : "",
    star: result.star || "",
    audios: [
      {
        label: "UK",
        url: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`,
      },
      {
        label: "US",
        url: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`,
      },
    ],
    definitions,
  };
}

export async function lookupWordTranslation(text) {
  const normalized = normalizeWord(text);

  if (!normalized || /\s/.test(normalized) || !/^[a-z-]+$/.test(normalized)) {
    return { ok: false, reason: "当前仅支持英文单词查询。" };
  }

  try {
    const [collins, wordforms] = await Promise.all([loadCollins(), loadWordforms()]);

    for (const candidate of buildCandidates(normalized, wordforms)) {
      const result = collins[candidate];

      if (result?.defs?.length) {
        return { ok: true, entry: mapCollinsEntry(candidate, result) };
      }
    }

    return { ok: false, reason: "词库中暂无该词。" };
  } catch (error) {
    return { ok: false, reason: error.message || "词库加载失败。" };
  }
}
