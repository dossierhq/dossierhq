import {
  EntityListScreen,
  EntitySearchStateUrlQuery,
} from '@jonasb/datadata-admin-react-components';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

//TODO fix type of EntitySearchStateUrlQuery in arc to work better with react-router
type EntitySearchStateUrlQueryRecord = Record<'query' | 'paging' | 'sampling', string>;

export function AdminEntitiesRoute() {
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
      setSearchParams(urlQuery as EntitySearchStateUrlQueryRecord);
    },
    [setSearchParams]
  );

  return (
    <EntityListScreen
      header={<NavBar current="admin-entities" />}
      urlQuery={urlQuery}
      onUrlQueryChanged={handleUrlQueryChanged}
      onCreateEntity={console.log}
      onOpenEntity={console.log}
    />
  );
}
