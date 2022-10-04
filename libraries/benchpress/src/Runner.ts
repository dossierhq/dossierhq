import type { BenchPressClock } from './Clock.js';
import { createClock } from './Clock.js';

export interface BenchPressOptions {
  testName: string;
  variant: string;
  runName: string;
  warmup: number;
  iterations: number;
}

export interface BenchPressResult {
  testName: string;
  variant: string;
  runName: string;
  iterationDurations_ns: Array<bigint | null>;
  iterationCount: number;
}

export async function runTest(
  iteration: (clock: BenchPressClock) => Promise<boolean>,
  options: BenchPressOptions
): Promise<BenchPressResult> {
  const { clock, controlClock } = createClock();

  console.log(
    `Warming up '${options.testName}' - ${options.variant} (${options.warmup} iterations)`
  );
  for (let i = 0; i < options.warmup; i += 1) {
    if (process.stdout.isTTY) {
      process.stdout.write(`\x1b[0GIteration [${i + 1}/${options.warmup}]`);
    }
    controlClock.reset();
    const _success = await iteration(clock);
  }

  console.log(
    `\nStarting test '${options.testName}' - ${options.variant} (${options.iterations} iterations)`
  );
  const iterationDurations_ms = new Array<bigint | null>(options.iterations).fill(null);
  for (let i = 0; i < options.iterations; i += 1) {
    if (process.stdout.isTTY) {
      process.stdout.write(`\x1b[0GIteration [${i + 1}/${options.iterations}]`);
    }

    controlClock.reset();
    const success = await iteration(clock);

    if (success) {
      iterationDurations_ms[i] = controlClock.duration_ns();
    }
  }
  console.log();

  return {
    testName: options.testName,
    variant: options.variant,
    runName: options.runName,
    iterationDurations_ns: iterationDurations_ms,
    iterationCount: options.iterations,
  };
}
