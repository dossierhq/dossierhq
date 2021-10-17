import type { AdminEntity, AdminQuery, Entity } from '@jonasb/datadata-core';
import { FullscreenContainer, IconButton, toSizeClassName } from '@jonasb/datadata-design';
import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import type { EntitySearchStateUrlQuery } from '../../index.js';
import {
  DataDataContext2,
  EntityList2,
  EntityMap2,
  EntityTypeSelector,
  EntityTypeTagSelector,
  initializeEntityTypeSelectorState,
  initializeSearchEntityStateFromUrlQuery,
  reduceEntityTypeSelectorState,
  reduceSearchEntityState,
  SearchEntityPagingButtons,
  SearchEntityPagingCount,
  SearchEntitySearchInput,
  SearchEntityStateActions,
  TypePicker2,
  useLoadSearchEntity,
  useSynchronizeUrlQueryAndSearchEntityState,
} from '../../index.js';

export interface EntityListScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  urlQuery?: EntitySearchStateUrlQuery;
  onUrlQueryChanged?: (urlQuery: EntitySearchStateUrlQuery) => void;
  onCreateEntity: (entityType: string) => void;
  onOpenEntity: (entity: AdminEntity) => void;
}

export function EntityListScreen({
  header,
  footer,
  urlQuery,
  onUrlQueryChanged,
  onCreateEntity,
  onOpenEntity,
}: EntityListScreenProps): JSX.Element | null {
  const { schema } = useContext(DataDataContext2);
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

  const [showMap, setShowMap] = useState(!!searchEntityState.query.boundingBox);

  const handleToggleShowMap = useCallback(() => {
    if (showMap) {
      dispatchSearchEntityState(
        new SearchEntityStateActions.SetQuery({ boundingBox: undefined }, true)
      );
    }
    setShowMap(!showMap);
  }, [showMap]);

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
    searchEntityState.query as AdminQuery,
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
        <IconButton icon={showMap ? 'map' : 'list'} onClick={handleToggleShowMap} />
        <TypePicker2 iconLeft="add" showEntityTypes onTypeSelected={onCreateEntity}>
          Create
        </TypePicker2>
      </FullscreenContainer.Row>
      {showMap ? (
        <FullscreenContainer.Row fillHeight fullWidth>
          <EntityMap2
            className={toSizeClassName({ height: '100%' })}
            {...{ searchEntityState, dispatchSearchEntityState }}
            onItemClick={onOpenEntity as (item: AdminEntity | Entity) => void}
          />
        </FullscreenContainer.Row>
      ) : (
        <FullscreenContainer.ScrollableRow>
          <FullscreenContainer.Row>
            <EntityTypeTagSelector
              state={entityTypeFilterState}
              dispatch={dispatchEntityTypeFilter}
            />
            <EntityList2
              {...{ searchEntityState, dispatchSearchEntityState }}
              onItemClick={onOpenEntity}
            />
          </FullscreenContainer.Row>
        </FullscreenContainer.ScrollableRow>
      )}
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
