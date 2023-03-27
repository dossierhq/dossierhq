export function numberWithThousandsSeparator(num: number) {
  if (num < 1000) return num;

  const str = num.toString();
  const parts = [];
  for (let i = str.length - 1; i >= 0; i -= 3) {
    parts.push(str.slice(Math.max(0, i - 2), i + 1));
  }
  return parts.reverse().join('\u202f');
}
