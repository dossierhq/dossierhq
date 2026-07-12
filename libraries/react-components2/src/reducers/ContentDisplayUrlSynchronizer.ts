import { useEffect, useState } from 'react';
import {
  initializeContentDisplayState,
  type ContentDisplayState,
} from './ContentDisplayReducer.js';

export function initializeContentDisplayStateFromUrlQuery(
  urlSearchParams: Readonly<URLSearchParams> | null | undefined,
): ContentDisplayState {
  const entityIds = urlQueryToEntityIds(urlSearchParams);
  return initializeContentDisplayState(entityIds);
}

function urlQueryToEntityIds(urlSearchParams: Readonly<URLSearchParams> | null | undefined) {
  const result: string[] = [];
  if (urlSearchParams) {
    result.push(...urlSearchParams.getAll('id'));
  }
  return result;
}

export function useContentDisplayCallOnUrlSearchQueryParamChange(
  contentDisplayState: ContentDisplayState,
  onUrlSearchParamsChange: ((urlSearchParams: Readonly<URLSearchParams>) => void) | undefined,
) {
  const [params, setParams] = useState<URLSearchParams | null>(null);

  const { entityIds } = contentDisplayState;
  useEffect(() => {
    const result = new URLSearchParams();
    addContentDisplayParamsToURLSearchParams(result, { entityIds });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParams((oldParams) => {
      if (oldParams && oldParams.toString() === result.toString()) {
        return oldParams;
      }
      return result;
    });
  }, [entityIds]);

  useEffect(() => {
    if (onUrlSearchParamsChange && params) {
      onUrlSearchParamsChange(params);
    }
  }, [onUrlSearchParamsChange, params]);
}

export function addContentDisplayParamsToURLSearchParams(
  urlSearchParams: URLSearchParams,
  options: { entityIds: string[] },
) {
  for (const id of options.entityIds) {
    urlSearchParams.append('id', id);
  }
}
