import * as path from 'node:path';
import { delay, fileTimestamp, reportResult, runTest } from '../index.js';

async function main(runName: string, variant: string) {
  const result = await runTest(
    async (clock) => {
      clock.start();
      await delay(100 + Math.random() * 20);
      clock.stop();
      return Math.random() > 0.1; // fail 10% of the time
    },
    { testName: 'setTimeout', variant, runName, warmup: 5, iterations: 100 }
  );

  await reportResult(result, {
    percentiles: [50, 90, 95],
    folder: path.join(process.cwd(), 'output'),
    baseName: `${runName}-${variant}-set-timeout`,
    tsvFilename: 'benchmark.tsv',
  });
}

const runName = process.argv[2] || '';
const variant = 'main';
const timestamp = fileTimestamp();
const fullRunName = runName ? `${timestamp}-${runName}` : timestamp;
main(fullRunName, variant).catch((error) => {
  console.warn(error);
  process.exitCode = 1;
});
