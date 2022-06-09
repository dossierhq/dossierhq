import type { EntitySearchStateUrlQuery } from '@jonasb/datadata-admin-react-components';
import { PublishedEntityListScreen } from '@jonasb/datadata-admin-react-components';
import type { PublishedEntity } from '@jonasb/datadata-core';
import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { ROUTE } from '../utils/RouteUtils';

//TODO fix type of EntitySearchStateUrlQuery in arc to work better with react-router
type EntitySearchStateUrlQueryRecord = Record<'query' | 'paging' | 'sampling', string>;

export function PublishedEntitiesRoute() {
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
    (urlQuery: EntitySearchStateUrlQuery) =>
      setSearchParams(urlQuery as EntitySearchStateUrlQueryRecord),
    [setSearchParams]
  );

  const handleEntityOpen = useCallback(
    (entity: PublishedEntity) => navigate(ROUTE.publishedEntityDisplay.url(entity.id)),
    [navigate]
  );

  return (
    <PublishedEntityListScreen
      header={<NavBar current="published-entities" />}
      urlQuery={urlQuery}
      onUrlQueryChanged={handleUrlQueryChanged}
      onOpenEntity={handleEntityOpen}
    />
  );
}
