import { decodeUrlQueryStringifiedParam, stringifyUrlQueryParams } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import { useEffect } from 'react';
import type { EntityEditorState, EntityEditorStateAction } from './EntityEditorReducer';
import { EntityEditorActions } from './EntityEditorReducer';

export interface EntityEditorStateUrlQuery {
  type?: string;
  ids?: string;
}

export function useSynchronizeUrlQueryAndEntityEditorState(
  urlQuery: EntityEditorStateUrlQuery | undefined,
  onUrlQueryChange: ((urlQuery: EntityEditorStateUrlQuery) => void) | undefined,
  entityEditorState: EntityEditorState,
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>
) {
  const { drafts } = entityEditorState;
  const idString = drafts.map((it) => it.id).join(',');
  useEffect(() => {
    if (!onUrlQueryChange || !urlQuery) return;
    const result: EntityEditorStateUrlQuery = stringifyUrlQueryParams({
      ids: drafts.map((it) => it.id),
    });
    if (result.ids !== urlQuery.ids || result.type !== urlQuery.type) {
      onUrlQueryChange(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idString]);

  useEffect(() => {
    if (!urlQuery) return;
    const actions = urlQueryToSearchEntityStateActions(urlQuery);
    actions.forEach((action) => dispatchEntityEditorState(action));
  }, [dispatchEntityEditorState, urlQuery]);

  // useDebugLogChangedValues('useSynchronizeUrlQueryAndEntityEditorState', { query, paging, sampling, sample, urlQuery });
}

function urlQueryToSearchEntityStateActions(urlQuery: EntityEditorStateUrlQuery | undefined) {
  const actions = [];
  if (urlQuery) {
    const type: string | undefined = decodeUrlQueryStringifiedParam('type', urlQuery);
    if (type) {
      actions.push(new EntityEditorActions.AddDraft({ newType: type }));

      const ids: string[] = decodeUrlQueryStringifiedParam('ids', urlQuery) ?? [];
      for (const id of ids) {
        actions.push(new EntityEditorActions.AddDraft({ id }));
      }
    }
  }
  return actions;
}
