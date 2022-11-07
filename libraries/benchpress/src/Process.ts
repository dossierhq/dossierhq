import type { BenchPressResult } from './Runner.js';

export interface BenchPressProcessOptions {
  percentiles: number[];
}

export interface BenchPressProcessedResult {
  testName: string;
  variant: string;
  runName: string;
  iterationCount: number;
  successCount: number;
  failureCount: number;
  successDuration_ms: number;
  standardDeviation_ms: number;
  mean_ms: number | null;
  min_ms: number | null;
  max_ms: number | null;
  percentiles_ms: Record<string, number | null>;
  iterations_ms: Array<number | null>;
}

export function processResults(
  result: BenchPressResult,
  options: BenchPressProcessOptions
): BenchPressProcessedResult {
  const successfulIterations_ms = result.iterationDurations_ms.filter(
    (it) => it !== null
  ) as number[];
  const resultSorted_ms = [...successfulIterations_ms].sort((a, b) => a - b);
  const iterations_ms = result.iterationDurations_ms;

  const successCount = successfulIterations_ms.length;
  const successDuration_ms = successfulIterations_ms.reduce((sum, val) => sum + val, 0);
  const min_ms = resultSorted_ms.length > 0 ? resultSorted_ms[0] : null;
  const max_ms = resultSorted_ms.length > 0 ? resultSorted_ms[resultSorted_ms.length - 1] : null;
  const mean_ms = successCount > 0 ? successDuration_ms / successCount : null;
  const standardDeviation_ms = getStandardDeviation_ms(successfulIterations_ms);
  const percentiles_ms = Object.fromEntries(
    options.percentiles.map((p) => [p, percentile_ms(resultSorted_ms, p)])
  );

  return {
    testName: result.testName,
    variant: result.variant,
    runName: result.runName,
    iterationCount: result.iterationCount,
    successCount,
    failureCount: result.iterationCount - successCount,
    successDuration_ms,
    standardDeviation_ms,
    mean_ms,
    min_ms,
    max_ms,
    percentiles_ms,
    iterations_ms,
  };
}

function getStandardDeviation_ms(data_ms: number[]) {
  const count = data_ms.length;
  const mean_ms = data_ms.reduce((sum, val) => sum + val, 0) / count;
  const squaredDiff_ms = data_ms.reduce((diffSq, x) => diffSq + (x - mean_ms) ** 2, 0);
  return Math.sqrt(squaredDiff_ms / (count - 1));
}

function percentile_ms(resultSorted_ms: number[], percentile: number) {
  if (resultSorted_ms.length === 0) {
    return null;
  }
  let index = Math.round((resultSorted_ms.length * percentile) / 100);
  if (index >= resultSorted_ms.length) {
    index = resultSorted_ms.length - 1;
  }

  return resultSorted_ms[index];
}
