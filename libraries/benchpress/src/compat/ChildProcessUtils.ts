import * as childProcess from 'node:child_process';

export const NoSuchCommand = Symbol('NoSuchCommand');

export function execFile(
  file: string,
  args: string[],
  options: { cwd: string; input?: string }
): Buffer | typeof NoSuchCommand {
  if (typeof Deno !== 'undefined') {
    return NoSuchCommand; //TODO implement
  }
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
    return stdout;
  }
  try {
    return childProcess.execFileSync(file, args, options);
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
