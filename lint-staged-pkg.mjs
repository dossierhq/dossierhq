#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const [cwdRel, ...files] = process.argv.slice(2);
if (!cwdRel || files.length === 0) {
  console.error("usage: lint-staged-pkg.mjs <cwd-rel-dir> <file...>");
  process.exit(2);
}

const cwd = path.resolve(process.cwd(), cwdRel);

const ESLINT_EXT = /\.(ts|tsx|js|jsx|cjs|mjs)$/;
const PRETTIER_EXT = /\.(ts|tsx|js|jsx|cjs|mjs|json|md|ya?ml|css)$/;

const hasEslintConfig = ["js", "mjs", "cjs", "ts"].some((ext) =>
  existsSync(path.join(cwd, `eslint.config.${ext}`)),
);
const eslintFiles = hasEslintConfig
  ? files.filter((f) => ESLINT_EXT.test(f))
  : [];
const prettierFiles = files.filter((f) => PRETTIER_EXT.test(f));

function run(bin, args) {
  const result = spawnSync(bin, args, { cwd, stdio: "inherit" });
  return result.status ?? 1;
}

if (eslintFiles.length > 0) {
  const code = run("pnpm", [
    "exec",
    "eslint",
    "--fix",
    "--max-warnings=0",
    "--no-warn-ignored",
    ...eslintFiles,
  ]);
  if (code !== 0) process.exit(code);
}

if (prettierFiles.length > 0) {
  // Resolve the root-installed prettier explicitly rather than relying on
  // `pnpm exec` walking up from each workspace (prettier is only a root
  // devDep).
  const require = createRequire(import.meta.url);
  const prettierBin = require.resolve("prettier/bin/prettier.cjs");
  const code = run(process.execPath, [
    prettierBin,
    "--write",
    ...prettierFiles,
  ]);
  if (code !== 0) process.exit(code);
}
