/** 'yyyy-mm-dd-hh-mm-ss' */
export function fileTimestamp(): string {
  return new Date().toISOString().replace(/[T:]/g, '-').replace(/\..+$/, '');
}

export function delay(delay_ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay_ms));
}
