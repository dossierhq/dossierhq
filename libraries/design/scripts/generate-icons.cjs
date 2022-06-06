#!/usr/bin/env node
/* eslint-env node */
const solidSvgIcons = require('@fortawesome/free-solid-svg-icons');
const fs = require('fs/promises');
const svgToDataUri = require('mini-svg-data-uri');
const { optimize } = require('svgo');

const config = {
  iconsCssPath: 'src/styles/icons.scss',
  classNamePrefix: 'icon-',
};

const iconSources = {
  add: solidSvgIcons.faPlusSquare,
  chevronDown: solidSvgIcons.faChevronDown,
  chevronUp: solidSvgIcons.faChevronUp,
  close: solidSvgIcons.faXmark,
  download: solidSvgIcons.faDownload,
  first: solidSvgIcons.faFastBackward,
  last: solidSvgIcons.faFastForward,
  list: solidSvgIcons.faThList,
  location: solidSvgIcons.faLocationPin,
  map: solidSvgIcons.faMapMarkedAlt,
  next: solidSvgIcons.faStepForward,
  orderAsc: solidSvgIcons.faSortDown,
  orderDesc: solidSvgIcons.faSortUp,
  ordered: solidSvgIcons.faArrowDownShortWide,
  previous: solidSvgIcons.faStepBackward,
  search: solidSvgIcons.faSearch,
  shuffle: solidSvgIcons.faShuffle,
  upload: solidSvgIcons.faUpload,
};

function loadIcons() {
  const result = [];
  for (const [name, iconSource] of Object.entries(iconSources)) {
    const [width, height, _ligatures, _unicode, svgPathData] = iconSource.icon;
    // TODO use fixed color for now. Background SVG images don't pickup the currentColor. In order to support different colors we need to apply css filter or css mask
    result.push({
      name,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><path fill="#4a4a4a" d="${svgPathData}"/></svg>`,
    });
  }
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
  for (const { name, optimizedSvg } of icons) {
    if (result) result += '\n';
    result += `.${config.classNamePrefix}${name} {\n`;
    result += `  background-image: url("${svgToDataUri(optimizedSvg)}");\n`;
    result += '}\n';
  }
  console.log(`Writing CSS to ${config.iconsCssPath}`);
  await fs.writeFile(config.iconsCssPath, result, 'utf8');
}

async function main() {
  const icons = loadIcons();
  optimizeIcons(icons);
  await writeToCss(icons);
}

main().catch((error) => {
  console.warn(error);
  process.exitCode = 1;
});
