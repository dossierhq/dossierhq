import type { AdminClient } from '@jonasb/datadata-core';
import { Button, Field, Input, NotificationContext } from '@jonasb/datadata-design';
import type { NotificationInfo } from '@jonasb/datadata-design/lib/contexts/NotificationContext';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import React, { useCallback, useContext, useState } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import type {
  EntityEditorDraftState,
  EntityEditorStateAction,
} from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import {
  EntityEditorActions,
  getEntityCreateFromDraftState,
  getEntityUpdateFromDraftState,
} from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import { AuthKeyPicker } from './AuthKeyPicker';
import { EntityFieldEditor } from './EntityFieldEditor';

interface Props {
  draftState: EntityEditorDraftState;
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>;
}

export function EntityEditor({ draftState, dispatchEntityEditorState }: Props) {
  const { adminClient } = useContext(AdminDataDataContext);
  const { showNotification } = useContext(NotificationContext);
  const [_submitLoading, setSubmitLoading] = useState(false);

  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      dispatchEntityEditorState(new EntityEditorActions.SetName(draftState.id, event.target.value)),
    [dispatchEntityEditorState, draftState.id]
  );
  const handleAuthKeyChange = useCallback(
    (authKey: string) =>
      dispatchEntityEditorState(new EntityEditorActions.SetAuthKey(draftState.id, authKey)),
    [dispatchEntityEditorState, draftState.id]
  );
  const handleSubmitClick = useCallback(() => {
    submitEntity(
      draftState,
      setSubmitLoading,
      adminClient,
      dispatchEntityEditorState,
      showNotification
    );
  }, [adminClient, dispatchEntityEditorState, draftState, showNotification]);

  if (!draftState.draft) {
    return null;
  }

  const isNewEntity = !draftState.entity;
  const isSubmittable = draftState.draft.name && draftState.draft.authKey;

  return (
    <>
      <Field>
        <Field.Label>Name</Field.Label>
        <Field.Control>
          <Input value={draftState.draft.name} onChange={handleNameChange} />
        </Field.Control>
      </Field>
      {!draftState.entity ? (
        <Field>
          <Field.Label>Authorization key</Field.Label>
          <Field.Control>
            <AuthKeyPicker value={draftState.draft.authKey} onValueChange={handleAuthKeyChange} />
          </Field.Control>
        </Field>
      ) : null}
      <Button color="primary" disabled={!isSubmittable} onClick={handleSubmitClick}>
        {isNewEntity ? 'Create' : 'Save'}
      </Button>
      {draftState.draft.fields.map((field) => (
        <EntityFieldEditor key={field.fieldSpec.name} field={field} />
      ))}
    </>
  );
}

async function submitEntity(
  draftState: EntityEditorDraftState,
  setSubmitLoading: Dispatch<SetStateAction<boolean>>,
  adminClient: AdminClient,
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>,
  showNotification: (notification: NotificationInfo) => void
) {
  setSubmitLoading(true);
  dispatchEntityEditorState(
    new EntityEditorActions.SetNextEntityUpdateIsDueToUpsert(draftState.id, true)
  );

  const isCreate = !draftState.entity;
  let result;
  if (isCreate) {
    const entityCreate = getEntityCreateFromDraftState(draftState);
    result = await adminClient.createEntity(entityCreate);
  } else {
    const entityUpdate = getEntityUpdateFromDraftState(draftState);
    result = await adminClient.updateEntity(entityUpdate);
  }
  if (result.isOk()) {
    showNotification({ color: 'success', message: isCreate ? 'Created entity' : 'Updated entity' });
  } else {
    showNotification({
      color: 'error',
      message: isCreate ? 'Failed creating entity' : 'Failed updating entity',
    });
    dispatchEntityEditorState(
      new EntityEditorActions.SetNextEntityUpdateIsDueToUpsert(draftState.id, false)
    );
  }

  setSubmitLoading(false);
}
