import type { PublishedEntity } from '@dossierhq/core';
import { PublishedContentListScreen } from '@dossierhq/react-components';
import { useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar.js';
import { assertIsDefined } from '../utils/AssertUtils.js';
import { ROUTE } from '../utils/RouteUtils.js';

export function PublishedContentListRoute() {
  const navigate = useNavigate();
  const { serverName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  assertIsDefined(serverName);

  const handleEntityOpen = useCallback(
    (entity: PublishedEntity) => navigate(ROUTE.publishedContentDisplay.url(serverName, entity.id)),
    [navigate, serverName],
  );

  return (
    <PublishedContentListScreen
      header={<NavBar current="published-content" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={setSearchParams}
      onOpenEntity={handleEntityOpen}
    />
  );
}
