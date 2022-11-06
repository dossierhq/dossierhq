export function replaceStdoutLineIfSupported(message: string) {
  if (process.stdout && process.stdout.isTTY) {
    process.stdout.write(`\x1b[0G${message}`);
    return true;
  }
  //TODO no support for isTTY in Bun atm
  if (typeof Bun !== 'undefined') {
    Bun.write(Bun.stdout, `\x1b[0G${message}`);
  }
  return false;
}
