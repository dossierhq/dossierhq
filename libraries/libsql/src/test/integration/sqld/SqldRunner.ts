import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';

export interface SqldProcess {
  url: string;
  close(): void;
}

// The sqld test files run one at a time (see fileParallelism in vitest.config.js), but a
// cold start on a busy CI runner is still slower than locally. Give the health check a
// generous deadline rather than a tight retry count. It has to stay comfortably below the
// enclosing vitest timeouts (hooks, and the per-test timeout in TestUtils, where SyncTest
// spawns two processes within one test) so that a failure reports the sqld log rather than
// being cut short by vitest.
const HEALTH_TIMEOUT_MS = 15_000;
const HEALTH_POLL_INTERVAL_MS = 100;
// A socket that accepts the connection but never answers (e.g. an unrelated process holding
// the port) would otherwise stall a single fetch for the whole deadline.
const HEALTH_REQUEST_TIMEOUT_MS = 1_000;

export async function createSqldProcess(name: string, address: string): Promise<SqldProcess> {
  const directory = `databases/sqld-${name}`;
  const dbPath = `${directory}/data.sqld`;
  const logPath = `${directory}/log.txt`;
  const url = `http://${address}`;

  await mkdir(directory, { recursive: true });

  // Truncate: the log is read back verbatim when the health check fails, and output from a
  // previous run mixed into that message is actively misleading.
  const logStream = createWriteStream(logPath, { flags: 'w' });

  const sqld = spawn('sqld', ['--db-path', dbPath, '--http-listen-addr', address]);

  let startupError: Error | null = null;
  sqld.on('error', (error) => {
    startupError = new Error(`sqld failed to spawn: ${error.message}`);
  });
  // An sqld that dies during startup (port in use, corrupt database, missing tool) otherwise
  // just looks like a slow server until the deadline expires. Fail immediately instead.
  sqld.on('exit', (code, signal) => {
    startupError = new Error(`sqld exited during startup (code ${code}, signal ${signal})`);
  });

  sqld.stdout.pipe(logStream);
  sqld.stderr.pipe(logStream);

  await waitForHealthy(url, logStream, logPath, () => startupError);

  return {
    url,
    close() {
      sqld.kill('SIGINT');
    },
  };
}

async function waitForHealthy(
  url: string,
  logStream: NodeJS.WritableStream,
  logPath: string,
  getStartupError: () => Error | null,
) {
  const healthUrl = `${url}/health`;
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  let attempts = 0;
  while (Date.now() < deadline) {
    const startupError = getStartupError();
    if (startupError) {
      throw new Error(
        `Failed to start sqld for ${healthUrl}: ${startupError.message}.\nsqld log:\n${await readLog(logPath)}`,
      );
    }
    attempts++;
    try {
      const res = await fetch(healthUrl, {
        signal: AbortSignal.timeout(HEALTH_REQUEST_TIMEOUT_MS),
      });
      if (res.ok) {
        logStream.write(`Server is healthy on ${healthUrl} (after ${attempts} attempts)\n`);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // ignore, server not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, HEALTH_POLL_INTERVAL_MS));
  }
  throw new Error(
    `Server is not responding on ${healthUrl} after ${HEALTH_TIMEOUT_MS}ms (${attempts} attempts).\nsqld log:\n${await readLog(logPath)}`,
  );
}

async function readLog(logPath: string) {
  const log = await readFile(logPath, 'utf8').catch(() => null);
  return log ? log : '(no log available)';
}
