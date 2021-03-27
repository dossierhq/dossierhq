#!/usr/bin/env node
/* eslint-env node */
import fs from 'fs/promises';
import svgToDataUri from 'mini-svg-data-uri';
import path from 'path';
import { optimize } from 'svgo';

const config = {
  inputDir: new URL('../icons/export/', import.meta.url).pathname,
  iconsCssPath: new URL('../src/icons.css', import.meta.url).pathname,
};

async function loadIcons() {
  const result = [];
  const files = await fs.readdir(config.inputDir);

  for (const file of files) {
    if (!file.endsWith('.svg')) {
      continue;
    }
    const name = path.basename(file, '.svg');
    const svg = await fs.readFile(path.join(config.inputDir, file), { encoding: 'utf8' });
    result.push({ name, svg });
  }
  return result;
}

function optimizeSvg(svg) {
  return optimize(svg).data;
}

async function writeToCss(icons) {
  let result = '';
  for (const { name, svg } of icons) {
    const optimizedSvg = optimizeSvg(svg);
    console.log(`> ${name} ${optimizedSvg.length}b (original ${svg.length}b)`);
    if (result) result += '\n';
    result += `.dd.icon-${name} {\n`;
    result += `  background-image: url("${svgToDataUri(optimizedSvg)}");\n`;
    result += '}\n';
  }
  await fs.writeFile(config.iconsCssPath, result, 'utf8');
}

async function main() {
  const icons = await loadIcons();
  await writeToCss(icons);
}

main().catch((error) => {
  console.warn(error);
  process.exitCode = 1;
});
