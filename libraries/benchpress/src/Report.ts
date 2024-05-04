import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFile, NoSuchCommand } from './compat/ChildProcessUtils.js';
import { processResults, type BenchPressProcessedResult } from './Process.js';
import type { BenchPressResult } from './Runner.js';
import { ms_to_hz } from './Units.js';

export interface BenchPressReportOptions {
  percentiles: number[];
  folder: string;
  baseName: string;
  tsvFilename: string;
}

export async function reportResult(
  result: BenchPressResult,
  options: BenchPressReportOptions,
): Promise<void> {
  const processed = processResults(result, options);

  reportResultConsole(processed);
  console.log();

  await fs.promises.mkdir(options.folder, { recursive: true });

  await reportResultTsv(processed, options);
  await reportResultJson(processed, options);
  await reportResultGnuPlot(processed, options);
  console.log('Done.');
}

function reportResultConsole(processed: BenchPressProcessedResult) {
  console.log();
  console.log(
    `Number of successful iterations: ${processed.successCount} / ${processed.iterationCount}`,
  );
  console.log(`Number of failed iterations: ${processed.failureCount}`);
  console.log(`Duration of successful iterations: ${processed.successDuration_ms.toFixed(2)} ms`);
  console.log();

  function logMetric(name: string, duration_ms: number | null, suffix?: string) {
    if (duration_ms === null) {
      console.log(`${name}: – ${suffix ? ' ' + suffix : ''}`);
    } else {
      console.log(
        `${name}: ${duration_ms.toFixed(2)} ms (${ms_to_hz(duration_ms).toFixed(2)} ops/s)${
          suffix ? ' ' + suffix : ''
        }`,
      );
    }
  }

  logMetric(
    'Avg iteration',
    processed.mean_ms,
    `(std dev: ${processed.standardDeviation_ms.toFixed(2)} ms)`,
  );
  logMetric('Min iteration', processed.min_ms);
  for (const [percentile, duration_ms] of Object.entries(processed.percentiles_ms)) {
    logMetric(`Percentile ${percentile}`, duration_ms);
  }
  logMetric('Max iteration', processed.max_ms);
}

async function reportResultTsv(
  processed: BenchPressProcessedResult,
  options: BenchPressReportOptions,
) {
  const header =
    [
      'Test name',
      'Variant',
      'Run name',
      'Base name',
      'Avg',
      'StdDev',
      'Min',
      ...Object.keys(processed.percentiles_ms).map((x) => `p${x}`),
      'Max',
    ].join('\t') + '\n';
  const row =
    [
      processed.testName,
      processed.variant,
      processed.runName,
      options.baseName,
      processed.mean_ms,
      processed.standardDeviation_ms.toFixed(2),
      processed.min_ms,
      ...Object.values(processed.percentiles_ms),
      processed.max_ms,
    ].join('\t') + '\n';

  const tsvPath = path.join(options.folder, options.tsvFilename);
  console.log(`Writing to ${tsvPath}`);
  try {
    const existingData = await fs.promises.readFile(tsvPath, 'utf8');
    if (!existingData.startsWith(header)) {
      throw new Error(
        `Existing file (${tsvPath}) doesn't start with the expected header: ${header}`,
      );
    }
    await fs.promises.writeFile(tsvPath, `${existingData}${row}`);
  } catch (error) {
    if (!isNoSuchFileError(error)) {
      throw error;
    }
    await fs.promises.writeFile(tsvPath, `${header}${row}`);
  }
}

async function reportResultJson(
  processed: BenchPressProcessedResult,
  options: BenchPressReportOptions,
) {
  const percentileData: Record<string, number | null> = {};
  for (const [percentile, duration_ms] of Object.entries(processed.percentiles_ms)) {
    percentileData[`percentile_${percentile}`] = duration_ms;
  }

  const data = {
    name: processed.testName,
    variant: processed.variant,
    unit: 'ms',
    iterationCount: processed.iterationCount,
    successCount: processed.successCount,
    failureCount: processed.failureCount,
    successDuration: processed.successDuration_ms,
    standardDeviation: processed.standardDeviation_ms,
    mean: processed.mean_ms,
    min: processed.min_ms,
    ...percentileData,
    max: processed.max_ms,
  };

  const jsonPath = path.join(options.folder, `${options.baseName}.json`);
  console.log(`Writing to ${jsonPath}`);
  await fs.promises.writeFile(jsonPath, JSON.stringify(data, null, 2) + '\n');
}

async function reportResultGnuPlot(
  processed: BenchPressProcessedResult,
  options: BenchPressReportOptions,
) {
  const gnuPlotScriptPath = path.join(options.folder, `${options.baseName}.gnu`);
  const gnuPlotDataPath = path.join(options.folder, `${options.baseName}.dat`);
  const gnuPlotPngPath = path.join(options.folder, `${options.baseName}.png`);

  let mainGnuPlotScript = `set key outside

set xlabel 'Iteration'
set ylabel 'Duration (ms)'
set yrange [0:]

plot '${path.basename(gnuPlotDataPath)}' title '${processed.testName}'`;

  if (processed.mean_ms !== null) {
    mainGnuPlotScript += `,\\\n  ${processed.mean_ms} title 'avg'`;
  }
  if (processed.max_ms !== null) {
    mainGnuPlotScript += `,\\\n  ${processed.max_ms} title 'max'`;
  }
  Object.entries(processed.percentiles_ms)
    .filter(([_p, v_ms]) => v_ms !== null)
    .reverse()
    .forEach(([p, v_ms]) => (mainGnuPlotScript += `,\\\n  ${v_ms} dashtype 3 title 'p${p}'`));

  if (processed.min_ms !== null) {
    mainGnuPlotScript += `,\\\n  ${processed.min_ms} title 'min'`;
  }

  const pngGnuPlotScript = `# gnuplot script
set term pngcairo dashed font 'Avenir Next Condensed Regular' fontscale 0.8 size 1024,768
set output '${path.basename(gnuPlotPngPath)}'
  ${mainGnuPlotScript}`;

  const gnuPlotData = processed.iterations_ms.map((it) => it ?? 'NaN').join('\n');

  const containsSomeDataPoint = processed.iterations_ms.some((it) => it !== null);
  if (!containsSomeDataPoint) {
    console.log('Skipping gnuplot report since it lacks data points');
    return;
  }

  console.log(`Writing to ${gnuPlotScriptPath}`);
  await fs.promises.writeFile(gnuPlotScriptPath, pngGnuPlotScript);
  console.log(`Writing to ${gnuPlotDataPath}`);
  await fs.promises.writeFile(gnuPlotDataPath, gnuPlotData);

  const output = execFile('gnuplot', [path.basename(gnuPlotScriptPath)], {
    cwd: options.folder,
  });
  if (output === NoSuchCommand) {
    console.log('No gnuplot installed');
  } else {
    console.log(`Executing gnuplot (generating ${gnuPlotPngPath})`);
    // Log after execution since we want to check if gnuplot exists first

    reportResultGnuPlotDumb(processed, options, gnuPlotDataPath);
  }
}

function reportResultGnuPlotDumb(
  processed: BenchPressProcessedResult,
  options: BenchPressReportOptions,
  gnuPlotDataPath: string,
) {
  const dumbGnuPlotScript = `set term dumb size 120, 30 ansirgb nofeed
set key horizontal outside bottom center

set xlabel 'Iteration'
set ylabel 'Duration (ms)'
set yrange [0:]

plot ${processed.max_ms} with points pt '-' title 'max',\
  ${processed.mean_ms} with points pt '-' title 'avg',\
  ${processed.min_ms} with points pt '-' title 'min',\
  '${path.basename(gnuPlotDataPath)}' with points pt '*' title '${processed.testName}'`;

  const output = execFile('gnuplot', [], {
    cwd: options.folder,
    input: dumbGnuPlotScript,
  });
  if (output === NoSuchCommand) {
    console.log('No gnuplot installed');
  } else {
    console.log(output.toString());
  }
}

function isNoSuchFileError(error: unknown) {
  return (error as { code?: string })?.code === 'ENOENT';
}
