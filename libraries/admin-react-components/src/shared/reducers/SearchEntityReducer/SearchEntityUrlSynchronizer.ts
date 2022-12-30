import type { AdminSearchQuery, EntitySamplingOptions, Paging } from '@jonasb/datadata-core';
import {
  decodeObjectFromURLSearchParams,
  encodeObjectToURLSearchParams,
} from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useEffect } from 'react';
import type { SearchEntityState, SearchEntityStateAction } from './SearchEntityReducer.js';
import {
  getQueryWithoutDefaults,
  initializeSearchEntityState,
  SearchEntityStateActions,
} from './SearchEntityReducer.js';

interface Params {
  query: AdminSearchQuery;
  sampling: EntitySamplingOptions | undefined;
  paging: Paging | undefined;
}

export function initializeSearchEntityStateFromUrlQuery(
  urlSearchParams: Readonly<URLSearchParams> | undefined
): SearchEntityState {
  const actions = urlQueryToSearchEntityStateActions(urlSearchParams);
  return initializeSearchEntityState({ actions });
}

function urlQueryToSearchEntityStateActions(
  urlSearchParams: Readonly<URLSearchParams> | undefined
) {
  const actions = [];
  if (urlSearchParams) {
    const decoded = decodeObjectFromURLSearchParams<Params>(urlSearchParams);
    actions.push(
      new SearchEntityStateActions.SetQuery(decoded.query ?? {}, {
        partial: false,
        resetPagingIfModifying: false,
      })
    );

    if (decoded.sampling) {
      actions.push(new SearchEntityStateActions.SetSampling(decoded.sampling, false));
    }

    if (decoded.paging || !decoded.sampling) {
      actions.push(new SearchEntityStateActions.SetPaging(decoded.paging ?? {}));
    }
  }
  return actions;
}

export function useSynchronizeUrlQueryAndSearchEntityState(
  urlSearchParams: Readonly<URLSearchParams> | undefined,
  onUrlSearchParamsChange: ((urlSearchParams: Readonly<URLSearchParams>) => void) | undefined,
  searchEntityState: SearchEntityState,
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>
) {
  const { query, paging, sampling } = searchEntityState;
  useEffect(() => {
    if (!onUrlSearchParamsChange || !urlSearchParams) return;
    const params: Params = {
      query: getQueryWithoutDefaults(query),
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
