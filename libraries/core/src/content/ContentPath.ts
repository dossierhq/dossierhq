export type ContentValuePath = (string | number)[];

export function contentValuePathToString(path: ContentValuePath): string {
  let result = '';
  for (const segment of path) {
    if (Number.isInteger(segment)) {
      result += `[${segment}]`;
    } else {
      if (result.length === 0) {
        result += segment;
      } else {
        result += `.${segment}`;
      }
    }
  }
  return result;
}
