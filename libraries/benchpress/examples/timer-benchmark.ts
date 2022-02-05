import path from 'path';
import { delay, runTest, reportResult, fileTimestamp } from '../src/';

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
    folder: path.join(__dirname, 'output'),
    baseName: `${runName}-${variant}-set-timeout`,
    tsvFilename: 'benchmark.tsv',
  });
}

if (require.main === module) {
  const runName = process.argv[2] || '';
  const variant = 'main';
  const timestamp = fileTimestamp();
  const fullRunName = runName ? `${timestamp}-${runName}` : timestamp;
  main(fullRunName, variant).catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
