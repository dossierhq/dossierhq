import type { BenchPressResult } from './Runner.js';
import { ns_to_ms } from './Units.js';

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
  const successfulIterations_ns = result.iterationDurations_ns.filter(
    (x) => x !== null
  ) as bigint[];
  const resultSorted_ns = [...successfulIterations_ns].sort((a, b) => Number(a - b));
  const iterations_ms = result.iterationDurations_ns.map((x) => (x === null ? null : ns_to_ms(x)));

  const successCount = successfulIterations_ns.length;
  const successDuration_ns = successfulIterations_ns.reduce((sum, val) => sum + val, 0n);
  const min_ms = resultSorted_ns.length > 0 ? ns_to_ms(resultSorted_ns[0]) : null;
  const max_ms =
    resultSorted_ns.length > 0 ? ns_to_ms(resultSorted_ns[resultSorted_ns.length - 1]) : null;
  const mean_ms = successCount > 0 ? ns_to_ms(successDuration_ns / BigInt(successCount)) : null;
  const standardDeviation_ms = getStandardDeviation_ms(successfulIterations_ns);
  const percentiles_ms = Object.fromEntries(
    options.percentiles.map((p) => [p, percentile_ms(resultSorted_ns, p)])
  );

  return {
    testName: result.testName,
    variant: result.variant,
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

function getStandardDeviation_ms(data_ns: bigint[]) {
  const data_ms = data_ns.map(ns_to_ms);
  const count = data_ms.length;
  const mean_ms = data_ms.reduce((sum, val) => sum + val, 0) / count;
  const squaredDiff_ms = data_ms.reduce((diffSq, x) => diffSq + (x - mean_ms) ** 2, 0);
  return Math.sqrt(squaredDiff_ms / (count - 1));
}

function percentile_ms(resultSorted_ns: bigint[], percentile: number) {
  if (resultSorted_ns.length === 0) {
    return null;
  }
  let index = Math.round((resultSorted_ns.length * percentile) / 100);
  if (index >= resultSorted_ns.length) {
    index = resultSorted_ns.length - 1;
  }

  return ns_to_ms(resultSorted_ns[index]);
}
