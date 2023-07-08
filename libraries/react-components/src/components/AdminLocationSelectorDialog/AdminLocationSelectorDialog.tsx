import {
  ItemTraverseNodeType,
  isLocationItemField,
  type AdminEntity,
  type AdminSchema,
  type Location,
} from '@dossierhq/core';
import {
  Dialog2,
  FullscreenContainer,
  IconButton,
  Input,
  Text,
  toSizeClassName,
} from '@dossierhq/design';
import { MapContainer } from '@dossierhq/leaflet';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import { EntityEditorStateContext } from '../../contexts/EntityEditorStateContext.js';
import { useAdminLoadEntitySearch } from '../../hooks/useAdminLoadEntitySearch.js';
import { traverseEntityEditorDraft } from '../../reducers/EntityEditorReducer/EntityDraftTraverser.js';
import type { EntityEditorDraftState } from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';
import { EntityMap } from '../../shared/components/EntityMap/EntityMap.js';
import {
  SearchEntityStateActions,
  initializeSearchEntityState,
  reduceSearchEntityState,
} from '../../shared/reducers/SearchEntityReducer/SearchEntityReducer.js';
import { AdminEntityMapMarker } from '../AdminEntityMapMarker/AdminEntityMapMarker.js';
import { EntityDraftMapMarker } from './EntityDraftMapMarker.js';
import { initializeLocationState, reduceLocation } from './LocationReducer.js';

interface AdminLocationSelectorDialogProps {
  title: string;
  value: Location | null;
  onChange: (location: Location | null) => void;
  onItemClick?: (item: AdminEntity | EntityEditorDraftState) => void;
}

export function AdminLocationSelectorDialog({
  title,
  value,
  onChange,
  onItemClick,
}: AdminLocationSelectorDialogProps) {
  return (
    <Dialog2 width="wide" height="fill">
      {({ close }) => (
        <FullscreenContainer card height="100%">
          <FullscreenContainer.Row flexDirection="row" alignItems="center">
            <FullscreenContainer.Item flexGrow={1} paddingHorizontal={3} paddingVertical={2}>
              <Text textStyle="headline5">{title}</Text>
            </FullscreenContainer.Item>
            <IconButton icon="close" color="white" onClick={close} />
          </FullscreenContainer.Row>
          <Content value={value} onChange={onChange} onItemClick={onItemClick} />
        </FullscreenContainer>
      )}
    </Dialog2>
  );
}

function Content({
  value,
  onChange,
  onItemClick,
}: {
  value: Location | null;
  onChange: (location: Location | null) => void;
  onItemClick?: (item: AdminEntity | EntityEditorDraftState) => void;
}) {
  const { schema } = useContext(AdminDossierContext);
  const entityEditorState = useContext(EntityEditorStateContext);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Lat, lng state
  const [{ latString, lngString }, dispatch] = useReducer(
    reduceLocation,
    { value, onChangeRef },
    initializeLocationState,
  );
  useEffect(() => {
    dispatch({ type: 'value', value });
  }, [value]);

  const handleLatChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void =>
      dispatch({ type: 'lat', value: event.currentTarget.value }),
    [],
  );

  const handleLngChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void =>
      dispatch({ type: 'lng', value: event.currentTarget.value }),
    [],
  );

  // Reset signal

  const [resetSignal, setResetSignal] = useState(0);
  const handleResetClick = useCallback(() => setResetSignal((it) => it + 1), []);

  // Entity search state

  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    { mode: 'admin', actions: [new SearchEntityStateActions.SetSampling({ count: 100 }, false)] },
    initializeSearchEntityState,
  );

  useAdminLoadEntitySearch(searchEntityState, dispatchSearchEntityState);

  // Draft locations
  const { draftIds, markers } = useMemo(
    () => extractDraftLocations(schema, entityEditorState.drafts, value),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schema, entityEditorState.drafts],
  );

  const filterEntity = useCallback((entity: AdminEntity) => !draftIds.has(entity.id), [draftIds]);

  return (
    <>
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        <Input
          value={latString}
          onChange={handleLatChange}
          type="number"
          min={-90.0}
          max={90.0}
          step={0.000001}
        />
        <Input
          value={lngString}
          onChange={handleLngChange}
          type="number"
          min={-180.0}
          max={180.0}
          step={0.000001}
        />
        <IconButton disabled={!value} icon="location" onClick={handleResetClick} />
      </FullscreenContainer.Row>
      <FullscreenContainer.Row fillHeight fullWidth>
        <EntityMap<AdminEntity>
          className={toSizeClassName({ height: '100%' })}
          {...{ schema, searchEntityState, dispatchSearchEntityState }}
          filterEntity={filterEntity}
          renderEntityMarker={(key, entity, location) => (
            <AdminEntityMapMarker
              key={key}
              entity={entity}
              location={location}
              onClick={onItemClick ? () => onItemClick(entity) : undefined}
            />
          )}
          center={value}
          resetSignal={resetSignal}
        >
          {markers.map((marker, index) => (
            <EntityDraftMapMarker
              key={index}
              draftState={marker.draftState}
              location={marker.location}
              onClick={onItemClick ? () => onItemClick(marker.draftState) : undefined}
            />
          ))}
          <MapContainer.EditLocationMarker value={value} onChange={onChange} />
        </EntityMap>
      </FullscreenContainer.Row>
    </>
  );
}

function extractDraftLocations(
  schema: AdminSchema | undefined,
  drafts: EntityEditorDraftState[],
  value: Location | null,
) {
  const draftIds = new Set<string>();
  const markers: { draftState: EntityEditorDraftState; location: Location }[] = [];

  function considerLocation(draftState: EntityEditorDraftState, location: Location) {
    if (value && value.lat === location.lat && value.lng === location.lat) {
      return;
    }
    markers.push({ draftState, location });
  }

  for (const draftState of drafts) {
    draftIds.add(draftState.id);

    if (schema) {
      for (const node of traverseEntityEditorDraft(schema, draftState)) {
        if (node.type === ItemTraverseNodeType.fieldItem) {
          if (isLocationItemField(node.fieldSpec, node.value) && node.value) {
            considerLocation(draftState, node.value);
          }
        }
      }
    }
  }

  return { draftIds, markers };
}
