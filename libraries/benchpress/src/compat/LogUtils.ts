export function replaceStdoutLineIfSupported(message: string): boolean {
  const output = `\x1b[0G${message}`;
  if (process.stdout.isTTY) {
    process.stdout.write(output);
    return true;
  }
  return false;
}
