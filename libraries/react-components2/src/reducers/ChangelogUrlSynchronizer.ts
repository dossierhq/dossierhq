import {
  decodeURLSearchParamsParam,
  encodeURLSearchParams,
  type ChangelogEventQuery,
  type Paging,
} from '@dossierhq/core';
import { useEffect, useState } from 'react';
import {
  ChangelogStateActions,
  getQueryWithoutDefaults,
  initializeChangelogState,
  type ChangelogState,
  type ChangelogStateAction,
} from './ChangelogReducer.js';

interface Params {
  query: ChangelogEventQuery;
  paging: Paging | undefined;
}

export function initializeChangelogStateFromUrlQuery(
  urlSearchParams: Readonly<URLSearchParams> | null | undefined,
): ChangelogState {
  const actions = urlQueryToChangelogStateActions(urlSearchParams ?? null);
  return initializeChangelogState({ actions });
}

function urlQueryToChangelogStateActions(urlSearchParams: Readonly<URLSearchParams> | null) {
  const actions: ChangelogStateAction[] = [];
  if (urlSearchParams) {
    const query = decodeURLSearchParamsParam<Params['query']>(urlSearchParams, 'query');
    const paging = decodeURLSearchParamsParam<Params['paging']>(urlSearchParams, 'paging');

    actions.push(
      new ChangelogStateActions.SetQuery(query ?? {}, {
        partial: false,
        resetPagingIfModifying: false,
      }),
    );

    if (paging) {
      actions.push(new ChangelogStateActions.SetPaging(paging));
    }
  }
  return actions;
}

export function useChangelogCallOnUrlSearchQueryParamChange(
  changelogState: ChangelogState,
  onUrlSearchParamsChange: ((urlSearchParams: Readonly<URLSearchParams>) => void) | undefined,
) {
  const [params, setParams] = useState<URLSearchParams | null>(null);

  const { query, paging } = changelogState;
  useEffect(() => {
    const result = new URLSearchParams();
    addChangelogParamsToURLSearchParams(result, { query, paging });
    // TODO resolve eslint error
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParams((oldParams) => {
      if (oldParams && oldParams.toString() === result.toString()) {
        return oldParams;
      }
      return result;
    });
  }, [query, paging]);

  useEffect(() => {
    if (onUrlSearchParamsChange && params) {
      onUrlSearchParamsChange(params);
    }
  }, [onUrlSearchParamsChange, params]);
}

export function addChangelogParamsToURLSearchParams(
  urlSearchParams: URLSearchParams,
  options: {
    query?: ChangelogEventQuery;
    paging?: Paging;
  },
) {
  const params: Params = {
    query: getQueryWithoutDefaults(options.query ?? {}),
    paging: options.paging,
  };
  encodeURLSearchParams(urlSearchParams, params);
}
