import type { EntityReference } from '@datadata/core';
import React, { useCallback, useState } from 'react';
import { Button, Modal } from '..';

interface Props {
  id: string;
  value: EntityReference | null;
  onChange?: (value: string) => void;
}

export function EntityPicker({ id, value, onChange }: Props): JSX.Element {
  const [show, setShow] = useState(false);
  const handleShow = useCallback(() => setShow(true), [setShow]);
  const handleClose = useCallback(() => setShow(false), [setShow]);

  return (
    <>
      <Button id={id} onClick={handleShow}>
        {value ? value.id : 'Not set'}
      </Button>
      <Modal show={show} onClose={handleClose}>
        <p>Hello world</p>
      </Modal>
    </>
  );
}
