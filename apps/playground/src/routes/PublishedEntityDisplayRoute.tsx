import { PublishedEntityDisplayScreen } from '@jonasb/datadata-admin-react-components';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar.js';

export function PublishedEntityDisplayRoute() {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSearchParamsChange = useCallback(
    (searchParams: URLSearchParams) => setSearchParams(searchParams, { replace: true }),
    [setSearchParams]
  );

  return (
    <PublishedEntityDisplayScreen
      header={<NavBar current="published-entities" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={handleSearchParamsChange}
    />
  );
}
