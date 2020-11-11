import childProcess from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

export interface BenchPressClock {
  start: () => void;
  stop: () => void;
}

export interface BenchPressOptions {
  testName: string;
  runName: string;
  warmup: number;
  iterations: number;
}

export interface BenchPressResult {
  testName: string;
  runName: string;
  iterationDurations_ns: Array<bigint | null>;
  iterationCount: number;
}

export interface BenchPressReportOptions {
  percentiles: number[];
  folder: string;
  baseName: string;
  tsvFilename: string;
}

interface BenchPressProcessedResult {
  testName: string;
  runName: string;
  iterationCount: number;
  successCount: number;
  failureCount: number;
  successDuration_ms: number;
  standardDeviation_ms: number;
  mean_ms: number;
  min_ms: number;
  max_ms: number;
  percentiles_ms: Record<string, number>;
  iterations_ms: Array<number | null>;
}

export function delay(delay_ms: number) {
  return new Promise((resolve) => setTimeout(resolve, delay_ms));
}

function createClock() {
  let startTime: bigint | null = null;
  let duration: bigint | null = null;

  return {
    clock: {
      start: () => {
        if (startTime !== null) {
          throw new Error('Called start() twice in a row');
        } else {
          startTime = process.hrtime.bigint();
        }
      },
      stop: () => {
        const now = process.hrtime.bigint();
        if (startTime !== null) {
          duration = now - startTime;
        } else {
          throw new Error('Called stop() before start()');
        }
      },
    },
    controlClock: {
      reset: () => {
        startTime = duration = null;
      },
      duration_ns: () => {
        if (duration === null) {
          throw new Error('Did not call clock.stop()');
        }
        return duration;
      },
    },
  };
}

export async function runTest(
  iteration: (clock: BenchPressClock) => Promise<boolean>,
  options: BenchPressOptions
): Promise<BenchPressResult> {
  const { clock, controlClock } = createClock();

  console.log(`Warming up '${options.testName}' (${options.warmup} iterations)`);
  for (let i = 0; i < options.warmup; i += 1) {
    process.stdout.write(`\x1b[0GIteration [${i + 1}/${options.warmup}]`);
    controlClock.reset();
    const _ = await iteration(clock);
  }

  console.log(`\nStarting test '${options.testName}' (${options.iterations} iterations)`);
  const iterationDurations_ms = new Array<bigint | null>(options.iterations).fill(null);
  for (let i = 0; i < options.iterations; i += 1) {
    process.stdout.write(`\x1b[0GIteration [${i + 1}/${options.iterations}]`);

    controlClock.reset();
    const success = await iteration(clock);

    if (success) {
      iterationDurations_ms[i] = controlClock.duration_ns();
    }
  }
  console.log();

  return {
    testName: options.testName,
    runName: options.runName,
    iterationDurations_ns: iterationDurations_ms,
    iterationCount: options.iterations,
  };
}

function ns_to_ms(ns: bigint) {
  return Number(ns / 1_000_000n);
}

function ms_to_hz(ms: number) {
  return 1e3 / ms;
}

function getStandardDeviation_ms(data_ns: bigint[]) {
  const data_ms = data_ns.map(ns_to_ms);
  const count = data_ms.length;
  const mean_ms = data_ms.reduce((sum, val) => sum + val, 0) / count;
  const squaredDiff_ms = data_ms.reduce((diffSq, x) => diffSq + (x - mean_ms) ** 2, 0);
  return Math.sqrt(squaredDiff_ms / (count - 1));
}

function percentile_ms(resultSorted_ns: bigint[], percentile: number) {
  let index = Math.round((resultSorted_ns.length * percentile) / 100);
  if (index >= resultSorted_ns.length) {
    index = resultSorted_ns.length - 1;
  }

  return ns_to_ms(resultSorted_ns[index]);
}

function processResults(
  result: BenchPressResult,
  options: BenchPressReportOptions
): BenchPressProcessedResult {
  const successfulIterations_ns = result.iterationDurations_ns.filter(
    (x) => x !== null
  ) as bigint[];
  const resultSorted_ns = [...successfulIterations_ns].sort((a, b) => Number(a - b));
  const iterations_ms = result.iterationDurations_ns.map((x) => (x === null ? null : ns_to_ms(x)));

  const successCount = successfulIterations_ns.length;
  const successDuration_ns = successfulIterations_ns.reduce((sum, val) => sum + val, 0n);
  const min_ms = ns_to_ms(resultSorted_ns[0]);
  const max_ms = ns_to_ms(resultSorted_ns[resultSorted_ns.length - 1]);
  const mean_ms = ns_to_ms(successDuration_ns / BigInt(successCount));
  const standardDeviation_ms = getStandardDeviation_ms(successfulIterations_ns);
  const percentiles_ms = Object.fromEntries(
    options.percentiles.map((p) => [p, percentile_ms(resultSorted_ns, p)])
  );

  return {
    testName: result.testName,
    runName: result.runName,
    iterationCount: result.iterationCount,
    successCount,
    failureCount: result.iterationCount - successCount,
    successDuration_ms: ns_to_ms(successDuration_ns),
    standardDeviation_ms: standardDeviation_ms,
    mean_ms,
    min_ms,
    max_ms,
    percentiles_ms,
    iterations_ms,
  };
}

export async function reportResult(result: BenchPressResult, options: BenchPressReportOptions) {
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
    `Number of successful iterations: ${processed.successCount} / ${processed.iterationCount}`
  );
  console.log(`Number of failed iterations: ${processed.failureCount}`);
  console.log(`Duration of successful iterations: ${processed.successDuration_ms} ms`);
  console.log();

  function logMetric(name: string, duration_ms: number, suffix?: string) {
    console.log(
      `${name}: ${duration_ms} ms (${ms_to_hz(duration_ms).toFixed(2)} ops/s)${
        suffix ? ' ' + suffix : ''
      }`
    );
  }

  logMetric(
    'Avg iteration',
    processed.mean_ms,
    `(std dev: ${processed.standardDeviation_ms.toFixed(2)} ms)`
  );
  logMetric('Min iteration', processed.min_ms);
  for (const [percentile, duration_ms] of Object.entries(processed.percentiles_ms)) {
    logMetric(`Percentile ${percentile}`, duration_ms);
  }
  logMetric('Max iteration', processed.max_ms);
}

async function reportResultTsv(
  processed: BenchPressProcessedResult,
  options: BenchPressReportOptions
) {
  const header =
    [
      'Test name',
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
        `Existing file (${tsvPath}) doesn't start with the expected header: ${header}`
      );
    }
    await fs.promises.writeFile(tsvPath, `${existingData}${row}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    await fs.promises.writeFile(tsvPath, `${header}${row}`);
  }
}

async function reportResultJson(
  processed: BenchPressProcessedResult,
  options: BenchPressReportOptions
) {
  const percentileData: Record<string, number> = {};
  for (const [percentile, duration_ms] of Object.entries(processed.percentiles_ms)) {
    percentileData[`percentile_${percentile}`] = duration_ms;
  }

  const data = {
    name: processed.testName,
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
  await fs.promises.writeFile(jsonPath, JSON.stringify(data, null, 2));
}

async function reportResultGnuPlot(
  processed: BenchPressProcessedResult,
  options: BenchPressReportOptions
) {
  const gnuPlotScriptPath = path.join(options.folder, `${options.baseName}.gnu`);
  const gnuPlotDataPath = path.join(options.folder, `${options.baseName}.dat`);
  const gnuPlotPngPath = path.join(options.folder, `${options.baseName}.png`);

  const gnuPlotScript = `# gnuplot script
set term pngcairo dashed font 'Avenir Next Condensed Regular' fontscale 0.8 size 1024,768
set output '${path.basename(gnuPlotPngPath)}'

set key outside

set xlabel 'Iteration'
set ylabel 'Duration (ms)'
set yrange [0:]

plot '${path.basename(gnuPlotDataPath)}' title '${processed.testName}',\\
  ${processed.mean_ms} title 'avg',\\
  ${processed.max_ms} title 'max',\\
${Object.entries(processed.percentiles_ms)
  .reverse()
  .map(([p, v_ms]) => `  ${v_ms} dashtype 3 title 'p${p}',\\`)
  .join('\n')}
  ${processed.min_ms} title 'min'`;

  const gnuPlotData = processed.iterations_ms.map((x) => (x === null ? 'NaN' : x)).join('\n');

  console.log(`Writing to ${gnuPlotScriptPath}`);
  await fs.promises.writeFile(gnuPlotScriptPath, gnuPlotScript);
  console.log(`Writing to ${gnuPlotDataPath}`);
  await fs.promises.writeFile(gnuPlotDataPath, gnuPlotData);
  console.log(`Executing gnuplot (generating ${gnuPlotPngPath})`);
  await promisify(childProcess.execFile)('gnuplot', [gnuPlotScriptPath], {
    cwd: options.folder,
  });
}

/** 'yyyy-mm-dd-hh-mm-ss' */
export function fileTimestamp() {
  return new Date().toISOString().replace(/[T:]/g, '-').replace(/\..+$/, '');
}
