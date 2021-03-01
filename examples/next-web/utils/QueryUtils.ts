export function encodeQuery(entries: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(entries)) {
    if (value === null || value === undefined) {
      continue;
    }
    const encoded = `${key}=${encodeURIComponent(JSON.stringify(value))}`;
    parts.push(encoded);
  }
  return parts.join('&');
}

export function decodeQuery<T>(
  name: string,
  query: Record<string, string | string[]>
): T | undefined {
  const encoded = query[name];
  if (encoded === undefined) {
    return undefined;
  }
  if (Array.isArray(encoded)) {
    throw new Error(`Did not expect an array for ${name}`);
  }
  const value = JSON.parse(decodeURIComponent(encoded));
  return (value as unknown) as T;
}
