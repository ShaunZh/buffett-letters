function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    // .replaceAll("'", "&#39;");
}

function renderInline(markdown = "") {
  let html = escapeHtml(markdown.trim());

  html = html.replace(
    /\$\(\d[\d,]*(?:\.\d+)?\)|\(\d[\d,]*(?:\.\d+)?\)|-\$?\d[\d,]*(?:\.\d+)?|\$\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?%?/g,
    (match) => {
      const classes = ["rich-number"];

      if (match.includes("$")) {
        classes.push("rich-number--currency");
      }

      if (match.startsWith("-") || match.startsWith("(") || match.startsWith("$(")) {
        classes.push("rich-number--negative");
      } else {
        classes.push("rich-number--positive");
      }

      if (/^\d{4}$/.test(match)) {
        classes.push("rich-number--year");
      }

      return `<span class="${classes.join(" ")}">${match}</span>`;
    },
  );

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  return html;
}

function splitTableRow(row = "") {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line = "") {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isTableBlock(lines = []) {
  return lines.length >= 2 && lines[0].includes("|") && isTableSeparator(lines[1]);
}

function renderTable(lines = []) {
  const [headerRow, , ...bodyRows] = lines;
  const headers = splitTableRow(headerRow);
  const rows = bodyRows
    .filter((row) => row.trim())
    .map((row) => splitTableRow(row));

  const thead = `<thead><tr>${headers.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;

  return `<div class="rich-table"><table>${thead}${tbody}</table></div>`;
}

function renderList(lines = []) {
  const ordered = /^\d+\.\s+/.test(lines[0] ?? "");
  const tag = ordered ? "ol" : "ul";
  const items = lines
    .map((line) => line.replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ""))
    .map((item) => `<li>${renderInline(item)}</li>`)
    .join("");

  return `<${tag}>${items}</${tag}>`;
}

function renderCodeBlock(lines = []) {
  // Remove the opening and closing ``` lines
  const content = lines.slice(1, -1).join("\n");
  return `<pre><code>${escapeHtml(content)}</code></pre>`;
}

function renderParagraph(lines = []) {
  return `<p>${lines.map((line) => renderInline(line)).join("<br />")}</p>`;
}

function isBlockquoteBlock(lines = []) {
  return lines.length > 0 && lines.every((line) => line.trim().startsWith(">"));
}

function renderBlockquote(lines = []) {
  const content = lines
    .map((line) => line.replace(/^>\s?/, ""))
    .filter((line) => line.trim())
    .map((line) => renderInline(line))
    .join("<br />");
  return `<blockquote>${content}</blockquote>`;
}

function renderHeading(line = "") {
  const match = line.match(/^(#{1,6})\s+(.*)$/);

  if (!match) {
    return renderParagraph([line]);
  }

  const level = match[1].length;
  return `<h${level}>${renderInline(match[2])}</h${level}>`;
}

function collectBlocks(markdown = "") {
  const lines = markdown.trim().split("\n");
  const blocks = [];
  let current = [];
  let inCodeBlock = false;

  function flushCurrent() {
    if (current.length > 0) {
      blocks.push(current);
      current = [];
    }
  }

  for (const line of lines) {
    // Check for code block markers
    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        // Starting a code block
        flushCurrent();
        inCodeBlock = true;
        current.push(line);
      } else {
        // Ending a code block
        current.push(line);
        blocks.push(current);
        current = [];
        inCodeBlock = false;
      }
      continue;
    }

    // If inside code block, just add the line
    if (inCodeBlock) {
      current.push(line);
      continue;
    }

    if (!line.trim()) {
      flushCurrent();
      continue;
    }

    if (current.length === 0) {
      current.push(line);
      continue;
    }

    const currentLooksLikeTable = current[0].includes("|") || isTableSeparator(current[0]);
    const nextLooksLikeTable = line.includes("|");
    const currentLooksLikeList = /^[-*]\s+|^\d+\.\s+/.test(current[0]);
    const nextLooksLikeList = /^[-*]\s+|^\d+\.\s+/.test(line);

    if ((currentLooksLikeTable && nextLooksLikeTable) || (currentLooksLikeList && nextLooksLikeList)) {
      current.push(line);
      continue;
    }

    if (/^(#{1,6})\s+/.test(line) || /^(#{1,6})\s+/.test(current[0])) {
      flushCurrent();
      current.push(line);
      continue;
    }

    current.push(line);
  }

  flushCurrent();
  return blocks;
}

export function renderRichText(markdown = "") {
  const normalized = markdown.trim();

  if (!normalized) {
    return "";
  }

  return collectBlocks(normalized)
    .map((block) => {
      // Check for code block
      if (block[0]?.startsWith("```") && block[block.length - 1]?.startsWith("```")) {
        return renderCodeBlock(block);
      }

      if (block.length === 1 && /^(#{1,6})\s+/.test(block[0])) {
        return renderHeading(block[0]);
      }

      if (isBlockquoteBlock(block)) {
        return renderBlockquote(block);
      }

      if (isTableBlock(block)) {
        return renderTable(block);
      }

      if (/^[-*]\s+|^\d+\.\s+/.test(block[0])) {
        return renderList(block);
      }

      return renderParagraph(block);
    })
    .join("");
}
