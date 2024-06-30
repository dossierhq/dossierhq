import type { EntityQuery, EntityReference, EntitySamplingOptions, Paging } from '@dossierhq/core';
import { useEffect, useState } from 'react';
import type { ContentListState } from './ContentListReducer.js';
import { addContentListParamsToURLSearchParams } from './ContentListUrlSynchronizer.js';
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
  contentListState: ContentListState,
  entityEditorState: EntityEditorState,
  onUrlSearchParamsChange: ((urlSearchParams: Readonly<URLSearchParams>) => void) | undefined,
) {
  const [params, setParams] = useState<URLSearchParams | null>(null);

  const { drafts } = entityEditorState;
  useEffect(() => {
    const result = new URLSearchParams();
    addContentEditorParamsToURLSearchParams(result, {
      query: contentListState.query,
      sampling: contentListState.sampling,
      paging: contentListState.paging,
      entities: drafts.map((draftState) => {
        return draftState.isNew
          ? { id: draftState.id, type: draftState.draft?.entitySpec.name, isNew: true }
          : { id: draftState.id };
      }),
    });
    setParams((oldParams) => {
      if (oldParams && oldParams.toString() === result.toString()) {
        return oldParams;
      }
      return result;
    });
  }, [contentListState.paging, contentListState.query, contentListState.sampling, drafts]);

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

export function addContentEditorParamsToURLSearchParams(
  urlSearchParams: URLSearchParams,
  options: {
    query?: EntityQuery;
    sampling?: EntitySamplingOptions;
    paging?: Paging;
    entities?: (EntityReference | { type: string; id: string; isNew: true })[];
  },
) {
  if (options.entities) {
    for (const entity of options.entities) {
      if ('isNew' in entity) {
        urlSearchParams.append('new', `${entity.type}:${entity.id}`);
      } else {
        urlSearchParams.append('id', entity.id);
      }
    }
  }

  addContentListParamsToURLSearchParams(urlSearchParams, { mode: 'full', ...options });
}
