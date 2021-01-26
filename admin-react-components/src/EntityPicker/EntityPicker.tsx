import type {
  AdminEntity,
  AdminQuery,
  Connection,
  Edge,
  EntityReference,
  ErrorType,
  FieldSpecification,
} from '@datadata/core';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Button, Modal } from '..';
import { DataDataContext, DataDataContextValue } from '../contexts/DataDataContext';

interface Props {
  id: string;
  value: EntityReference | null;
  fieldSpec: FieldSpecification;
  onChange?: (value: EntityReference | null) => void;
}

interface InnerProps extends Props {
  getEntity: DataDataContextValue['getEntity'];
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
        getEntity: context.getEntity,
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
  getEntity,
  searchEntities,
}: InnerProps) {
  const [show, setShow] = useState(false);
  const handleShow = useCallback(() => setShow(true), [setShow]);
  const handleClose = useCallback(() => setShow(false), [setShow]);
  const [entity, setEntity] = useState<AdminEntity | null>(null);
  const [connection, setConnection] = useState<Connection<Edge<AdminEntity, ErrorType>> | null>(
    null
  );

  useEffect(() => {
    if (value) {
      getEntity(value.id, {}).then((result) => {
        if (result.isOk()) {
          setEntity(result.value.item);
        }
        //TODO error handling
      });
    } else {
      if (entity) {
        setEntity(null);
      }
    }
  }, [value]);

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
      <Button id={id} onClick={handleShow}>
        {entity ? entity._name : value ? value.id : 'Not set'}
      </Button>
      <Button onClick={() => onChange?.(null)}>Remove</Button>
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
