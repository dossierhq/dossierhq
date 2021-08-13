import type { Location } from '@jonasb/datadata-core';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import type { EntityFieldEditorProps } from '../..';
import { Button, Column, ColumnItem, IconButton, InputText, MapContainer, Modal, Row } from '../..';
import { initializeLocationState, reduceLocation } from './LocationReducer';

type Props = EntityFieldEditorProps<Location>;

export function LocationFieldEditor({ id, value, fieldSpec: _, onChange }: Props): JSX.Element {
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
        {show ? <LocationEditor value={value} onChange={onChange} /> : null}
      </Modal>
    </>
  );
}

function LocationEditor({
  value,
  onChange,
}: {
  value: Location | null;
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

  return (
    <Column className="h-100">
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
      <ColumnItem as={MapContainer} grow center={value}>
        <MapContainer.CurrentLocationMarker value={value} onChange={(x) => onChange?.(x)} />
      </ColumnItem>
    </Column>
  );
}
