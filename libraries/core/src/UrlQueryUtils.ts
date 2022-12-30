export function encodeObjectToURLSearchParams(
  params: object | undefined,
  options?: { keepEmptyObjects: boolean }
): URLSearchParams {
  const result = new URLSearchParams();
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
      result.set(key, encoded);
    }
  }
  return result;
}

export function decodeObjectFromURLSearchParams<T extends object>(
  urlSearchParams: Readonly<URLSearchParams> | undefined
): Partial<T> {
  const result = {} as Partial<T>;
  if (urlSearchParams) {
    for (const [key, value] of urlSearchParams.entries()) {
      result[key as keyof T] = JSON.parse(value);
    }
  }
  return result;
}

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

export function buildUrlWithUrlQuery<TKey extends string>(
  baseUrl: string,
  params: Partial<Record<TKey, string | undefined>>
): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (!value) {
      continue;
    }
    if (typeof value !== 'string') {
      throw new Error(`Unexpected type ${typeof value} for ${key}`);
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
