import type { Dispatch } from 'react';
import { useEffect } from 'react';
import type { EntityEditorState, EntityEditorStateAction } from './EntityEditorReducer';
import { EntityEditorActions } from './EntityEditorReducer';

export function useSynchronizeUrlQueryAndEntityEditorState(
  urlSearchParams: Readonly<URLSearchParams> | undefined,
  onUrlSearchParamsChange: ((urlSearchParams: Readonly<URLSearchParams>) => void) | undefined,
  entityEditorState: EntityEditorState,
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>
) {
  const { schema, drafts } = entityEditorState;
  const schemaIsLoaded = !!schema;

  useEffect(() => {
    if (!schemaIsLoaded || !onUrlSearchParamsChange || !urlSearchParams) return;
    const result = new URLSearchParams();
    for (const id of drafts.map((it) => it.id)) {
      result.append('id', id);
    }
    if (urlSearchParams.toString() !== result.toString()) {
      onUrlSearchParamsChange(result);
    }
  }, [schemaIsLoaded, drafts, onUrlSearchParamsChange, urlSearchParams]);

  useEffect(() => {
    if (!schemaIsLoaded || !urlSearchParams) return;
    const actions = urlQueryToSearchEntityStateActions(urlSearchParams);
    actions.forEach((action) => dispatchEntityEditorState(action));
  }, [schemaIsLoaded, dispatchEntityEditorState, urlSearchParams]);

  // useDebugLogChangedValues('useSynchronizeUrlQueryAndEntityEditorState', { query, paging, sampling, sample, urlQuery });
}

function urlQueryToSearchEntityStateActions(
  urlSearchParams: Readonly<URLSearchParams> | undefined
) {
  const actions = [];
  if (urlSearchParams) {
    for (const type of urlSearchParams.getAll('type')) {
      actions.push(new EntityEditorActions.AddDraft({ newType: type }));
    }
    for (const id of urlSearchParams.getAll('id')) {
      actions.push(new EntityEditorActions.AddDraft({ id }));
    }
  }
  return actions;
}
