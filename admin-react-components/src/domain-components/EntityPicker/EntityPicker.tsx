import type { EntityReference } from '@datadata/core';
import React, { useCallback, useContext, useState } from 'react';
import type { DataDataContextValue, EntityFieldEditorProps } from '../..';
import { Button, DataDataContext, EntitySearch, IconButton, Modal } from '../..';

export type EntityPickerProps = EntityFieldEditorProps<EntityReference>;

interface InnerProps extends EntityPickerProps {
  useEntity: DataDataContextValue['useEntity'];
}

export function EntityPicker({
  id,
  value,
  schema,
  fieldSpec,
  onChange,
}: EntityPickerProps): JSX.Element | null {
  const context = useContext(DataDataContext);
  if (!context) {
    return null;
  }
  const { useEntity } = context;

  return (
    <EntityPickerInner
      {...{
        id,
        value,
        schema,
        fieldSpec,
        onChange,
        useEntity,
      }}
    />
  );
}

function EntityPickerInner({ id, value, schema, fieldSpec, onChange, useEntity }: InnerProps) {
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
      <div style={{ display: 'flex' }}>
        <Button id={id} onClick={handleShow}>
          {entity ? entity._name : value ? value.id : 'Select entity'}
        </Button>
        {value ? (
          <IconButton icon="remove" title="Remove entity" onClick={() => onChange?.(null)} />
        ) : null}
      </div>
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
