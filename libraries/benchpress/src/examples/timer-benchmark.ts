import { delay, fileTimestamp, reportResult, runTest } from '../index.js';

async function main(runName: string, variant: string) {
  const result = await runTest(
    async (clock) => {
      clock.start();
      await delay(10 + Math.random() * 2);
      clock.stop();
      return Math.random() > 0.1; // fail 10% of the time
    },
    { testName: 'setTimeout', variant, runName, warmup: 5, iterations: 100 },
  );

  await reportResult(result, {
    percentiles: [50, 90, 95],
    folder: 'output',
    baseName: `${runName}-${variant}-set-timeout`,
    tsvFilename: 'benchmark.tsv',
  });
}

const args = typeof Deno !== 'undefined' ? Deno.args : process.argv.slice(2);
const runName = args[0] ?? '';
const variant = typeof Deno !== 'undefined' ? 'deno' : typeof Bun !== 'undefined' ? 'bun' : 'node';
const timestamp = fileTimestamp();
const fullRunName = runName ? `${timestamp}-${runName}` : timestamp;
await main(fullRunName, variant);
