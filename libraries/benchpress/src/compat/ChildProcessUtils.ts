import * as childProcess from 'node:child_process';

export const NoSuchCommand = Symbol('NoSuchCommand');

export function execFile(
  file: string,
  args: string[],
  options: { cwd: string; input?: string },
): string | typeof NoSuchCommand {
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
