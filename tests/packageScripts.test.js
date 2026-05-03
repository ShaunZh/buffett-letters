import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("package scripts load .env for DeepSeek processing", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

  assert.match(packageJson.scripts["letters:process"], /--env-file=\.env/u);
  assert.equal(
    packageJson.scripts["letters:process-partners"],
    "node --env-file=.env scripts/process-limited-partners-with-deepseek.js",
  );
});
