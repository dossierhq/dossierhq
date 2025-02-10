import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';

export async function fetchTextCached(url: string, cachePath: string): Promise<string> {
  try {
    const data = await readFile(cachePath, { encoding: 'utf-8' });
    return data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // skip error
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} status: ${response.status}`);
  }
  const text = await response.text();

  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, text, { encoding: 'utf-8' });

  return text;
}

export async function fetchJsonCached<T>(url: string, cachePath: string): Promise<T> {
  const text = await fetchTextCached(url, cachePath);
  return JSON.parse(text) as T;
}
