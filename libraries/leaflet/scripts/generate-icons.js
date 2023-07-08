#!/usr/bin/env node
/* eslint-env node */
import fs from 'fs/promises';
import svgToDataUri from 'mini-svg-data-uri';
import path from 'path';
import prettier from 'prettier';
import { optimize } from 'svgo';

const config = {
  inputDir: new URL('../icons/export/', import.meta.url).pathname,
  iconsCssPath: new URL('../src/icons.css', import.meta.url).pathname,
  iconsTypescriptPath: new URL('../src/icons.ts', import.meta.url).pathname,
  classNamePrefix: 'icon-',
};

async function loadIcons() {
  const result = [];

  async function loadDirectory(directory, toExport) {
    try {
      const stat = await fs.stat(directory, { throwIfNoEntry: false });
      if (!stat.isDirectory()) return;
    } catch {
      return;
    }
    const files = await fs.readdir(directory);

    for (const file of files) {
      if (!file.endsWith('.svg')) {
        continue;
      }
      const name = path.basename(file, '.svg');
      const svg = await fs.readFile(path.join(directory, file), { encoding: 'utf8' });
      result.push({ name, svg, ...toExport });
    }
  }

  await loadDirectory(config.inputDir, { toCss: true, toTypescript: true });
  await loadDirectory(path.join(config.inputDir, 'css'), { toCss: true, toTypescript: false });
  await loadDirectory(path.join(config.inputDir, 'typescript'), {
    toCss: false,
    toTypescript: true,
  });

  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

function optimizeIcons(icons) {
  for (const icon of icons) {
    const { name, svg } = icon;
    const optimizedSvg = optimize(svg).data;
    console.log(`> ${name} ${optimizedSvg.length}b (original ${svg.length}b)`);
    icon.optimizedSvg = optimizedSvg;
  }
}

async function writeToCss(icons) {
  let result = '';
  for (const { name, optimizedSvg, toCss } of icons) {
    if (!toCss) continue;
    if (result) result += '\n';
    result += `.${config.classNamePrefix}${name} {\n`;
    result += `  background-image: url("${svgToDataUri(optimizedSvg)}");\n`;
    result += '}\n';
  }
  console.log(`Writing CSS to ${config.iconsCssPath}`);
  await fs.writeFile(config.iconsCssPath, result, 'utf8');
}

async function writeToTypescript(icons) {
  let result = 'export default {\n';
  let iconCount = 0;
  for (const { name, optimizedSvg, toTypescript } of icons) {
    if (!toTypescript) continue;
    result += `  '${name}': '${optimizedSvg}',\n`;
    iconCount += 1;
  }
  result += '};\n';

  if (iconCount === 0) {
    return;
  }

  const prettierConfig = await prettier.resolveConfig(config.iconsTypescriptPath);
  result = await prettier.format(result, {
    ...prettierConfig,
    filepath: config.iconsTypescriptPath,
  });

  console.log(`Writing Typescript to ${config.iconsTypescriptPath}`);
  await fs.writeFile(config.iconsTypescriptPath, result, 'utf8');
}

async function main() {
  const icons = await loadIcons();
  optimizeIcons(icons);
  await writeToCss(icons);
  await writeToTypescript(icons);
}

main().catch((error) => {
  console.warn(error);
  process.exitCode = 1;
});
