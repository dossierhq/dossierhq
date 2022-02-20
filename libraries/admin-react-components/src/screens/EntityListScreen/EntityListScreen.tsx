import type { AdminEntity, AdminQuery } from '@jonasb/datadata-core';
import { FullscreenContainer, IconButton, toSizeClassName } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import type {
  EntitySearchStateUrlQuery,
  SearchEntityState,
  SearchEntityStateAction,
} from '../../index.js';
import {
  AuthKeySelector,
  AuthKeyTagSelector,
  DataDataContext2,
  EntityList2,
  EntityMap2,
  EntityMapMarker,
  EntityTypeSelector,
  EntityTypeTagSelector,
  initializeAuthKeySelectorState,
  initializeEntityTypeSelectorState,
  initializeSearchEntityStateFromUrlQuery,
  initializeStatusSelectorState,
  reduceAuthKeySelectorState,
  reduceEntityTypeSelectorState,
  reduceSearchEntityState,
  reduceStatusSelectorState,
  SampleEntitiesOptionsCount,
  SearchEntityPagingButtons,
  SearchEntityPagingCount,
  SearchEntitySearchInput,
  SearchEntityStateActions,
  StatusSelector,
  StatusTagSelector,
  TypePicker2,
  useLoadSampleEntities,
  useLoadSearchEntities,
  useLoadTotalCount,
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
  const { schema, authKeys } = useContext(DataDataContext2);
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    urlQuery,
    initializeSearchEntityStateFromUrlQuery
  );

  const [entityTypeFilterState, dispatchEntityTypeFilterState] = useReducer(
    reduceEntityTypeSelectorState,
    { selectedIds: searchEntityState.query.entityTypes },
    initializeEntityTypeSelectorState
  );

  const [statusFilterState, dispatchStatusFilterState] = useReducer(
    reduceStatusSelectorState,
    {
      selectedIds: (searchEntityState.query as AdminQuery).status,
    },
    initializeStatusSelectorState
  );

  const [authKeyFilterState, dispatchAuthKeyFilterState] = useReducer(
    reduceAuthKeySelectorState,
    {
      authKeys,
      selectedIds: searchEntityState.query.authKeys,
    },
    initializeAuthKeySelectorState
  );

  // map or list

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

  // sync status filter -> search state
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery({ status: statusFilterState.selectedIds }, true)
    );
  }, [statusFilterState.selectedIds]);

  // sync auth key filter -> search state
  useEffect(() => {
    dispatchSearchEntityState(
      new SearchEntityStateActions.SetQuery({ authKeys: authKeyFilterState.selectedIds }, true)
    );
  }, [authKeyFilterState.selectedIds]);

  // sync url <-> search entity state
  useSynchronizeUrlQueryAndSearchEntityState(
    urlQuery,
    onUrlQueryChanged,
    searchEntityState,
    dispatchSearchEntityState
  );

  // load
  useLoadSearchEntities(
    dispatchSearchEntityState,
    searchEntityState.paging ? (searchEntityState.query as AdminQuery) : undefined,
    searchEntityState.paging
  );

  useLoadTotalCount(
    dispatchSearchEntityState,
    searchEntityState.paging ? (searchEntityState.query as AdminQuery) : undefined
  );

  useLoadSampleEntities(
    dispatchSearchEntityState,
    searchEntityState.sampling ? (searchEntityState.query as AdminQuery) : undefined,
    searchEntityState.sampling
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
          dispatch={dispatchEntityTypeFilterState}
        >
          Entity type
        </EntityTypeSelector>
        <StatusSelector state={statusFilterState} dispatch={dispatchStatusFilterState}>
          Status
        </StatusSelector>
        <AuthKeySelector state={authKeyFilterState} dispatch={dispatchAuthKeyFilterState}>
          Auth keys
        </AuthKeySelector>
        <IconButton icon={showMap ? 'list' : 'map'} onClick={handleToggleShowMap} />
        <TypePicker2 iconLeft="add" showEntityTypes onTypeSelected={onCreateEntity}>
          Create
        </TypePicker2>
      </FullscreenContainer.Row>
      {showMap ? (
        <FullscreenContainer.Row fillHeight fullWidth>
          <EntityMap2<AdminEntity>
            className={toSizeClassName({ height: '100%' })}
            {...{ schema, searchEntityState, dispatchSearchEntityState }}
            renderEntityMarker={(key, entity, location) => (
              <EntityMapMarker
                key={key}
                entity={entity}
                location={location}
                onClick={() => onOpenEntity(entity)}
              />
            )}
          />
        </FullscreenContainer.Row>
      ) : (
        <FullscreenContainer.ScrollableRow>
          <FullscreenContainer.Row>
            <EntityTypeTagSelector
              state={entityTypeFilterState}
              dispatch={dispatchEntityTypeFilterState}
            />
            <StatusTagSelector state={statusFilterState} dispatch={dispatchStatusFilterState} />
            <AuthKeyTagSelector state={authKeyFilterState} dispatch={dispatchAuthKeyFilterState} />
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
        {searchEntityState.sampling ? (
          <SamplingButtons {...{ searchEntityState, dispatchSearchEntityState }} />
        ) : (
          <SearchButtons {...{ searchEntityState, dispatchSearchEntityState }} />
        )}
      </FullscreenContainer.Row>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}

function SearchButtons({
  searchEntityState,
  dispatchSearchEntityState,
}: {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}) {
  const handleEnableSample = useCallback(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.SetSampling({}, false));
  }, [dispatchSearchEntityState]);

  return (
    <>
      <SearchEntityPagingButtons {...{ searchEntityState, dispatchSearchEntityState }} />
      <SearchEntityPagingCount {...{ searchEntityState, dispatchSearchEntityState }} />
      <IconButton icon="shuffle" onClick={handleEnableSample} />
    </>
  );
}

function SamplingButtons({
  searchEntityState,
  dispatchSearchEntityState,
}: {
  searchEntityState: SearchEntityState;
  dispatchSearchEntityState: Dispatch<SearchEntityStateAction>;
}) {
  const handleOrdered = useCallback(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.SetPaging({}));
  }, [dispatchSearchEntityState]);

  const handleChangeSeed = useCallback(() => {
    dispatchSearchEntityState(new SearchEntityStateActions.SetSampling({ seed: undefined }, true));
  }, [dispatchSearchEntityState]);

  return (
    <>
      <SampleEntitiesOptionsCount {...{ searchEntityState, dispatchSearchEntityState }} />
      <IconButton icon="shuffle" onClick={handleChangeSeed} />
      <IconButton icon="ordered" onClick={handleOrdered} />
    </>
  );
}
