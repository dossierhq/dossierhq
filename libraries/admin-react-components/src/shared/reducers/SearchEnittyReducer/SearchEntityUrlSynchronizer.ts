import type { AdminSearchQuery, EntitySamplingOptions, Paging } from '@jonasb/datadata-core';
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
  sampling?: string;
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
    const decodedQuery: AdminSearchQuery = decodeUrlQueryStringifiedParam('query', urlQuery) ?? {};
    actions.push(new SearchEntityStateActions.SetQuery(decodedQuery, false));

    const decodedSampling: EntitySamplingOptions | undefined = decodeUrlQueryStringifiedParam(
      'sampling',
      urlQuery
    );
    if (decodedSampling) {
      actions.push(new SearchEntityStateActions.SetSampling(decodedSampling, false));
    }

    const decodedPaging: Paging | undefined = decodeUrlQueryStringifiedParam('paging', urlQuery);
    if (decodedPaging || !decodedSampling) {
      actions.push(new SearchEntityStateActions.SetPaging(decodedPaging ?? {}));
    }
  }
  return actions;
}

export function useSynchronizeUrlQueryAndSearchEntityState(
  urlQuery: EntitySearchStateUrlQuery | undefined,
  onUrlQueryChanged: ((urlQuery: EntitySearchStateUrlQuery) => void) | undefined,
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { query, paging, sampling } = searchEntityState;
  useEffect(() => {
    if (!onUrlQueryChanged || !urlQuery) return;
    const result: EntitySearchStateUrlQuery = stringifyUrlQueryParams({
      query: getQueryWithoutDefaults(query),
      paging,
      sampling,
    });
    if (
      result.paging !== urlQuery.paging ||
      result.query !== urlQuery.query ||
      result.sampling !== urlQuery.sampling
    ) {
      onUrlQueryChanged(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, paging, sampling]);

  useEffect(() => {
    if (!urlQuery) return;
    const actions = urlQueryToSearchEntityStateActions(urlQuery);
    actions.forEach((action) => dispatchSearchEntityState(action));
  }, [dispatchSearchEntityState, urlQuery]);

  // useDebugLogChangedValues('useSynchronizeUrlQueryState', { query, paging, sampling, sample, urlQuery });
}
