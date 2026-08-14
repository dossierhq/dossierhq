import { PublishedContentListScreen } from '@dossierhq/react-components2';
import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar.js';

export function PublishedContentListRoute() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleEntityOpen = useCallback(
    (id: string) => navigate(`/published-content/display?id=${id}`),
    [navigate],
  );

  return (
    <PublishedContentListScreen
      header={<Navbar current="published-content" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={setSearchParams}
      onOpenEntity={handleEntityOpen}
    />
  );
}
