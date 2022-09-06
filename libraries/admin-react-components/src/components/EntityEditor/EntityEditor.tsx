import type { AdminClient } from '@jonasb/datadata-core';
import type { NotificationInfo } from '@jonasb/datadata-design';
import { Button, Field, Input, NotificationContext, Row } from '@jonasb/datadata-design';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { useCallback, useContext, useState } from 'react';
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
import { PublishingButton } from './PublishingButton';

interface Props {
  draftState: EntityEditorDraftState;
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>;
}

export function EntityEditor({ draftState, dispatchEntityEditorState }: Props) {
  const { adminClient } = useContext(AdminDataDataContext);
  const { showNotification } = useContext(NotificationContext);
  const [submitLoading, setSubmitLoading] = useState(false);

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
      showNotification,
      false
    );
  }, [adminClient, dispatchEntityEditorState, draftState, showNotification]);
  const handleSubmitAndPublishClick = useCallback(() => {
    submitEntity(
      draftState,
      setSubmitLoading,
      adminClient,
      dispatchEntityEditorState,
      showNotification,
      true
    );
  }, [adminClient, dispatchEntityEditorState, draftState, showNotification]);

  if (!draftState.draft) {
    return null;
  }

  const isNewEntity = !draftState.entity;
  const isSubmittable =
    !submitLoading &&
    draftState.status === 'changed' &&
    draftState.draft.name &&
    draftState.draft.authKey;

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
      <Row gap={2} justifyContent="center">
        <Button color="primary" disabled={!isSubmittable} onClick={handleSubmitClick}>
          {isNewEntity ? 'Create' : 'Save'}
        </Button>
        {!draftState.draft.entitySpec.adminOnly ? (
          <Button disabled={!isSubmittable} onClick={handleSubmitAndPublishClick}>
            {isNewEntity ? 'Create & publish' : 'Save & publish'}
          </Button>
        ) : null}
        <PublishingButton
          disabled={draftState.status !== ''}
          entity={draftState.entity}
          entitySpec={draftState.draft.entitySpec}
        />
      </Row>
      {draftState.draft.fields.map((field) => (
        <EntityFieldEditor
          key={field.fieldSpec.name}
          field={field}
          onValueChange={(value) =>
            dispatchEntityEditorState(
              new EntityEditorActions.SetField(draftState.id, field.fieldSpec.name, value)
            )
          }
        />
      ))}
    </>
  );
}

async function submitEntity(
  draftState: EntityEditorDraftState,
  setSubmitLoading: Dispatch<SetStateAction<boolean>>,
  adminClient: AdminClient,
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>,
  showNotification: (notification: NotificationInfo) => void,
  publish: boolean
) {
  setSubmitLoading(true);
  dispatchEntityEditorState(
    new EntityEditorActions.SetNextEntityUpdateIsDueToUpsert(draftState.id, true)
  );

  const isCreate = !draftState.entity;
  let result;
  if (isCreate) {
    const entityCreate = getEntityCreateFromDraftState(draftState);
    result = await adminClient.createEntity(entityCreate, { publish });
  } else {
    const entityUpdate = getEntityUpdateFromDraftState(draftState);
    result = await adminClient.updateEntity(entityUpdate, { publish });
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
