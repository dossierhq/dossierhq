import { useCallback, useState } from 'react';

export function useUrlSearchParams() {
  const [searchParams, setSearchParams] = useState(
    () => new URLSearchParams(window.location.search),
  );

  const updateAndSetSearchParams = useCallback(
    (newSearchParams: URLSearchParams) => {
      setSearchParams(newSearchParams);
      window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
    },
    [setSearchParams],
  );

  return [searchParams, updateAndSetSearchParams] as const;
}
