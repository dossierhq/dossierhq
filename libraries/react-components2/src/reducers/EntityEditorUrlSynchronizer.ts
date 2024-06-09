import { useEffect, useState } from 'react';
import {
  EntityEditorActions,
  initializeEntityEditorState,
  type EntityEditorState,
} from './EntityEditorReducer.js';

export function initializeEditorEntityStateFromUrlQuery(
  urlSearchParams: Readonly<URLSearchParams> | null,
): EntityEditorState {
  const actions = urlQueryToSearchEntityStateActions(urlSearchParams);
  return initializeEntityEditorState({ actions });
}

export function useEntityEditorCallOnUrlSearchQueryParamChange(
  entityEditorState: EntityEditorState,
  onUrlSearchParamsChange: ((urlSearchParams: Readonly<URLSearchParams>) => void) | undefined,
) {
  const [params, setParams] = useState<URLSearchParams | null>(null);

  const { drafts } = entityEditorState;
  useEffect(() => {
    const result = new URLSearchParams();
    for (const id of drafts.map((it) => it.id)) {
      result.append('id', id);
    }
    setParams((oldParams) => {
      if (oldParams && oldParams.toString() === result.toString()) {
        return oldParams;
      }
      return result;
    });
  }, [drafts]);

  useEffect(() => {
    if (onUrlSearchParamsChange && params) {
      onUrlSearchParamsChange(params);
    }
  }, [onUrlSearchParamsChange, params]);
}

function urlQueryToSearchEntityStateActions(urlSearchParams: Readonly<URLSearchParams> | null) {
  const actions = [];
  if (urlSearchParams) {
    for (const newTypeId of urlSearchParams.getAll('new')) {
      const parts = newTypeId.split(':');
      if (parts.length === 2) {
        const [newType, id] = parts;
        actions.push(new EntityEditorActions.AddDraft({ newType, id }));
      }
    }
    for (const id of urlSearchParams.getAll('id')) {
      actions.push(new EntityEditorActions.AddDraft({ id }));
    }
  }
  return actions;
}
