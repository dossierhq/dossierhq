export function toClassName(...args: (string | false | undefined)[]): string {
  return args.filter((it) => it).join(' ');
}
