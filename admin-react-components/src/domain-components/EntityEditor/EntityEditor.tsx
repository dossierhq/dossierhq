import type { AdminEntityCreate, AdminEntityUpdate } from '@datadata/core';
import type { Dispatch, SetStateAction } from 'react';
import React, { useContext, useEffect, useState } from 'react';
import {
  Button,
  ColumnAs,
  DataDataContext,
  Divider,
  EntityEditorDispatchContext,
  EntityEditorStateContext,
  EntityFieldEditor,
  Form,
  FormField,
  InputText,
  Loader,
  Message,
  Row,
} from '../..';
import type { DataDataContextValue, MessageItem } from '../..';
import type { EntityEditorDraftState, EntityEditorStateAction } from './EntityEditorReducer';
import {
  EntityUpsertedAction,
  ResetEntityAction,
  SetFieldAction,
  SetMessageLoadMessageAction,
  SetNameAction,
  UpdateEntityAction,
} from './EntityEditorReducer';

export interface EntityEditorProps {
  entityId: string;
}

interface EntityEditorInnerProps extends EntityEditorProps {
  draftState: EntityEditorDraftState;
  createEntity: DataDataContextValue['createEntity'];
  updateEntity: DataDataContextValue['updateEntity'];
}

export function EntityEditor({ entityId }: EntityEditorProps): JSX.Element | null {
  const editorState = useContext(EntityEditorStateContext);
  const dispatchEditorState = useContext(EntityEditorDispatchContext);

  const draftState = editorState.drafts.find((x) => x.id === entityId);
  if (!draftState) {
    throw new Error(`Can't find state for id (${entityId})`);
  }

  const { useEntity, createEntity, updateEntity } = useContext(DataDataContext);

  return (
    <>
      {draftState.exists ? (
        <EntityLoader {...{ entityId, useEntity, dispatchEditorState }} />
      ) : null}
      <EntityEditorInner
        {...{
          entityId,
          draftState,
          editorState,
          dispatchEditorState,
          createEntity,
          updateEntity,
        }}
      />
    </>
  );
}

export function EntityLoader({
  entityId,
  useEntity,
  dispatchEditorState,
}: {
  entityId: string;
  useEntity: DataDataContextValue['useEntity'];
  dispatchEditorState: Dispatch<EntityEditorStateAction>;
}): null {
  const { entity, entityError } = useEntity(entityId);

  useEffect(() => {
    if (entity) {
      dispatchEditorState(new UpdateEntityAction(entityId, entity));
    }
  }, [entityId, entity, dispatchEditorState]);

  useEffect(() => {
    dispatchEditorState(
      new SetMessageLoadMessageAction(
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
  const editorState = useContext(EntityEditorStateContext);
  const dispatchEditorState = useContext(EntityEditorDispatchContext);
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

  return (
    <div id={entityId} data-entityid={entityId}>
      <ColumnAs
        as={Form}
        className="p-3 is-rounded has-background has-shadow"
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
        onReset={() => dispatchEditorState(new ResetEntityAction(entityId))}
      >
        {draftState.initMessage ? <Message {...draftState.initMessage} /> : null}
        {draftState.entityLoadMessage ? <Message {...draftState.entityLoadMessage} /> : null}
        <FormField htmlFor={nameId} label="Name">
          <InputText
            id={nameId}
            value={entity.name}
            onChange={(name) => dispatchEditorState(new SetNameAction(entityId, name))}
          />
        </FormField>
        <Divider />
        {entity.fields.map(({ fieldSpec, value }) => {
          const handleFieldChanged = (newValue: unknown) => {
            dispatchEditorState(new SetFieldAction(entityId, fieldSpec.name, newValue));
          };

          return (
            <EntityFieldEditor
              idPrefix={entityId}
              key={fieldSpec.name}
              schema={editorState.schema}
              fieldSpec={fieldSpec}
              value={value}
              onValueChanged={handleFieldChanged}
            />
          );
        })}

        <Row gap={1}>
          <Button kind="primary" type="submit" disabled={!entity.name} loading={submitLoading}>
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

function createAdminEntity(
  draftState: EntityEditorDraftState
): AdminEntityCreate | AdminEntityUpdate {
  const entityState = draftState.entity;
  if (!entityState) throw new Error('No entity in state');

  let result: AdminEntityCreate | AdminEntityUpdate;
  if (entityState.version === 0) {
    result = {
      id: draftState.id,
      _type: entityState.entitySpec.name,
      _name: entityState.name,
      _version: entityState.version,
    };
  } else {
    const { id } = draftState;
    if (!id) {
      throw new Error('Expected id');
    }
    result = { id, _type: entityState.entitySpec.name };
    if (entityState.name !== entityState.initialName) {
      result._name = entityState.name;
    }
  }
  for (const { fieldSpec, value, initialValue } of entityState.fields) {
    if (value !== initialValue) {
      result[fieldSpec.name] = value;
    }
  }
  return result;
}

async function submitEntity(
  draftState: EntityEditorDraftState,
  setSubmitLoading: Dispatch<SetStateAction<boolean>>,
  setSubmitMessage: Dispatch<SetStateAction<MessageItem | null>>,
  createEntity: DataDataContextValue['createEntity'],
  updateEntity: DataDataContextValue['updateEntity'],
  dispatchEditorState: Dispatch<EntityEditorStateAction>
) {
  setSubmitLoading(true);
  const entity = createAdminEntity(draftState);
  const isNew = entity._version === 0;
  const result = await (isNew
    ? createEntity(entity as AdminEntityCreate)
    : updateEntity(entity as AdminEntityUpdate));

  if (result.isOk()) {
    dispatchEditorState(new EntityUpsertedAction(draftState.id));
  } else {
    setSubmitMessage({
      kind: 'danger',
      title: isNew ? 'Failed creating entity' : 'Failed saving entity',
      message: `${result.error}: ${result.message}`,
    });
  }
  setSubmitLoading(false);
}
