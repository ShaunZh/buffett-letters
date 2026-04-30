import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("package scripts expose a split command for full or single-file letter block normalization", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

  assert.equal(
    packageJson.scripts["letters:split-blocks"],
    "node scripts/split-letter-blocks.js",
  );
});
