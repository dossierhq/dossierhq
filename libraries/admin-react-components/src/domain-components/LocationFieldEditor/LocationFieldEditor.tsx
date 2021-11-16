import type { AdminEntity, ItemValuePath, Location } from '@jonasb/datadata-core';
import { isItemValuePathEqual } from '@jonasb/datadata-core';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import type { EntityFieldEditorProps } from '../../index.js';
import {
  Button,
  Column,
  ColumnItem,
  IconButton,
  InputText,
  MapContainer,
  Modal,
  Row,
} from '../../index.js';
import type { EntityEditorDraftState } from '../EntityEditor/EntityEditorReducer.js';
import { EntityMap } from '../EntityMap/EntityMap.js';
import { initializeLocationState, reduceLocation } from './LocationReducer.js';

type Props = EntityFieldEditorProps<Location>;

export function LocationFieldEditor({
  id,
  value,
  draftState,
  valuePath,
  fieldSpec: _,
  onChange,
}: Props): JSX.Element {
  const [show, setShow] = useState(false);
  const handleShow = useCallback(() => setShow(true), [setShow]);
  const handleClose = useCallback(() => setShow(false), [setShow]);

  return (
    <>
      <Row>
        <Button id={id} onClick={handleShow}>
          {value ? `${value.lat}, ${value.lng}` : 'Select location'}
        </Button>
        {value ? (
          <IconButton icon="remove" title="Remove location" onClick={() => onChange?.(null)} />
        ) : null}
      </Row>
      <Modal show={show} onClose={handleClose} size="large">
        {show ? <LocationEditor {...{ value, draftState, valuePath, onChange }} /> : null}
      </Modal>
    </>
  );
}

function LocationEditor({
  value,
  draftState,
  valuePath,
  onChange,
}: {
  value: Location | null;
  draftState: EntityEditorDraftState;
  valuePath: ItemValuePath;
  onChange: ((location: Location | null) => void) | undefined;
}) {
  const [{ latString, lngString }, dispatch] = useReducer(
    reduceLocation,
    { value, onChange },
    initializeLocationState
  );
  useEffect(() => {
    dispatch({ type: 'value', value });
  }, [value]);
  useEffect(() => {
    dispatch({ type: 'onChange', onChange });
  }, [onChange]);

  // TODO filter out all draft locations and add all draft locations
  const filterEntityLocations = useCallback(
    (e: AdminEntity, path: ItemValuePath) => {
      const currentLocation = e.id === draftState.id && isItemValuePathEqual(valuePath, path);
      return !currentLocation;
    },
    [draftState, valuePath]
  );

  return (
    <Column className="dd-h-100">
      <ColumnItem as={Row}>
        <InputText
          value={latString}
          onChange={(lat) => dispatch({ type: 'lat', value: lat })}
          type="number"
          min={-90.0}
          max={90.0}
          step={0.000001}
        />
        <InputText
          value={lngString}
          onChange={(lng) => dispatch({ type: 'lng', value: lng })}
          type="number"
          min={-180.0}
          max={180.0}
          step={0.000001}
        />
      </ColumnItem>
      <ColumnItem
        as={EntityMap}
        grow
        center={value}
        zoom={value ? 18 : null}
        paging={{ first: 100 }}
        filterEntityLocations={filterEntityLocations}
        onEntityClick={() => {
          // empty
        }}
      >
        <MapContainer.EditLocationMarker value={value} onChange={(x) => onChange?.(x)} />
      </ColumnItem>
    </Column>
  );
}
