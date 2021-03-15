import type { AdminEntityCreate, AdminEntityUpdate } from '@datadata/core';
import type { Dispatch, SetStateAction } from 'react';
import React, { useContext, useState } from 'react';
import {
  Button,
  DataDataContext,
  Divider,
  EntityFieldEditor,
  Form,
  FormField,
  InputText,
  Loader,
  Message,
} from '../..';
import type { DataDataContextValue, MessageItem } from '../..';
import type { EntityEditorState, EntityEditorStateAction } from './EntityEditorReducer';
import { SetFieldAction, SetNameAction } from './EntityEditorReducer';

export interface EntityEditorNewProps {
  editorState: EntityEditorState;
  dispatchEditorState: Dispatch<EntityEditorStateAction>;
  style?: React.CSSProperties;
}

interface EntityEditorInnerProps {
  style?: React.CSSProperties;
  editorState: EntityEditorNewProps['editorState'];
  dispatchEditorState: Dispatch<EntityEditorStateAction>;
  createEntity: DataDataContextValue['createEntity'];
  updateEntity: DataDataContextValue['updateEntity'];
}

export function EntityEditorNew({
  editorState,
  dispatchEditorState,
  style,
}: EntityEditorNewProps): JSX.Element | null {
  const context = useContext(DataDataContext);
  if (!context) {
    return <Loader />;
  }

  const { createEntity, updateEntity } = context;

  return (
    <EntityEditorInner
      {...{
        editorState,
        dispatchEditorState,
        style,
        createEntity,
        updateEntity,
      }}
    />
  );
}

function EntityEditorInner({
  editorState,
  dispatchEditorState,
  style,
  createEntity,
  updateEntity,
}: EntityEditorInnerProps): JSX.Element {
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<MessageItem | null>(null);

  const { entity } = editorState;

  if (!entity) {
    if (editorState.initMessage) {
      return <Message {...editorState.initMessage} />;
    }
    if (editorState.entityLoadMessage) {
      return <Message {...editorState.entityLoadMessage} />;
    }
    return <Loader />;
  }

  const nameId = `${editorState.id}-_name`;

  return (
    <Form
      onSubmit={() =>
        submitEntity(editorState, setSubmitLoading, setSubmitMessage, createEntity, updateEntity)
      }
      style={style}
    >
      {editorState.initMessage ? <Message {...editorState.initMessage} /> : null}
      {editorState.entityLoadMessage ? <Message {...editorState.entityLoadMessage} /> : null}
      <FormField htmlFor={nameId} label="Name">
        <InputText
          id={nameId}
          value={entity.name}
          onChange={(name) => dispatchEditorState(new SetNameAction(name))}
        />
      </FormField>
      <Divider />
      {entity.fields.map(({ fieldSpec, value }) => {
        const handleFieldChanged = (newValue: unknown) => {
          dispatchEditorState(new SetFieldAction(fieldSpec.name, newValue));
        };

        return (
          <EntityFieldEditor
            idPrefix={editorState.id}
            key={fieldSpec.name}
            schema={editorState.schema}
            fieldSpec={fieldSpec}
            value={value}
            onValueChanged={handleFieldChanged}
          />
        );
      })}

      <Button kind="primary" type="submit" disabled={!entity.name} loading={submitLoading}>
        Save
      </Button>
      {submitMessage ? (
        <Message {...submitMessage} onDismiss={() => setSubmitMessage(null)} />
      ) : null}
    </Form>
  );
}

function createAdminEntity(state: EntityEditorState): AdminEntityCreate | AdminEntityUpdate {
  const entityState = state.entity;
  if (!entityState) throw new Error('No entity in state');

  let result: AdminEntityCreate | AdminEntityUpdate;
  if (entityState.version === 0) {
    result = {
      _type: entityState.entitySpec.name,
      _name: entityState.name,
      _version: entityState.version,
    };
  } else {
    const { id } = state;
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
  editorState: EntityEditorState,
  setSubmitLoading: Dispatch<SetStateAction<boolean>>,
  setSubmitMessage: Dispatch<SetStateAction<MessageItem | null>>,
  createEntity: DataDataContextValue['createEntity'],
  updateEntity: DataDataContextValue['updateEntity']
) {
  setSubmitLoading(true);
  const entity = createAdminEntity(editorState);
  const isNew = entity._version === 0;
  const result = await (isNew
    ? createEntity(entity as AdminEntityCreate)
    : updateEntity(entity as AdminEntityUpdate));

  if (result.isError()) {
    setSubmitMessage({
      kind: 'danger',
      title: isNew ? 'Failed creating entity' : 'Failed saving entity',
      message: `${result.error}: ${result.message}`,
    });
  }
  setSubmitLoading(false);
}
