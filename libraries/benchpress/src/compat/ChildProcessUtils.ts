import * as childProcess from 'node:child_process';

export const NoSuchCommand = Symbol('NoSuchCommand');

export function execFile(
  file: string,
  args: string[],
  options: { cwd: string; input?: string },
): string | typeof NoSuchCommand {
  if (typeof Bun !== 'undefined') {
    const resolvedFile = Bun.which(file);
    if (!resolvedFile) {
      return NoSuchCommand;
    }
    const { stdout } = Bun.spawnSync({
      cmd: [file, ...args],
      cwd: options.cwd,
      stdin: options.input ? new TextEncoder().encode(options.input) : undefined,
    });
    if (!stdout) {
      throw new Error('Bun.spawnSync did not return stdout');
    }
    return stdout.toString();
  }
  try {
    return childProcess.execFileSync(file, args, options).toString();
  } catch (error) {
    if (!isNoSuchFileError(error)) {
      throw error;
    }
    return NoSuchCommand;
  }
}

function isNoSuchFileError(error: unknown) {
  return (error as { code?: string })?.code === 'ENOENT';
}
