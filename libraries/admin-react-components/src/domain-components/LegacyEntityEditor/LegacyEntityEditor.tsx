import type { AdminEntityCreate, AdminEntityUpdate } from '@jonasb/datadata-core';
import { assertIsDefined } from '@jonasb/datadata-core';
import { ButtonDropdown } from '@jonasb/datadata-design';
import type { Dispatch, SetStateAction } from 'react';
import React, { useContext, useEffect, useState } from 'react';
import type { LegacyDataDataContextValue, MessageItem } from '../..';
import {
  Button,
  ColumnAs,
  LegacyDataDataContext,
  Divider,
  LegacyEntityEditorDispatchContext,
  LegacyEntityEditorStateContext,
  LegacyEntityFieldEditor,
  Form,
  FormField,
  InputText,
  Loader,
  Message,
  Row,
} from '../..';
import type {
  LegacyEntityEditorDraftState,
  LegacyEntityEditorStateAction,
} from './LegacyEntityEditorReducer';
import {
  LegacyEntityUpsertedAction,
  LegacyResetEntityAction,
  LegacySetAuthKeyAction,
  SetFieldAction,
  LegacySetMessageLoadMessageAction,
  LegacySetNameAction,
  LegacyUpdateEntityAction,
} from './LegacyEntityEditorReducer';

export interface LegacyEntityEditorProps {
  entityId: string;
}

interface EntityEditorInnerProps extends LegacyEntityEditorProps {
  draftState: LegacyEntityEditorDraftState;
  createEntity: LegacyDataDataContextValue['createEntity'];
  updateEntity: LegacyDataDataContextValue['updateEntity'];
}

export function LegacyEntityEditor({ entityId }: LegacyEntityEditorProps): JSX.Element | null {
  const { drafts } = useContext(LegacyEntityEditorStateContext);

  const draftState = drafts.find((x) => x.id === entityId);
  if (!draftState) {
    throw new Error(`Can't find state for id (${entityId})`);
  }

  const { createEntity, updateEntity } = useContext(LegacyDataDataContext);

  return (
    <>
      {draftState.exists ? <LegacyEntityLoader entityId={entityId} /> : null}
      <EntityEditorInner
        {...{
          entityId,
          draftState,
          createEntity,
          updateEntity,
        }}
      />
    </>
  );
}

export function LegacyEntityLoader({ entityId }: { entityId: string }): null {
  const { useEntity } = useContext(LegacyDataDataContext);
  const dispatchEditorState = useContext(LegacyEntityEditorDispatchContext);
  const { entity, entityError } = useEntity(entityId);

  useEffect(() => {
    if (entity) {
      dispatchEditorState(new LegacyUpdateEntityAction(entityId, entity));
    }
  }, [entityId, entity, dispatchEditorState]);

  useEffect(() => {
    dispatchEditorState(
      new LegacySetMessageLoadMessageAction(
        entityId,
        entityError?.error ?? null,
        entityError
          ? {
              kind: 'danger',
              title: 'Failed loading entity',
              message: `${entityError.error}: ${entityError.message}`,
            }
          : null
      )
    );
  }, [dispatchEditorState, entityError, entityId]);

  return null;
}

function EntityEditorInner({
  entityId,
  draftState,
  createEntity,
  updateEntity,
}: EntityEditorInnerProps): JSX.Element {
  const dispatchEditorState = useContext(LegacyEntityEditorDispatchContext);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<MessageItem | null>(null);

  const { entity } = draftState;

  if (!entity) {
    if (draftState.initMessage) {
      return <Message {...draftState.initMessage} />;
    }
    if (draftState.entityLoadMessage) {
      return <Message {...draftState.entityLoadMessage} />;
    }
    return <Loader />;
  }

  const nameId = `${draftState.id}-_name`;
  const authKeyId = `${draftState.id}-_authKey`;

  return (
    <div id={entityId} data-entityid={entityId}>
      <ColumnAs
        as={Form}
        className="dd-p-3 dd-is-rounded dd-has-background dd-has-shadow"
        onSubmit={() =>
          submitEntity(
            draftState,
            setSubmitLoading,
            setSubmitMessage,
            createEntity,
            updateEntity,
            dispatchEditorState
          )
        }
        onReset={() => dispatchEditorState(new LegacyResetEntityAction(entityId))}
      >
        {draftState.initMessage ? <Message {...draftState.initMessage} /> : null}
        {draftState.entityLoadMessage ? <Message {...draftState.entityLoadMessage} /> : null}
        <FormField htmlFor={nameId} label="Name">
          <InputText
            id={nameId}
            value={entity.name}
            onChange={(name) => dispatchEditorState(new LegacySetNameAction(entityId, name))}
          />
        </FormField>
        <Divider />
        {entity.fields.map(({ fieldSpec, value }) => {
          const handleFieldChanged = (newValue: unknown) => {
            dispatchEditorState(new SetFieldAction(entityId, fieldSpec.name, newValue));
          };

          return (
            <LegacyEntityFieldEditor
              idPrefix={entityId}
              key={fieldSpec.name}
              fieldSpec={fieldSpec}
              draftState={draftState}
              valuePath={['fields', fieldSpec.name]}
              value={value}
              onValueChanged={handleFieldChanged}
            />
          );
        })}

        {!draftState.exists ? (
          <FormField htmlFor={authKeyId} label="Authorization key">
            <AuthKeyPicker
              id={authKeyId}
              value={entity.authKey}
              onValueChanged={(value) =>
                dispatchEditorState(new LegacySetAuthKeyAction(entityId, value))
              }
            />
          </FormField>
        ) : null}

        <Row gap={1}>
          <Button
            kind="primary"
            type="submit"
            disabled={!entity.name || !entity.authKey}
            loading={submitLoading}
          >
            Save
          </Button>
          <Button type="reset" disabled={!entity}>
            Reset
          </Button>
        </Row>
        {submitMessage ? (
          <Message {...submitMessage} onDismiss={() => setSubmitMessage(null)} />
        ) : null}
      </ColumnAs>
    </div>
  );
}

function AuthKeyPicker({
  id,
  value,
  onValueChanged,
}: {
  id: string;
  value: string | null;
  onValueChanged: (value: string) => void;
}) {
  const { authKeys } = useContext(LegacyDataDataContext);

  const items = authKeys.map((it) => ({ id: it.authKey, displayName: it.displayName }));
  let text = 'Select authorization key';
  if (value) {
    const key = authKeys.find((it) => it.authKey === value);
    text = key ? key.displayName : value;
  }

  return (
    <ButtonDropdown
      id={id}
      items={items}
      renderItem={(item) => item.displayName}
      onItemClick={(item) => onValueChanged(item.id)}
    >
      {text}
    </ButtonDropdown>
  );
}

function createAdminEntity(
  draftState: LegacyEntityEditorDraftState
): AdminEntityCreate | AdminEntityUpdate {
  const entityState = draftState.entity;
  if (!entityState) throw new Error('No entity in state');

  let result: AdminEntityCreate | AdminEntityUpdate;
  if (entityState.version === 0) {
    assertIsDefined(entityState.authKey);
    const createResult: AdminEntityCreate = {
      id: draftState.id,
      info: {
        type: entityState.entitySpec.name,
        name: entityState.name,
        authKey: entityState.authKey,
        version: entityState.version,
      },
      fields: {},
    };
    result = createResult;
  } else {
    const { id } = draftState;
    assertIsDefined(id);
    const updateResult: AdminEntityUpdate = {
      id,
      info: {
        type: entityState.entitySpec.name,
        ...(entityState.name !== entityState.initialName ? { name: entityState.name } : {}),
      },
      fields: {},
    };
    result = updateResult;
  }

  for (const { fieldSpec, value, initialValue } of entityState.fields) {
    if (value !== initialValue) {
      result.fields[fieldSpec.name] = value;
    }
  }

  return result;
}

async function submitEntity(
  draftState: LegacyEntityEditorDraftState,
  setSubmitLoading: Dispatch<SetStateAction<boolean>>,
  setSubmitMessage: Dispatch<SetStateAction<MessageItem | null>>,
  createEntity: LegacyDataDataContextValue['createEntity'],
  updateEntity: LegacyDataDataContextValue['updateEntity'],
  dispatchEditorState: Dispatch<LegacyEntityEditorStateAction>
) {
  setSubmitLoading(true);
  const entity = createAdminEntity(draftState);
  const isNew = entity.info?.version === 0;
  const result = await (isNew
    ? createEntity(entity as AdminEntityCreate)
    : updateEntity(entity as AdminEntityUpdate));

  if (result.isOk()) {
    dispatchEditorState(new LegacyEntityUpsertedAction(draftState.id));
  } else {
    setSubmitMessage({
      kind: 'danger',
      title: isNew ? 'Failed creating entity' : 'Failed saving entity',
      message: `${result.error}: ${result.message}`,
    });
  }
  setSubmitLoading(false);
}
