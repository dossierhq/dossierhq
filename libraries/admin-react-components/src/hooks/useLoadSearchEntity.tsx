import type { AdminQuery, Paging } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useContext } from 'react';
import type { SearchEntityStateAction } from '../index.js';
import {
  DataDataContext2,
  useSearchEntities,
  useTotalCount,
  useUpdateSearchEntityStateWithResponse,
} from '../index.js';

export function useLoadSearchEntity(
  query: AdminQuery,
  paging: Paging,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { adminClient } = useContext(DataDataContext2);
  const { connection, connectionError } = useSearchEntities(adminClient, query, paging);
  const { totalCount } = useTotalCount(adminClient, query);

  useUpdateSearchEntityStateWithResponse(
    connection,
    connectionError,
    totalCount,
    dispatchSearchEntityState
  );
}
