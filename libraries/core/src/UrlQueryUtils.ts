type Query = Record<string, string | string[] | undefined>;

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

export function decodeURLSearchParamsParam<TReturn>(
  urlSearchParams: Readonly<URLSearchParams> | Query | undefined,
  name: string
): TReturn | undefined {
  if (!urlSearchParams) {
    return undefined;
  }
  const isURLSearchParams = 'get' in urlSearchParams && typeof urlSearchParams.get === 'function';
  const encoded = isURLSearchParams ? urlSearchParams.get(name) : (urlSearchParams as Query)[name];
  if (encoded === undefined || encoded === null) {
    return undefined;
  }
  if (typeof encoded !== 'string') {
    throw new Error(`Expected string value for URL search param ${name}`);
  }
  return JSON.parse(encoded);
}
