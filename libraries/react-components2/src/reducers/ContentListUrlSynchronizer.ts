import {
  decodeURLSearchParamsParam,
  encodeURLSearchParams,
  type EntityQuery,
  type EntitySamplingOptions,
  type Paging,
  type PublishedEntityQuery,
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
    const result = new URLSearchParams();
    if (mode === 'full') {
      addContentListParamsToURLSearchParams(result, { mode, query, sampling, paging });
    } else {
      addContentListParamsToURLSearchParams(result, {
        mode,
        query: query as PublishedEntityQuery,
        sampling,
        paging,
      });
    }
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

export function addContentListParamsToURLSearchParams(
  urlSearchParams: URLSearchParams,
  options:
    | {
        mode: 'full';
        query?: EntityQuery;
        sampling?: EntitySamplingOptions;
        paging?: Paging;
      }
    | {
        mode: 'published';
        query?: PublishedEntityQuery;
        sampling?: EntitySamplingOptions;
        paging?: Paging;
      },
) {
  const params: Params = {
    query: getQueryWithoutDefaults(options.mode, options.query ?? {}),
    paging: options.paging,
    sampling: options.sampling,
  };
  encodeURLSearchParams(urlSearchParams, params);
}
