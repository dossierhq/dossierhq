import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = import.meta.dirname;

const WORKSPACE_DIRS = (() => {
  const yaml = readFileSync(path.join(ROOT, "pnpm-workspace.yaml"), "utf8");
  const topDirs = [];
  for (const line of yaml.split("\n")) {
    const m = line.match(/^\s*-\s*"([^"/]+)\/\*"\s*$/);
    if (m) topDirs.push(m[1]);
  }
  const dirs = [];
  for (const top of topDirs) {
    const topAbs = path.join(ROOT, top);
    let entries;
    try {
      entries = readdirSync(topAbs, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const pkgAbs = path.join(topAbs, entry.name);
      if (existsSync(path.join(pkgAbs, "package.json"))) dirs.push(pkgAbs);
    }
  }
  return dirs.sort((a, b) => b.length - a.length);
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
