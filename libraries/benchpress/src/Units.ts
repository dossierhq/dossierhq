export function ns_to_ms(ns: bigint): number {
  return Number(ns / 1_000_000n);
}

export function ms_to_hz(ms: number): number {
  return 1e3 / ms;
}
