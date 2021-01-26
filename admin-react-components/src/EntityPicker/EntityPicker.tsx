import type { AdminEntity, Connection, Edge, EntityReference, ErrorType } from '@datadata/core';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Button, Modal } from '..';
import { DataDataContext, DataDataContextValue } from '../contexts/DataDataContext';

interface Props {
  id: string;
  value: EntityReference | null;
  onChange?: (value: EntityReference | null) => void;
}

interface InnerProps extends Props {
  searchEntities: DataDataContextValue['searchEntities'];
}

export function EntityPicker({ id, value, onChange }: Props): JSX.Element | null {
  const context = useContext(DataDataContext);
  if (!context) {
    return null;
  }

  return <EntityPickerInner {...{ id, value, onChange, searchEntities: context.searchEntities }} />;
}

function EntityPickerInner({ id, value, onChange, searchEntities }: InnerProps) {
  const [show, setShow] = useState(false);
  const handleShow = useCallback(() => setShow(true), [setShow]);
  const handleClose = useCallback(() => setShow(false), [setShow]);
  const [connection, setConnection] = useState<Connection<Edge<AdminEntity, ErrorType>> | null>(
    null
  );

  useEffect(() => {
    if (show) {
      searchEntities().then((result) => {
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
        {value ? value.id : 'Not set'}
      </Button>
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
