import {
  AdminEntityListScreen,
  EntitySearchStateUrlQuery,
} from '@jonasb/datadata-admin-react-components';
import { AdminEntity } from '@jonasb/datadata-core';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { usePrompt } from '../hooks/ReactRouterCompatHooks';
import { ROUTE } from '../utils/RouteUtils';

//TODO fix type of EntitySearchStateUrlQuery in arc to work better with react-router
type EntitySearchStateUrlQueryRecord = Record<'query' | 'paging' | 'sampling', string>;

export function AdminEntitiesRoute() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasChanges, setHasChanges] = useState(false);

  const urlQuery = useMemo(() => {
    const result: EntitySearchStateUrlQuery = {};
    for (const [key, value] of searchParams.entries()) {
      result[key as keyof EntitySearchStateUrlQuery] = value;
    }
    return result;
  }, [searchParams]);

  const handleUrlQueryChanged = useCallback(
    (urlQuery: EntitySearchStateUrlQuery) => {
      setSearchParams(urlQuery as EntitySearchStateUrlQueryRecord);
    },
    [setSearchParams]
  );

  const handleCreateEntity = useCallback(
    (type: string) =>
      navigate(ROUTE.editEntities.url([{ newType: type, id: crypto.randomUUID() }])),
    []
  );
  const handleEntityOpen = useCallback(
    (entity: AdminEntity) => navigate(ROUTE.editEntities.url([{ id: entity.id }])),
    []
  );

  usePrompt(
    'Changes to the schema will be lost, are you sure you want to leave the page?',
    hasChanges
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
