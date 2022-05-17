import type { AdminEntity, ItemValuePath, Location } from '@jonasb/datadata-core';
import { isItemValuePathEqual } from '@jonasb/datadata-core';
import { Column } from '@jonasb/datadata-design';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { Button } from '../../generic-components/Button/Button';
import { ColumnItem } from '../../generic-components/Column/Column';
import { IconButton } from '../../generic-components/IconButton/IconButton';
import { InputText } from '../../generic-components/InputText/InputText';
import { Modal } from '../../generic-components/Modal/Modal';
import { Row } from '../../generic-components/Row/Row';
import { MapContainer } from '../..';
import type { LegacyEntityEditorDraftState } from '../LegacyEntityEditor/LegacyEntityEditorReducer';
import type { LegacyEntityFieldEditorProps } from '../LegacyEntityFieldEditor/LegacyEntityFieldEditor';
import { LegacyEntityMap } from '../LegacyEntityMap/LegacyEntityMap';
import { initializeLocationState, reduceLocation } from './LegacyLocationReducer';

type Props = LegacyEntityFieldEditorProps<Location>;

export function LegacyLocationFieldEditor({
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
  draftState: LegacyEntityEditorDraftState;
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
        as={LegacyEntityMap}
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
