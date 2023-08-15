import {
  decodeURLSearchParamsParam,
  encodeObjectToURLSearchParams,
  type ChangelogQuery,
  type Paging,
} from '@dossierhq/core';
import { useEffect, type Dispatch } from 'react';
import {
  ChangelogStateActions,
  getQueryWithoutDefaults,
  initializeChangelogState,
  type ChangelogState,
  type ChangelogStateAction,
} from './ChangelogReducer.js';

interface Params {
  query: ChangelogQuery;
  paging: Paging | undefined;
}

export function initializeChangelogStateFromUrlQuery(
  urlSearchParams: Readonly<URLSearchParams> | undefined,
): ChangelogState {
  const actions = urlQueryToChangelogStateActions(urlSearchParams);
  return initializeChangelogState({ actions });
}

function urlQueryToChangelogStateActions(urlSearchParams: Readonly<URLSearchParams> | undefined) {
  const actions = [];
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

export function useSynchronizeUrlQueryAndChangelogState(
  urlSearchParams: Readonly<URLSearchParams> | undefined,
  onUrlSearchParamsChange: ((urlSearchParams: Readonly<URLSearchParams>) => void) | undefined,
  changelogState: ChangelogState,
  dispatchChangelogState: Dispatch<ChangelogStateAction>,
) {
  const { query, paging } = changelogState;
  useEffect(() => {
    if (!onUrlSearchParamsChange || !urlSearchParams) return;
    const params: Params = {
      query: getQueryWithoutDefaults(query),
      paging,
    };
    const result = encodeObjectToURLSearchParams(params);
    if (urlSearchParams.toString() !== result.toString()) {
      onUrlSearchParamsChange(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, paging]);

  useEffect(() => {
    if (!urlSearchParams) return;
    const actions = urlQueryToChangelogStateActions(urlSearchParams);
    actions.forEach((action) => dispatchChangelogState(action));
  }, [dispatchChangelogState, urlSearchParams]);

  // useDebugLogChangedValues('useSynchronizeUrlQueryAndChangelogState', { query, paging, urlQuery });
}
