import type { AdminEntity, EntityReference } from '@jonasb/datadata-core';
import React, { useCallback, useContext, useState } from 'react';
import type { EntityFieldEditorProps } from '../..';
import {
  Button,
  DataDataContext,
  EntityEditorDispatchContext,
  EntitySearch,
  IconButton,
  Modal,
  PublishStateTag,
  Row,
} from '../..';
import { AddEntityDraftAction } from '../EntityEditor/EntityEditorReducer';

export type EntityItemFieldEditorProps = EntityFieldEditorProps<EntityReference>;

export function EntityItemFieldEditor({
  id,
  value,
  fieldSpec,
  onChange,
}: EntityItemFieldEditorProps): JSX.Element | null {
  const { useEntity } = useContext(DataDataContext);
  const dispatchEditorState = useContext(EntityEditorDispatchContext);
  const [show, setShow] = useState(false);
  const handleShow = useCallback(() => setShow(true), [setShow]);
  const handleClose = useCallback(() => setShow(false), [setShow]);
  const handleEntityClick = useCallback(
    (entity: AdminEntity) => {
      if (onChange) {
        onChange({ id: entity.id });
      }
      handleClose();
    },
    [onChange, handleClose]
  );
  const handleEditEntity = useCallback(() => {
    if (value?.id) dispatchEditorState(new AddEntityDraftAction({ id: value.id }));
  }, [dispatchEditorState, value]);

  //TODO handle error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { entity, entityError } = useEntity(value?.id);

  return (
    <>
      <Row>
        <Button id={id} onClick={handleShow}>
          {entity ? entity.info.name : value ? value.id : 'Select entity'}
          {entity ? <PublishStateTag publishState={entity.info.status} /> : null}
        </Button>
        {entity ? <Button onClick={handleEditEntity}>Edit</Button> : null}
        {value ? (
          <IconButton icon="remove" title="Remove entity" onClick={() => onChange?.(null)} />
        ) : null}
      </Row>
      <Modal show={show} onClose={handleClose} size="large">
        {show ? (
          <EntitySearch
            className="dd-w-100 dd-h-100"
            query={{ entityTypes: fieldSpec.entityTypes }}
            onEntityClick={handleEntityClick}
          />
        ) : null}
      </Modal>
    </>
  );
}
