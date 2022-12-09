export function replaceStdoutLineIfSupported(message: string): boolean {
  const output = `\x1b[0G${message}`;
  if (typeof Deno !== 'undefined') {
    if (!Deno.isatty(Deno.stdout.rid)) {
      return false;
    }
    Deno.stdout.writeSync(new TextEncoder().encode(output));
    return true;
  }
  if (process.stdout.isTTY) {
    process.stdout.write(output);
    return true;
  }
  return false;
}
