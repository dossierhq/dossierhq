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
      router.replace({ pathname: router.pathname, query: urlSearchParams.toString() });
    },
    [router]
  );

  return { urlSearchParams, onUrlSearchParamsChange };
}
