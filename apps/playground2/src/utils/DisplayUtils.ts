export function bytesToHumanSize(bytes: number): string {
  let value: number;
  let unit: string;
  if (bytes >= 1024 * 1024) {
    value = bytes / (1024 * 1024);
    unit = 'MB';
  } else if (bytes >= 1024) {
    value = bytes / 1024;
    unit = 'KB';
  } else {
    value = bytes;
    unit = 'B';
  }
  return `${value.toLocaleString()}${unit}`;
}
