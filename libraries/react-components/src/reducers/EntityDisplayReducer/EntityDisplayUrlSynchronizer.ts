import type { Dispatch } from 'react';
import { useEffect } from 'react';
import type { EntityDisplayState, EntityDisplayStateAction } from './EntityDisplayReducer.js';
import { EntityDisplayActions, initializeEntityDisplayState } from './EntityDisplayReducer.js';

export function initializeEntityDisplayStateFromUrlQuery(
  urlSearchParams: Readonly<URLSearchParams> | undefined
): EntityDisplayState {
  const entityIds = urlQueryToEntityIds(urlSearchParams);
  return initializeEntityDisplayState(entityIds);
}

export function useSynchronizeUrlQueryAndEntityDisplayState(
  urlSearchParams: Readonly<URLSearchParams> | undefined,
  onUrlSearchParamsChange: ((urlSearchParams: Readonly<URLSearchParams>) => void) | undefined,
  entityDisplayState: EntityDisplayState,
  dispatchEntityDisplayState: Dispatch<EntityDisplayStateAction>
) {
  const { entityIds } = entityDisplayState;

  useEffect(() => {
    if (!onUrlSearchParamsChange || !urlSearchParams) return;
    const result = new URLSearchParams();
    for (const id of entityIds) {
      result.append('id', id);
    }
    if (urlSearchParams.toString() !== result.toString()) {
      onUrlSearchParamsChange(result);
    }
  }, [entityIds, onUrlSearchParamsChange, urlSearchParams]);

  useEffect(() => {
    if (!urlSearchParams) return;
    const entityIds = urlQueryToEntityIds(urlSearchParams);
    entityIds.forEach((id) => dispatchEntityDisplayState(new EntityDisplayActions.AddEntity(id)));
    if (entityIds.length > 0) {
      dispatchEntityDisplayState(
        new EntityDisplayActions.SetActiveEntity(entityIds[0], false, false)
      );
    }
  }, [dispatchEntityDisplayState, urlSearchParams]);

  // useDebugLogChangedValues('useSynchronizeUrlQueryAndEntityDisplayState', { entityIds });
}

function urlQueryToEntityIds(urlSearchParams: Readonly<URLSearchParams> | undefined) {
  const result = [];
  if (urlSearchParams) {
    result.push(...urlSearchParams.getAll('id'));
  }
  return result;
}
