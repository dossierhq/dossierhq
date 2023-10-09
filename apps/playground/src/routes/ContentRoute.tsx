import type { AdminEntity } from '@dossierhq/core';
import { AdminEntityListScreen } from '@dossierhq/react-components';
import { useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar.js';
import { assertIsDefined } from '../utils/AssertUtils.js';
import { ROUTE } from '../utils/RouteUtils.js';

export function ContentRoute() {
  const navigate = useNavigate();
  const { serverName } = useParams<{ serverName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  assertIsDefined(serverName);

  const handleCreateEntity = useCallback(
    (type: string) =>
      navigate(ROUTE.editEntities.url(serverName, [{ newType: type, id: crypto.randomUUID() }])),
    [navigate, serverName]
  );
  const handleEntityOpen = useCallback(
    (entity: AdminEntity) => navigate(ROUTE.editEntities.url(serverName, [{ id: entity.id }])),
    [navigate, serverName]
  );

  return (
    <AdminEntityListScreen
      header={<NavBar current="content" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={setSearchParams}
      onCreateEntity={handleCreateEntity}
      onOpenEntity={handleEntityOpen}
    />
  );
}
