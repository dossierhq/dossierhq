import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

export function useUrlSearchParams() {
  const router = useRouter();

  const urlSearchParams = useMemo(() => {
    const result = new URLSearchParams();
    for (const [key, value] of Object.entries(router.query)) {
      if (Array.isArray(value)) {
        value.forEach((valueItem) => result.append(key, valueItem));
      } else if (typeof value === 'string') {
        result.append(key, value);
      }
    }
    return result;
  }, [router.query]);

  const onUrlSearchParamsChange = useCallback(
    (urlSearchParams: URLSearchParams) => {
      let [path, existingQuery] = router.asPath.split('?');
      const query = urlSearchParams.toString();
      if (existingQuery !== query) {
        const url = query ? `${path}?${query}` : path;
        router.replace(url);
      }
    },
    [router],
  );

  return { urlSearchParams, onUrlSearchParamsChange };
}
