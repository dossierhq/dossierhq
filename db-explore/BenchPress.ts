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

async function reportResult(
  result: BenchPressResult,
  options: { percentiles: number[]; folder: string; baseName: string }
) {
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

  console.log(
    `Number of successful iterations: ${result.successCount}/${result.iterations}`
  );
  console.log(
    `Number of failed iterations: ${result.iterations - result.successCount}`
  );
  console.log(
    `Duration of successful iteration: ${ns_to_ms(result.successDuration)} ms`
  );
  console.log();
  console.log(
    `Avg iteration: ${mean_ms} ms (${ms_to_hz(mean_ms).toFixed(2)} ops/s)`
  );
  console.log(
    `Min iteration: ${min_ms} ms (${ms_to_hz(min_ms).toFixed(2)} ops/s)`
  );
  for (const [percentile, duration_ms] of Object.entries(percentiles_ms)) {
    console.log(
      `Percentile ${percentile}: ${duration_ms} ms (${ms_to_hz(
        duration_ms
      ).toFixed(2)} ops/s)`
    );
  }
  console.log(
    `Max iteration: ${max_ms} ms (${ms_to_hz(max_ms).toFixed(2)} ops/s)`
  );

  console.log();
  await fs.promises.mkdir(options.folder, { recursive: true });
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

plot '${path.basename(gnuPlotDataPath)}' title '${options.baseName}',\\
  ${mean_ms} title 'avg',\\
  ${max_ms} title 'max',\\
${Object.entries(percentiles_ms)
  .reverse()
  .map(([p, v_ms]) => `  ${v_ms} dashtype 3 title 'p${p}',\\`)
  .join('\n')}
  ${min_ms} title 'min'`;
  const gnuPlotData = iterations_ms.join('\n');

  console.log(`Writing to ${gnuPlotScriptPath}...`);
  await fs.promises.writeFile(gnuPlotScriptPath, gnuPlotScript);
  console.log(`Writing to ${gnuPlotDataPath}...`);
  await fs.promises.writeFile(gnuPlotDataPath, gnuPlotData);
  console.log(`Executing gnuplot (generating ${gnuPlotPngPath})...`);
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
  await reportResult(result, {
    percentiles: [50, 90, 95],
    folder: path.join(__dirname, 'output'),
    baseName: 'test',
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
