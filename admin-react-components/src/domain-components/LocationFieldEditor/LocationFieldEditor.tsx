import type { Location } from '@datadata/core';
import React, { useCallback, useState } from 'react';
import type { EntityFieldEditorProps } from '../..';
import { Button, IconButton, InputText, Modal } from '../..';

type Props = EntityFieldEditorProps<Location>;

export function LocationFieldEditor({ id, value, fieldSpec, onChange }: Props): JSX.Element {
  const [show, setShow] = useState(false);
  const handleShow = useCallback(() => setShow(true), [setShow]);
  const handleClose = useCallback(() => setShow(false), [setShow]);

  return (
    <>
      <div style={{ display: 'flex' }}>
        <Button id={id} onClick={handleShow}>
          {value ? `${value.lat}, ${value.lng}` : 'Select location'}
        </Button>
        {value ? (
          <IconButton icon="remove" title="Remove location" onClick={() => onChange?.(null)} />
        ) : null}
      </div>
      <Modal show={show} onClose={handleClose}>
        {show ? (
          <LocationEditor initialValue={value} onChange={onChange} onDismiss={handleClose} />
        ) : null}
      </Modal>
    </>
  );
}

function LocationEditor({
  initialValue,
  onChange,
  onDismiss,
}: {
  initialValue: Location | null;
  onChange: ((location: Location | null) => void) | undefined;
  onDismiss: () => void;
}) {
  const [latString, setLatString] = useState(initialValue ? String(initialValue.lat) : '');
  const [lngString, setLngString] = useState(initialValue ? String(initialValue.lng) : '');

  return (
    <>
      <InputText value={latString} onChange={setLatString} type="number" />
      <InputText value={lngString} onChange={setLngString} type="number" />
      <Button
        kind="primary"
        onClick={() => {
          const lat = Number.parseFloat(latString);
          const lng = Number.parseFloat(lngString);
          const location = !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null;
          onChange?.(location);
          onDismiss();
        }}
      >
        Done
      </Button>
    </>
  );
}
