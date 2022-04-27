import type { AdminEntity, EntityReference } from '@jonasb/datadata-core';
import React, { useCallback, useContext, useState } from 'react';
import type { LegacyEntityFieldEditorProps } from '../..';
import {
  Button,
  LegacyDataDataContext,
  LegacyEntityEditorDispatchContext,
  LegacyEntitySearch,
  IconButton,
  Modal,
  LegacyPublishStateTag,
  Row,
} from '../..';
import { LegacyAddEntityDraftAction } from '../LegacyEntityEditor/LegacyEntityEditorReducer';

export type LegacyEntityItemFieldEditorProps = LegacyEntityFieldEditorProps<EntityReference>;

export function LegacyEntityItemFieldEditor({
  id,
  value,
  fieldSpec,
  onChange,
}: LegacyEntityItemFieldEditorProps): JSX.Element | null {
  const { useEntity } = useContext(LegacyDataDataContext);
  const dispatchEditorState = useContext(LegacyEntityEditorDispatchContext);
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
    if (value?.id) dispatchEditorState(new LegacyAddEntityDraftAction({ id: value.id }));
  }, [dispatchEditorState, value]);

  //TODO handle error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { entity, entityError } = useEntity(value?.id);

  return (
    <>
      <Row>
        <Button id={id} onClick={handleShow}>
          {entity ? entity.info.name : value ? value.id : 'Select entity'}
          {entity ? <LegacyPublishStateTag publishState={entity.info.status} /> : null}
        </Button>
        {entity ? <Button onClick={handleEditEntity}>Edit</Button> : null}
        {value ? (
          <IconButton icon="remove" title="Remove entity" onClick={() => onChange?.(null)} />
        ) : null}
      </Row>
      <Modal show={show} onClose={handleClose} size="large">
        {show ? (
          <LegacyEntitySearch
            className="dd-w-100 dd-h-100"
            query={{ entityTypes: fieldSpec.entityTypes }}
            onEntityClick={handleEntityClick}
          />
        ) : null}
      </Modal>
    </>
  );
}
