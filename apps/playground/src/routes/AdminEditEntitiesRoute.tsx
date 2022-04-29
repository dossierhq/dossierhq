import {
  AdminEntityEditorScreen,
  EntityEditorStateUrlQuery,
} from '@jonasb/datadata-admin-react-components';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

//TODO fix type of EntityEditorStateUrlQuery in arc to work better with react-router
type EntitySearchStateUrlQueryRecord = Record<'ids' | 'type', string>;

export function AdminEditEntitiesRoute() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = useMemo(() => {
    const result: EntityEditorStateUrlQuery = {};
    for (const [key, value] of searchParams.entries()) {
      result[key as keyof EntityEditorStateUrlQuery] = value;
    }
    return result;
  }, [searchParams]);

  const handleUrlQueryChange = useCallback(
    (urlQuery: EntityEditorStateUrlQuery) => {
      setSearchParams(urlQuery as EntitySearchStateUrlQueryRecord);
    },
    [setSearchParams]
  );

  return (
    <AdminEntityEditorScreen
      header={<NavBar current="admin-entities" />}
      urlQuery={urlQuery}
      onUrlQueryChange={handleUrlQueryChange}
    />
  );
}
