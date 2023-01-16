import { PublishedEntityDisplayScreen } from '@dossierhq/react-components';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar.js';

export function PublishedEntityDisplayRoute() {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSearchParamsChange = useCallback(
    (searchParams: URLSearchParams) => setSearchParams(searchParams, { replace: true }),
    [setSearchParams]
  );

  return (
    <PublishedEntityDisplayScreen
      header={<Navbar current="published-entities" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={handleSearchParamsChange}
    />
  );
}
