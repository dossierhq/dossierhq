import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';

export interface SqldProcess {
  url: string;
  close(): void;
}

// All sqld test files run in parallel and each spawns one or more sqld processes,
// so on a busy CI runner cold start can take noticeably longer than locally. Give
// the health check a generous deadline rather than a tight retry count.
const HEALTH_TIMEOUT_MS = 30_000;
const HEALTH_POLL_INTERVAL_MS = 100;

export async function createSqldProcess(name: string, address: string): Promise<SqldProcess> {
  const directory = `databases/sqld-${name}`;
  const dbPath = `${directory}/data.sqld`;
  const logPath = `${directory}/log.txt`;
  const url = `http://${address}`;

  await mkdir(directory, { recursive: true });

  const logStream = createWriteStream(logPath, { flags: 'a' });

  const sqld = spawn('sqld', ['--db-path', dbPath, '--http-listen-addr', address]);

  let spawnError: Error | null = null;
  sqld.on('error', (error) => {
    spawnError = error;
  });

  sqld.stdout.pipe(logStream);
  sqld.stderr.pipe(logStream);

  await waitForHealthy(url, logStream, logPath, () => spawnError);

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
  getSpawnError: () => Error | null,
) {
  const healthUrl = `${url}/health`;
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  let attempts = 0;
  while (Date.now() < deadline) {
    const spawnError = getSpawnError();
    if (spawnError) {
      throw new Error(`Failed to start sqld for ${healthUrl}: ${spawnError.message}`);
    }
    attempts++;
    try {
      const res = await fetch(healthUrl);
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
  const log = await readFile(logPath, 'utf8').catch(() => '(no log available)');
  throw new Error(
    `Server is not responding on ${healthUrl} after ${HEALTH_TIMEOUT_MS}ms (${attempts} attempts).\nsqld log:\n${log}`,
  );
}
