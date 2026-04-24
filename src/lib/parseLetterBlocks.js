export function parseLetterBlocks(markdown = "") {
  const sections = markdown.split(/^##\s+(p\d+)\s*$/gm).slice(1);
  const blocks = [];

  for (let index = 0; index < sections.length; index += 2) {
    const id = sections[index]?.trim();
    const content = sections[index + 1] ?? "";
    const match = content.match(/\*\*EN\*\*\s*([\s\S]*?)\s*\*\*ZH\*\*\s*([\s\S]*?)\s*$/);

    if (!id || !match) {
      continue;
    }

    const en = match[1].trim();
    const zh = match[2].trim();

    if (!en || !zh) {
      continue;
    }

    blocks.push({ id, en, zh });
  }

  return blocks;
}
