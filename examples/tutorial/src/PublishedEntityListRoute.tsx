import { PublishedEntityListScreen } from '@dossierhq/react-components';
import type { PublishedEntity } from '@dossierhq/core';
import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar.js';

export function PublishedEntityListRoute() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleEntityOpen = useCallback(
    (entity: PublishedEntity) => navigate(`/published-entities/display?id=${entity.id}`),
    [navigate]
  );

  return (
    <PublishedEntityListScreen
      header={<Navbar current="published-entities" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={setSearchParams}
      onOpenEntity={handleEntityOpen}
    />
  );
}
