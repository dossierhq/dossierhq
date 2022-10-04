#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

async function addTripleSlashTypeDirectiveForDeno(basePath) {
  const files = await findFilesRecursive(basePath, (filename) =>
    filename.endsWith(".js")
  );
  for (const outputJsFile of files) {
    let contents = await fs.readFile(outputJsFile, { encoding: "utf-8" });
    const basename = path.basename(outputJsFile);
    contents = `/// <reference types="./${basename.slice(
      0,
      -3
    )}.d.ts" />\n${contents}`;
    await fs.writeFile(outputJsFile, contents);
  }
}

async function findFilesRecursive(directory, filter) {
  const entries = (await fs.readdir(directory)).map((f) => `${directory}/${f}`);
  const result = entries.filter(filter);
  for (const entry of entries) {
    const stat = await fs.stat(entry);
    if (stat.isDirectory()) {
      result.push(...(await findFilesRecursive(entry, filter)));
    }
  }
  return result;
}

async function addCommonJsPackageJson(basePath) {
  const packageJson = `{
  "type": "commonjs"
}
`;
  await fs.writeFile(path.join(basePath, "package.json"), packageJson, {
    encoding: "utf-8",
  });
}

async function addEsmJsPackageJson(basePath) {
  const packageJson = `{
  "type": "module"
}
`;
  await fs.writeFile(path.join(basePath, "package.json"), packageJson, {
    encoding: "utf-8",
  });
}

async function main(args) {
  for (const arg of args) {
    switch (arg) {
      case "deno":
        await addTripleSlashTypeDirectiveForDeno("lib/esm");
        break;
      case "deno-esm-only":
        await addTripleSlashTypeDirectiveForDeno("lib");
        break;
      case "cjs-package-json":
        await addCommonJsPackageJson("lib/cjs");
        break;
      case "esm-package-json":
        await addEsmJsPackageJson("lib/esm");
        break;
      default:
        throw new Error(`Invalid command (${arg})`);
    }
  }
}

await main(process.argv.slice(2));
