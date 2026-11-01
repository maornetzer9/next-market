import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hookUrl = new URL("./darkMode.js", import.meta.url);

test("V22 Theme dispatch occurs outside the React state updater", async () => {
  const source = await readFile(hookUrl, "utf8");

  assert.doesNotMatch(source, /setDarkMode\(prevState\s*=>\s*\{[^}]*dispatchEvent/s);
  assert.match(source, /setDarkMode\(newState\);[\s\S]*dispatchEvent\(new Event\('darkModeChanged'\)\)/);
});
