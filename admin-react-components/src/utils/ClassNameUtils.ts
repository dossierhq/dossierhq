import type { SpacingSize } from '../..';

export function joinClassNames(...classNames: Array<string | undefined>): string {
  let result = '';
  for (const className of classNames) {
    if (className) {
      if (result) {
        result = `${result} ${className}`;
      } else {
        result = className;
      }
    }
  }
  return result;
}

export function gapClassName(gap?: SpacingSize): string {
  if (typeof gap === 'number') {
    return `g-${gap}`;
  }
  return '';
}
