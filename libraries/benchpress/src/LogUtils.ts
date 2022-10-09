declare global {
  const Bun: {
    write(a: unknown, b: unknown): void;
    stdout: unknown;
  };
}

export function replaceStdoutLineIfSupported(message: string) {
  if (process.stdout && process.stdout.isTTY) {
    process.stdout.write(`\x1b[0G${message}`);
    return true;
  }
  if (Bun) {
    Bun.write(Bun.stdout, `\x1b[0G${message}`);
  }
  return false;
}
