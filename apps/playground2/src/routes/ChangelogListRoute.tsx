import { ChangelogListScreen, ThemeProvider } from '@dossierhq/react-components2';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function ChangelogListRoute() {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSearchParamsChange = useCallback(
    (searchParams: URLSearchParams) => setSearchParams(searchParams, { replace: true }),
    [setSearchParams],
  );

  return (
    <ThemeProvider>
      <ChangelogListScreen
        urlSearchParams={searchParams}
        onUrlSearchParamsChange={handleSearchParamsChange}
      />
    </ThemeProvider>
  );
}
