import type { PublishedEntity } from '@dossierhq/core';
import { assertIsDefined } from '@dossierhq/core';
import { PublishedEntityListScreen } from '@dossierhq/react-components';
import { useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar.js';
import { ROUTE } from '../utils/RouteUtils.js';

export function PublishedEntitiesRoute() {
  const navigate = useNavigate();
  const { serverName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  assertIsDefined(serverName);

  const handleEntityOpen = useCallback(
    (entity: PublishedEntity) => navigate(ROUTE.publishedEntityDisplay.url(serverName, entity.id)),
    [navigate, serverName]
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
