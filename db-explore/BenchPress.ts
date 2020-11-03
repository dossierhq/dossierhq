#!/usr/bin/env npx ts-node
import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';
import { promisify } from 'util';

interface BenchPressClock {
  start: () => void;
  stop: () => void;
}

interface BenchPressOptions {
  warmup: number;
  iterations: number;
}

interface BenchPressResult {
  result: bigint[];
  iterations: number;
  successCount: number;
  successDuration: bigint;
}

interface BenchPressReportOptions {
  name: string;
  percentiles: number[];
  folder: string;
  baseName: string;
}

interface BenchPressProcessedResult {
  iterationCount: number;
  successCount: number;
  failureCount: number;
  successDuration_ms: number;
  mean_ms: number;
  min_ms: number;
  max_ms: number;
  percentiles_ms: Record<string, number>;
  iterations_ms: number[];
}

function delay(delay_ms: number) {
  return new Promise((resolve) => setTimeout(resolve, delay_ms));
}

async function runTest(
  test: (clock: BenchPressClock) => Promise<boolean>,
  options: BenchPressOptions
): Promise<BenchPressResult> {
  let startTime: bigint | null = null;
  let duration: bigint | null = null;

  const clock = {
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
  };

  // Warmup
  for (let i = 0; i < options.warmup; i += 1) {
    startTime = duration = null;
    const success = await test(clock);
  }

  // Iterations
  const result = new Array<bigint>(options.iterations);
  let successCount = 0;
  let successDuration: bigint = 0n;
  for (let i = 0; i < options.iterations; i += 1) {
    startTime = duration = null;
    const success = await test(clock);

    if (success) {
      if (duration === null) {
        throw new Error('Did not call clock.stop()');
      } else {
        result[i] = duration;
        successCount += 1;
        successDuration += duration;
      }
    }
  }

  return {
    result,
    iterations: options.iterations,
    successCount,
    successDuration,
  };
}

function ns_to_ms(nano: bigint) {
  return Number(nano / 1_000_000n);
}

function ms_to_hz(millis: number) {
  return 1e3 / millis;
}

function percentile_ms(resultSorted_ns: bigint[], percentile: number) {
  return ns_to_ms(resultSorted_ns[(resultSorted_ns.length * percentile) / 100]);
}

function processResults(
  result: BenchPressResult,
  options: BenchPressReportOptions
): BenchPressProcessedResult {
  const resultSorted_ns = [...result.result].sort((a, b) => Number(a - b));
  const iterations_ms = result.result.map(ns_to_ms);
  const min_ms = ns_to_ms(resultSorted_ns[0]);
  const max_ms = ns_to_ms(resultSorted_ns[resultSorted_ns.length - 1]);
  const mean_ms = ns_to_ms(
    result.successDuration / BigInt(result.successCount)
  );
  const percentiles_ms = Object.fromEntries(
    options.percentiles.map((p) => [p, percentile_ms(resultSorted_ns, p)])
  );
  return {
    iterationCount: result.iterations,
    successCount: result.successCount,
    failureCount: result.iterations - result.successCount,
    successDuration_ms: ns_to_ms(result.successDuration),
    mean_ms,
    min_ms,
    max_ms,
    percentiles_ms,
    iterations_ms,
  };
}

async function reportResult(
  result: BenchPressResult,
  options: BenchPressReportOptions
) {
  const processed = processResults(result, options);
  reportResultConsole(processed);

  console.log();
  await fs.promises.mkdir(options.folder, { recursive: true });

  await reportResultJson(processed, options);
  await reportResultGnuPlot(processed, options);
}

function reportResultConsole(processed: BenchPressProcessedResult) {
  console.log(
    `Number of successful iterations: ${processed.successCount} / ${processed.iterationCount}`
  );
  console.log(`Number of failed iterations: ${processed.failureCount}`);
  console.log(
    `Duration of successful iteration: ${processed.successDuration_ms} ms`
  );

  function logMetric(name: string, duration_ms: number) {
    console.log(
      `${name}: ${duration_ms} ms (${ms_to_hz(duration_ms).toFixed(2)} ops/s)`
    );
  }

  console.log();

  logMetric('Avg iteration', processed.mean_ms);
  logMetric('Min iteration', processed.min_ms);
  for (const [percentile, duration_ms] of Object.entries(
    processed.percentiles_ms
  )) {
    logMetric(`Percentile ${percentile}`, duration_ms);
  }
  logMetric('Max iteration', processed.max_ms);
}

async function reportResultJson(
  processed: BenchPressProcessedResult,
  options: BenchPressReportOptions
) {
  const percentileData: Record<string, number> = {};
  for (const [percentile, duration_ms] of Object.entries(
    processed.percentiles_ms
  )) {
    percentileData[`percentile_${percentile}`] = duration_ms;
  }

  const data = {
    name: options.name,
    unit: 'ms',
    iterationCount: processed.iterationCount,
    successCount: processed.successCount,
    failureCount: processed.failureCount,
    successDuration: processed.successDuration_ms,
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
  const gnuPlotScriptPath = path.join(
    options.folder,
    `${options.baseName}.gnu`
  );
  const gnuPlotDataPath = path.join(options.folder, `${options.baseName}.dat`);
  const gnuPlotPngPath = path.join(options.folder, `${options.baseName}.png`);

  const gnuPlotScript = `# gnuplot script
set term pngcairo dashed font 'Avenir Next Condensed Regular' fontscale 0.8
set output '${path.basename(gnuPlotPngPath)}'

set key outside

set xlabel 'Iteration'
set ylabel 'Duration (ms)'
set yrange [0:]

plot '${path.basename(gnuPlotDataPath)}' title '${options.name}',\\
  ${processed.mean_ms} title 'avg',\\
  ${processed.max_ms} title 'max',\\
${Object.entries(processed.percentiles_ms)
  .reverse()
  .map(([p, v_ms]) => `  ${v_ms} dashtype 3 title 'p${p}',\\`)
  .join('\n')}
  ${processed.min_ms} title 'min'`;

  const gnuPlotData = processed.iterations_ms.join('\n');

  console.log(`Writing to ${gnuPlotScriptPath}`);
  await fs.promises.writeFile(gnuPlotScriptPath, gnuPlotScript);
  console.log(`Writing to ${gnuPlotDataPath}`);
  await fs.promises.writeFile(gnuPlotDataPath, gnuPlotData);
  console.log(`Executing gnuplot (generating ${gnuPlotPngPath})`);
  await promisify(childProcess.execFile)('gnuplot', [gnuPlotScriptPath], {
    cwd: options.folder,
  });
}

async function main() {
  const result = await runTest(
    async (clock) => {
      // setup
      const count = 1000;
      clock.start();
      // test
      await delay(100 + Math.random() * 20);
      clock.stop();
      // check result
      return true;
    },
    { warmup: 5, iterations: 100 }
  );

  // yyyy-mm-dd-hh-mm-ss
  const timestamp = new Date()
    .toISOString()
    .replace(/[T:]/g, '-')
    .replace(/\..+$/, '');

  await reportResult(result, {
    name: 'test',
    percentiles: [50, 90, 95],
    folder: path.join(__dirname, 'output'),
    baseName: `test-${timestamp}`,
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
