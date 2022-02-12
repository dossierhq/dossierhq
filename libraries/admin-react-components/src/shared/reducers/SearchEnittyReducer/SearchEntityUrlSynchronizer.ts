import type { AdminQuery, EntitySamplingOptions, Paging } from '@jonasb/datadata-core';
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
  sample?: string;
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

    const decodedPaging: Paging = decodeUrlQueryStringifiedParam('paging', urlQuery) ?? {};
    actions.push(new SearchEntityStateActions.SetPaging(decodedPaging));

    const decodedSampling: EntitySamplingOptions =
      decodeUrlQueryStringifiedParam('sampling', urlQuery) ?? {};
    actions.push(new SearchEntityStateActions.SetSampling(decodedSampling));

    const decodedSample: boolean | undefined =
      decodeUrlQueryStringifiedParam('sample', urlQuery) ?? false;
    actions.push(new SearchEntityStateActions.SetSample(decodedSample));
  }
  return actions;
}

export function useSynchronizeUrlQueryAndSearchEntityState(
  urlQuery: EntitySearchStateUrlQuery | undefined,
  onUrlQueryChanged: ((urlQuery: EntitySearchStateUrlQuery) => void) | undefined,
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { query, paging, sampling, sample } = searchEntityState;
  useEffect(() => {
    if (!onUrlQueryChanged || !urlQuery) return;
    const result: EntitySearchStateUrlQuery = stringifyUrlQueryParams({
      query: getQueryWithoutDefaults(query),
      paging,
      sampling,
      sample,
    });
    if (
      result.paging !== urlQuery.paging ||
      result.query !== urlQuery.query ||
      result.sampling !== urlQuery.sampling ||
      result.sample !== urlQuery.sample
    ) {
      onUrlQueryChanged(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, paging, sampling, sample]);

  useEffect(() => {
    if (!urlQuery) return;
    const actions = urlQueryToSearchEntityStateActions(urlQuery);
    actions.forEach((action) => dispatchSearchEntityState(action));
  }, [dispatchSearchEntityState, urlQuery]);

  // useDebugLogChangedValues('useSynchronizeUrlQueryState', { query, paging, sampling, sample, urlQuery });
}
