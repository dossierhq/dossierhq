import type { EntityReference } from '@datadata/core';
import React, { useCallback, useContext, useState } from 'react';
import type { EntityFieldEditorProps } from '../..';
import { Button, DataDataContext, EntitySearch, IconButton, Modal, Row } from '../..';

export type EntityItemFieldEditorProps = EntityFieldEditorProps<EntityReference>;

export function EntityItemFieldEditor({
  id,
  value,
  schema,
  fieldSpec,
  onChange,
}: EntityItemFieldEditorProps): JSX.Element | null {
  const { useEntity } = useContext(DataDataContext);
  const [show, setShow] = useState(false);
  const handleShow = useCallback(() => setShow(true), [setShow]);
  const handleClose = useCallback(() => setShow(false), [setShow]);
  const handleEntityClick = useCallback(
    (entity) => {
      if (onChange) {
        onChange({ id: entity.id });
      }
      handleClose();
    },
    [onChange, handleClose]
  );

  const { entity, entityError } = useEntity(value?.id);

  return (
    <>
      <Row>
        <Button id={id} onClick={handleShow}>
          {entity ? entity._name : value ? value.id : 'Select entity'}
        </Button>
        {value ? (
          <IconButton icon="remove" title="Remove entity" onClick={() => onChange?.(null)} />
        ) : null}
      </Row>
      <Modal show={show} onClose={handleClose} size="large">
        {show ? (
          <EntitySearch
            className="w-100 h-100"
            query={{ entityTypes: fieldSpec.entityTypes }}
            onEntityClick={handleEntityClick}
          />
        ) : null}
      </Modal>
    </>
  );
}
