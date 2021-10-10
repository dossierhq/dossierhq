export function stringifyUrlQueryParams<TKey extends string>(
  params: Record<TKey, unknown> | undefined,
  options?: { keepEmptyObjects: boolean }
): Partial<Record<TKey, string>> {
  const result: Partial<Record<TKey, string>> = {};

  const removeEmptyObjects = !options?.keepEmptyObjects;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (
        value === null ||
        value === undefined ||
        (removeEmptyObjects &&
          typeof value === 'object' &&
          value &&
          Object.keys(value).length === 0)
      ) {
        continue;
      }
      const encoded = JSON.stringify(value);
      result[key as TKey] = encoded;
    }
  }
  return result;
}

export function buildUrlWithUrlQuery(
  baseUrl: string,
  params: Record<string, string | undefined>
): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (!value) {
      continue;
    }
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  if (parts.length === 0) {
    return baseUrl;
  }
  const paramsString = parts.join('&');
  if (baseUrl.indexOf('?') >= 0) {
    return `${baseUrl}&${paramsString}`;
  }
  return `${baseUrl}?${paramsString}`;
}

export function decodeUrlQueryStringifiedParam<TReturn, TKey extends string>(
  name: TKey,
  query: Partial<Record<TKey, string>>
): TReturn | undefined {
  const encoded = query[name];
  if (encoded === undefined) {
    return undefined;
  }
  const value = JSON.parse(encoded);
  return value as unknown as TReturn;
}
