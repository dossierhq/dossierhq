import { PublishedContentDisplayScreen } from '@dossierhq/react-components';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar.js';

export function PublishedContentDisplayRoute() {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSearchParamsChange = useCallback(
    (searchParams: URLSearchParams) => setSearchParams(searchParams, { replace: true }),
    [setSearchParams],
  );

  return (
    <PublishedContentDisplayScreen
      header={<NavBar current="published-content" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={handleSearchParamsChange}
    />
  );
}
