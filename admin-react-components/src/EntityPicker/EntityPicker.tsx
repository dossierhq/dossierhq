import type {
  AdminEntity,
  AdminQuery,
  Connection,
  Edge,
  EntityReference,
  ErrorType,
} from '@datadata/core';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import type { DataDataContextValue, EntityFieldEditorProps } from '..';
import { Button, DataDataContext, IconButton, Modal } from '..';

type Props = EntityFieldEditorProps<EntityReference>;

interface InnerProps extends Props {
  useEntity: DataDataContextValue['useEntity'];
  searchEntities: DataDataContextValue['searchEntities'];
}

export function EntityPicker({ id, value, fieldSpec, onChange }: Props): JSX.Element | null {
  const context = useContext(DataDataContext);
  if (!context) {
    return null;
  }

  return (
    <EntityPickerInner
      {...{
        id,
        value,
        fieldSpec,
        onChange,
        useEntity: context.useEntity,
        searchEntities: context.searchEntities,
      }}
    />
  );
}

function EntityPickerInner({
  id,
  value,
  fieldSpec,
  onChange,
  useEntity,
  searchEntities,
}: InnerProps) {
  const [show, setShow] = useState(false);
  const handleShow = useCallback(() => setShow(true), [setShow]);
  const handleClose = useCallback(() => setShow(false), [setShow]);
  const [connection, setConnection] = useState<Connection<Edge<AdminEntity, ErrorType>> | null>(
    null
  );

  const { entity, entityError } = useEntity(value?.id, {});

  useEffect(() => {
    if (show) {
      const query: AdminQuery = { entityTypes: fieldSpec.entityTypes };
      searchEntities(query).then((result) => {
        if (result.isOk()) {
          setConnection(result.value);
        }
        //TODO error handling
      });
    }
  }, [show]);

  return (
    <>
      <div style={{ display: 'flex' }}>
        <Button id={id} onClick={handleShow}>
          {entity ? entity.item._name : value ? value.id : 'Not set'}
        </Button>
        <IconButton
          icon="remove"
          ariaLabel="Remove entity"
          onClick={() => onChange?.(null)}
          disabled={!value}
        />
      </div>
      <Modal show={show} onClose={handleClose}>
        {connection &&
          connection.edges.map((edge) => {
            const entity = edge.node.isOk() ? edge.node.value : null;
            return (
              <p
                key={edge.cursor}
                onClick={() => {
                  if (entity && onChange) {
                    onChange({ id: entity.id });
                  }
                  handleClose();
                }}
              >
                {edge.node.isOk() ? edge.node.value._name : edge.node.error}
              </p>
            );
          })}
      </Modal>
    </>
  );
}
