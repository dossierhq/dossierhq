import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';

export interface SqldProcess {
  url: string;
  close(): void;
}

export async function createSqldProcess(name: string, address: string): Promise<SqldProcess> {
  const directory = `databases/sqld-${name}`;
  const dbPath = `${directory}/data.sqld`;
  const logPath = `${directory}/log.txt`;
  const url = `http://${address}`;

  await mkdir(directory, { recursive: true });

  const logStream = createWriteStream(logPath, { flags: 'a' });

  const sqld = spawn('sqld', ['--db-path', dbPath, '--http-listen-addr', address]);

  sqld.stdout.pipe(logStream);
  sqld.stderr.pipe(logStream);

  await waitForHealthy(url);

  return {
    url,
    close() {
      sqld.kill('SIGINT');
    },
  };
}

async function waitForHealthy(url: string) {
  const healthUrl = `${url}/health`;
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(healthUrl);
      if (res.ok) {
        return;
      }
    } catch (error) {
      // ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Server is not responding on ${healthUrl}`);
}
