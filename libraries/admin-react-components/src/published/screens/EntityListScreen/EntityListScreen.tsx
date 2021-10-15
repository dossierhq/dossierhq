import type { Entity, Query } from '@jonasb/datadata-core';
import { FullscreenContainer } from '@jonasb/datadata-design';
import React, { useContext, useEffect, useReducer } from 'react';
import type { EntitySearchStateUrlQuery } from '../../index.js';
import {
  EntityList,
  EntityTypeSelector,
  EntityTypeTagSelector,
  initializeEntityTypeSelectorState,
  initializeSearchEntityStateFromUrlQuery,
  PublishedDataDataContext,
  reduceEntityTypeSelectorState,
  reduceSearchEntityState,
  SearchEntityPagingButtons,
  SearchEntityPagingCount,
  SearchEntitySearchInput,
  SearchEntityStateActions,
  useLoadSearchEntity,
  useSynchronizeUrlQueryAndSearchEntityState,
} from '../../index.js';

export interface EntityListScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  urlQuery?: EntitySearchStateUrlQuery;
  onUrlQueryChanged?: (urlQuery: EntitySearchStateUrlQuery) => void;
  onOpenEntity: (entity: Entity) => void;
}

export function EntityListScreen({
  header,
  footer,
  urlQuery,
  onUrlQueryChanged,
  onOpenEntity,
}: EntityListScreenProps): JSX.Element | null {
  const { schema } = useContext(PublishedDataDataContext);
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    urlQuery,
    initializeSearchEntityStateFromUrlQuery
  );

  const [entityTypeFilterState, dispatchEntityTypeFilter] = useReducer(
    reduceEntityTypeSelectorState,
    { selectedIds: searchEntityState.query.entityTypes },
    initializeEntityTypeSelectorState
  );

  // sync entity type filter -> search state
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery(
        { entityTypes: entityTypeFilterState.selectedIds },
        true
      )
    );
  }, [entityTypeFilterState.selectedIds]);

  // sync url <-> search entity state
  useSynchronizeUrlQueryAndSearchEntityState(
    urlQuery,
    onUrlQueryChanged,
    searchEntityState,
    dispatchSearchEntityState
  );

  useLoadSearchEntity(
    searchEntityState.query as Query,
    searchEntityState.paging,
    dispatchSearchEntityState
  );

  // useDebugLogChangedValues('EntityList changed props', { header, footer, onCreateEntity, onOpenEntity, searchEntityState, dispatchSearchEntityState, entityTypeFilterState, dispatchEntityTypeFilter, });

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        <SearchEntitySearchInput {...{ searchEntityState, dispatchSearchEntityState }} />
        <EntityTypeSelector
          schema={schema}
          state={entityTypeFilterState}
          dispatch={dispatchEntityTypeFilter}
        >
          Entity type
        </EntityTypeSelector>
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row>
          <EntityTypeTagSelector
            state={entityTypeFilterState}
            dispatch={dispatchEntityTypeFilter}
          />
          <EntityList
            {...{ searchEntityState, dispatchSearchEntityState }}
            onItemClick={onOpenEntity}
          />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      <FullscreenContainer.Row
        paddingVertical={2}
        columnGap={2}
        flexDirection="row"
        alignItems="center"
      >
        <SearchEntityPagingButtons {...{ searchEntityState, dispatchSearchEntityState }} />
        <SearchEntityPagingCount {...{ searchEntityState, dispatchSearchEntityState }} />
      </FullscreenContainer.Row>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}
