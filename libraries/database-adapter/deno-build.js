#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

async function buildTypescript(basePath) {
  const files = await findFilesRecursive(basePath, (filename) => filename.endsWith('.js'));
  for (const outputJsFile of files) {
    let contents = await fs.readFile(outputJsFile, { encoding: 'utf-8' });
    const basename = path.basename(outputJsFile);
    contents = `/// <reference types="./${basename.slice(0, -3)}.d.ts" />\n${contents}`;
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

buildTypescript('lib/esm');
