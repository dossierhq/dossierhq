import {
  decodeURLSearchParamsParam,
  encodeObjectToURLSearchParams,
  type AdminSearchQuery,
  type EntitySamplingOptions,
  type Paging,
} from '@dossierhq/core';
import { useEffect, type Dispatch } from 'react';
import {
  SearchEntityStateActions,
  getQueryWithoutDefaults,
  initializeSearchEntityState,
  type SearchEntityState,
  type SearchEntityStateAction,
} from './SearchEntityReducer.js';

interface Params {
  query: AdminSearchQuery;
  sampling: EntitySamplingOptions | undefined;
  paging: Paging | undefined;
}

export function initializeSearchEntityStateFromUrlQuery({
  mode,
  urlSearchParams,
}: {
  mode: SearchEntityState['mode'];
  urlSearchParams: Readonly<URLSearchParams> | undefined;
}): SearchEntityState {
  const actions = urlQueryToSearchEntityStateActions(urlSearchParams);
  return initializeSearchEntityState({ mode, actions });
}

function urlQueryToSearchEntityStateActions(
  urlSearchParams: Readonly<URLSearchParams> | undefined,
) {
  const actions = [];
  if (urlSearchParams) {
    const query = decodeURLSearchParamsParam<Params['query']>(urlSearchParams, 'query');
    const sampling = decodeURLSearchParamsParam<Params['sampling']>(urlSearchParams, 'sampling');
    const paging = decodeURLSearchParamsParam<Params['paging']>(urlSearchParams, 'paging');

    actions.push(
      new SearchEntityStateActions.SetQuery(query ?? {}, {
        partial: false,
        resetPagingIfModifying: false,
      }),
    );

    if (sampling) {
      actions.push(new SearchEntityStateActions.SetSampling(sampling, false));
    }

    if (paging || !sampling) {
      actions.push(new SearchEntityStateActions.SetPaging(paging ?? {}));
    }
  }
  return actions;
}

export function useSynchronizeUrlQueryAndSearchEntityState(
  mode: 'admin' | 'published',
  urlSearchParams: Readonly<URLSearchParams> | undefined,
  onUrlSearchParamsChange: ((urlSearchParams: Readonly<URLSearchParams>) => void) | undefined,
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>,
) {
  const { query, paging, sampling } = searchEntityState;
  useEffect(() => {
    if (!onUrlSearchParamsChange || !urlSearchParams) return;
    const params: Params = {
      query: getQueryWithoutDefaults(mode, query),
      paging,
      sampling,
    };
    const result = encodeObjectToURLSearchParams(params);
    if (urlSearchParams.toString() !== result.toString()) {
      onUrlSearchParamsChange(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, paging, sampling]);

  useEffect(() => {
    if (!urlSearchParams) return;
    const actions = urlQueryToSearchEntityStateActions(urlSearchParams);
    actions.forEach((action) => dispatchSearchEntityState(action));
  }, [dispatchSearchEntityState, urlSearchParams]);

  // useDebugLogChangedValues('useSynchronizeUrlQueryState', { query, paging, sampling, sample, urlQuery });
}
