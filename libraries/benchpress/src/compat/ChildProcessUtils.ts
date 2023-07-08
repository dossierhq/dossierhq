import * as childProcess from 'node:child_process';

export const NoSuchCommand = Symbol('NoSuchCommand');

export async function execFile(
  file: string,
  args: string[],
  options: { cwd: string; input?: string },
): Promise<string | typeof NoSuchCommand> {
  if (typeof Deno !== 'undefined') {
    try {
      const process = Deno.run({
        cmd: [file, ...args],
        cwd: options.cwd,
        stdin: options.input ? 'piped' : undefined,
        stdout: 'piped',
      });
      if (options.input) {
        await process.stdin.write(new TextEncoder().encode(options.input));
        await process.stdin.close();
      }
      const [status, output] = await Promise.all([process.status(), process.output()]);
      await process.close();
      if (!status.success) {
        throw new Error(`Failed to run ${file} ${args.join(' ')}: ${status.code}`);
      }
      return new TextDecoder().decode(output);
    } catch (error) {
      if (isNoSuchFileError(error)) {
        return NoSuchCommand;
      }
      throw error;
    }
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
