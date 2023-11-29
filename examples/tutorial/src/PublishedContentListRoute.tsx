import type { PublishedEntity } from '@dossierhq/core';
import { PublishedContentListScreen } from '@dossierhq/react-components';
import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar.js';

export function PublishedContentListRoute() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleEntityOpen = useCallback(
    (entity: PublishedEntity) => navigate(`/published-content/display?id=${entity.id}`),
    [navigate]
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
