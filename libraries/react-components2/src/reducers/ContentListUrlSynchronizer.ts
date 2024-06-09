import {
  decodeURLSearchParamsParam,
  encodeObjectToURLSearchParams,
  type EntityQuery,
  type EntitySamplingOptions,
  type Paging,
} from '@dossierhq/core';
import { useEffect, useState } from 'react';
import {
  ContentListStateActions,
  getQueryWithoutDefaults,
  initializeContentListState,
  type ContentListState,
  type ContentListStateAction,
} from './ContentListReducer.js';

interface Params {
  query: EntityQuery;
  sampling: EntitySamplingOptions | undefined;
  paging: Paging | undefined;
}

export function initializeContentListStateFromUrlQuery({
  mode,
  urlSearchParams,
}: {
  mode: ContentListState['mode'];
  urlSearchParams: Readonly<URLSearchParams> | null | undefined;
}): ContentListState {
  const actions = urlQueryToContentListStateActions(urlSearchParams ?? null);
  return initializeContentListState({ mode, actions });
}

function urlQueryToContentListStateActions(urlSearchParams: Readonly<URLSearchParams> | null) {
  const actions: ContentListStateAction[] = [];
  if (urlSearchParams) {
    const query = decodeURLSearchParamsParam<Params['query']>(urlSearchParams, 'query');
    const sampling = decodeURLSearchParamsParam<Params['sampling']>(urlSearchParams, 'sampling');
    const paging = decodeURLSearchParamsParam<Params['paging']>(urlSearchParams, 'paging');

    actions.push(
      new ContentListStateActions.SetQuery(query ?? {}, {
        partial: false,
        resetPagingIfModifying: false,
      }),
    );

    if (sampling) {
      actions.push(new ContentListStateActions.SetSampling(sampling, false));
    }

    if (paging || !sampling) {
      actions.push(new ContentListStateActions.SetPaging(paging ?? {}));
    }
  }
  return actions;
}

export function useContentListCallOnUrlSearchQueryParamChange(
  mode: 'full' | 'published',
  searchEntityState: ContentListState,
  onUrlSearchParamsChange: ((urlSearchParams: Readonly<URLSearchParams>) => void) | undefined,
) {
  const [params, setParams] = useState<URLSearchParams | null>(null);

  const { query, paging, sampling } = searchEntityState;
  useEffect(() => {
    const params: Params = {
      query: getQueryWithoutDefaults(mode, query),
      paging,
      sampling,
    };
    const result = encodeObjectToURLSearchParams(params);
    setParams((oldParams) => {
      if (oldParams && oldParams.toString() === result.toString()) {
        return oldParams;
      }
      return result;
    });
  }, [mode, query, paging, sampling]);

  useEffect(() => {
    if (onUrlSearchParamsChange && params) {
      onUrlSearchParamsChange(params);
    }
  }, [onUrlSearchParamsChange, params]);

  // useDebugLogChangedValues('useSynchronizeUrlQueryState', { query, paging, sampling, sample, urlQuery });
}
