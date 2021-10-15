import type { AdminQuery, Paging } from '@jonasb/datadata-core';
import { decodeUrlQueryStringifiedParam, stringifyUrlQueryParams } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useEffect } from 'react';
import type { SearchEntityState, SearchEntityStateAction } from '../../index.js';
import {
  getQueryWithoutDefaults,
  initializeSearchEntityState,
  SearchEntityStateActions,
} from '../../index.js';

export interface EntitySearchStateUrlQuery {
  query?: string;
  paging?: string;
}

export function initializeSearchEntityStateFromUrlQuery(
  urlQuery: EntitySearchStateUrlQuery | undefined
): SearchEntityState {
  const actions = urlQueryToSearchEntityStateActions(urlQuery);
  return initializeSearchEntityState(actions);
}

function urlQueryToSearchEntityStateActions(urlQuery: EntitySearchStateUrlQuery | undefined) {
  const actions = [];
  if (urlQuery) {
    const decodedQuery: AdminQuery = decodeUrlQueryStringifiedParam('query', urlQuery) ?? {};
    actions.push(new SearchEntityStateActions.SetQuery(decodedQuery, false));
    const decodedPaging: Paging | undefined =
      decodeUrlQueryStringifiedParam('paging', urlQuery) ?? {};
    actions.push(new SearchEntityStateActions.SetPaging(decodedPaging));
  }
  return actions;
}

export function useSynchronizeUrlQueryAndSearchEntityState(
  urlQuery: EntitySearchStateUrlQuery | undefined,
  onUrlQueryChanged: ((urlQuery: EntitySearchStateUrlQuery) => void) | undefined,
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { query, paging } = searchEntityState;
  useEffect(() => {
    if (!onUrlQueryChanged || !urlQuery) return;
    const result: EntitySearchStateUrlQuery = stringifyUrlQueryParams({
      query: getQueryWithoutDefaults(query),
      paging,
    });
    if (result.paging !== urlQuery.paging || result.query !== urlQuery.query) {
      onUrlQueryChanged(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, paging]);

  useEffect(() => {
    if (!urlQuery) return;
    const actions = urlQueryToSearchEntityStateActions(urlQuery);
    actions.forEach((action) => dispatchSearchEntityState(action));
  }, [dispatchSearchEntityState, urlQuery]);

  // useDebugLogChangedValues('useSynchronizeUrlQueryState', { query, paging, urlQuery });
}
