import type { EntitySearchStateUrlQuery } from '@jonasb/datadata-admin-react-components';
import { AdminEntityListScreen } from '@jonasb/datadata-admin-react-components';
import type { AdminEntity } from '@jonasb/datadata-core';
import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar.js';
import { ROUTE } from '../utils/RouteUtils.js';

export function AdminEntitiesRoute() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = useMemo(() => {
    const result: EntitySearchStateUrlQuery = {};
    for (const [key, value] of searchParams.entries()) {
      result[key as keyof EntitySearchStateUrlQuery] = value;
    }
    return result;
  }, [searchParams]);

  const handleUrlQueryChanged = useCallback(
    (urlQuery: EntitySearchStateUrlQuery) => {
      setSearchParams(urlQuery);
    },
    [setSearchParams]
  );

  const handleCreateEntity = useCallback(
    (type: string) =>
      navigate(ROUTE.editEntities.url([{ newType: type, id: crypto.randomUUID() }])),
    [navigate]
  );
  const handleEntityOpen = useCallback(
    (entity: AdminEntity) => navigate(ROUTE.editEntities.url([{ id: entity.id }])),
    [navigate]
  );

  return (
    <AdminEntityListScreen
      header={<NavBar current="admin-entities" />}
      urlQuery={urlQuery}
      onUrlQueryChanged={handleUrlQueryChanged}
      onCreateEntity={handleCreateEntity}
      onOpenEntity={handleEntityOpen}
    />
  );
}
