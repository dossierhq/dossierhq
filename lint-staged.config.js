import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = import.meta.dirname;

const WORKSPACE_DIRS = (() => {
  const result = spawnSync("pnpm", ["ls", "-r", "--depth", "-1", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `Failed to list pnpm workspace packages: ${result.stderr || result.stdout}`,
    );
  }
  return JSON.parse(result.stdout)
    .map((pkg) => pkg.path)
    .filter((p) => p !== ROOT)
    .sort((a, b) => b.length - a.length);
})();

function findOwningPackage(absFile) {
  for (const dir of WORKSPACE_DIRS) {
    if (absFile === dir || absFile.startsWith(dir + path.sep)) return dir;
  }
  return null;
}

function quote(value) {
  if (/[\0-\x1f"\\]/.test(value)) {
    throw new Error(`Unsafe character in staged path: ${value}`);
  }
  return `"${value}"`;
}

const RELEVANT_EXT = /\.(ts|tsx|js|jsx|cjs|mjs|json|md|ya?ml|css)$/;

export default function (stagedAbsFiles) {
  const relevant = stagedAbsFiles.filter((f) => RELEVANT_EXT.test(f));
  if (relevant.length === 0) return [];

  const byCwd = new Map();
  for (const abs of relevant) {
    const cwd = findOwningPackage(abs) ?? ROOT;
    if (!byCwd.has(cwd)) byCwd.set(cwd, []);
    byCwd.get(cwd).push(abs);
  }

  const commands = [];
  for (const [cwd, files] of byCwd) {
    const rel = cwd === ROOT ? "." : path.relative(ROOT, cwd);
    const args = [quote(rel), ...files.map(quote)].join(" ");
    commands.push(`node lint-staged-pkg.mjs ${args}`);
  }
  return commands;
}
