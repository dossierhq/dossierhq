import { PublishedEntityListScreen } from '@dossierhq/react-components';
import type { PublishedEntity } from '@dossierhq/core';
import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar.js';
import { ROUTE } from '../utils/RouteUtils.js';

export function PublishedEntitiesRoute() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleEntityOpen = useCallback(
    (entity: PublishedEntity) => navigate(ROUTE.publishedEntityDisplay.url(entity.id)),
    [navigate]
  );

  return (
    <PublishedEntityListScreen
      header={<NavBar current="published-entities" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={setSearchParams}
      onOpenEntity={handleEntityOpen}
    />
  );
}
