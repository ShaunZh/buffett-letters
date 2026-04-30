import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const cssPath = new URL("../src/styles/global.css", import.meta.url);

test("selection menu hidden children stay hidden despite component display rules", () => {
  const css = readFileSync(cssPath, "utf8");

  assert.match(css, /\.selection-editor\[hidden\]/);
  assert.match(css, /\.selection-menu__actions\[hidden\]/);
  assert.match(css, /\.selection-viewer\[hidden\]/);
});

test("rich tables allow header wrapping and content-driven width", () => {
  const css = readFileSync(cssPath, "utf8");

  assert.match(css, /\.rich-table table\s*\{[\s\S]*width:\s*max-content;/);
  assert.match(css, /\.rich-table table\s*\{[\s\S]*min-width:\s*100%;/);
  assert.match(css, /\.rich-table th\s*\{[\s\S]*white-space:\s*normal;/);
});
