import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  EntityTypeSpecification,
  FieldSpecification,
  Schema,
} from '@datadata/core';
import type { Dispatch, SetStateAction } from 'react';
import React, { useContext, useEffect, useState } from 'react';
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

export interface EntityEditorProps {
  idPrefix?: string;
  entity: { id: string } | { type: string; isNew: true };
  style?: React.CSSProperties;
}

interface EntityEditorInnerProps {
  idPrefix: string;
  style?: React.CSSProperties;
  schema: Schema;
  entitySelector: EntityEditorProps['entity'];
  useEntity: DataDataContextValue['useEntity'];
  createEntity: DataDataContextValue['createEntity'];
  updateEntity: DataDataContextValue['updateEntity'];
}

interface EntityEditorInnermostProps {
  idPrefix: string;
  style?: React.CSSProperties;
  schema: Schema;
  initialEditorState: EntityEditorState;
  createEntity: DataDataContextValue['createEntity'];
  updateEntity: DataDataContextValue['updateEntity'];
  onEntityIdCreated: (id: string) => void;
}

interface EntityEditorState {
  entitySpec: EntityTypeSpecification;
  isNew: boolean;
  id: string | null;
  name: string;
  initialName: string;
  fields: FieldEditorState[];
}

interface FieldEditorState {
  fieldSpec: FieldSpecification;
  value: unknown;
  initialValue: unknown;
}

export function EntityEditor({ idPrefix, entity, style }: EntityEditorProps): JSX.Element | null {
  const context = useContext(DataDataContext);
  const [resolvedIdPrefix] = useState(
    idPrefix
      ? idPrefix
      : 'id' in entity
      ? `entity-${entity.id}`
      : `new-entity-${String(Math.random()).slice(2)}`
  );

  if (!context) {
    return <Loader />;
  }

  const { schema, useEntity, createEntity, updateEntity } = context;

  return (
    <EntityEditorInner
      {...{
        idPrefix: resolvedIdPrefix,
        entitySelector: entity,
        style,
        schema,
        useEntity,
        createEntity,
        updateEntity,
      }}
    />
  );
}

function EntityEditorInner({
  idPrefix,
  schema,
  entitySelector,
  style,
  useEntity,
  createEntity,
  updateEntity,
}: EntityEditorInnerProps) {
  const [initErrorMessage, setInitErrorMessage] = useState<MessageItem | null>(null);
  const [initialEditorState, setInitialEditorState] = useState<EntityEditorState | null>(null);
  const [entityId, setEntityId] = useState(
    'isNew' in entitySelector ? undefined : entitySelector.id
  );
  const { entity, entityError } = useEntity(entityId);

  useEffect(() => {
    if (initialEditorState) {
      return;
    }
    if ('isNew' in entitySelector) {
      const entitySpec = schema.getEntityTypeSpecification(entitySelector.type);
      if (entitySpec) {
        setInitialEditorState(createEditorState(entitySpec, null));
      } else {
        setInitErrorMessage({
          kind: 'danger',
          message: `Can't create entity with unsupported type: ${entitySelector.type}`,
        });
      }
    } else if (entity) {
      const entitySpec = schema.getEntityTypeSpecification(entity._type);
      if (entitySpec) {
        setInitialEditorState(createEditorState(entitySpec, entity));
      } else {
        setInitErrorMessage({
          kind: 'danger',
          message: `Can't edit entity with unsupported type: ${entity._type}`,
        });
      }
    }
  }, [schema, entitySelector, entity, initialEditorState]);

  if (initErrorMessage) {
    return <Message {...initErrorMessage} />;
  }
  if (!initialEditorState && !entityError) {
    return <Loader />;
  }

  return (
    <>
      {entityError ? (
        <Message
          kind="danger"
          title="Failed loading entity"
          message={`${entityError.error}: ${entityError.message}`}
        />
      ) : null}
      {initialEditorState ? (
        <EntityEditorInnermost
          {...{
            idPrefix,
            initialEditorState,
            style,
            schema,
            createEntity,
            updateEntity,
            onEntityIdCreated: setEntityId,
          }}
        />
      ) : null}
    </>
  );
}

function EntityEditorInnermost({
  idPrefix,
  initialEditorState,
  style,
  schema,
  createEntity,
  updateEntity,
  onEntityIdCreated,
}: EntityEditorInnermostProps): JSX.Element {
  const [state, setState] = useState(initialEditorState);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<MessageItem | null>(null);

  const nameId = `${idPrefix}-_name`;

  return (
    <Form
      onSubmit={() =>
        submitEntity(
          state,
          setState,
          setSubmitLoading,
          setSubmitMessage,
          createEntity,
          updateEntity,
          onEntityIdCreated
        )
      }
      style={style}
    >
      <FormField htmlFor={nameId} label="Name">
        <InputText
          id={nameId}
          value={state.name}
          onChange={(x) => setState({ ...state, name: x })}
        />
      </FormField>
      <Divider />
      {state.fields.map(({ fieldSpec, value, initialValue }, index) => {
        const handleFieldChanged = (newValue: unknown) => {
          const newFields = [...state.fields];
          newFields[index] = { fieldSpec, value: newValue, initialValue };
          setState({ ...state, fields: newFields });
        };

        return (
          <EntityFieldEditor
            idPrefix={idPrefix}
            key={fieldSpec.name}
            schema={schema}
            fieldSpec={fieldSpec}
            value={value}
            onValueChanged={handleFieldChanged}
          />
        );
      })}

      <Button kind="primary" type="submit" disabled={!state.name} loading={submitLoading}>
        Save
      </Button>
      {submitMessage ? (
        <Message {...submitMessage} onDismiss={() => setSubmitMessage(null)} />
      ) : null}
    </Form>
  );
}

function createEditorState(
  entitySpec: EntityTypeSpecification,
  entity: AdminEntity | null
): EntityEditorState {
  return {
    entitySpec,
    isNew: !entity,
    id: entity?.id ?? null,
    name: entity?._name || '',
    initialName: entity?._name || '',
    fields: entitySpec.fields.map((fieldSpec) => {
      const value = entity?.[fieldSpec.name] ?? null;
      return { fieldSpec, value, initialValue: value };
    }),
  };
}

function createAdminEntity(state: EntityEditorState): AdminEntityCreate | AdminEntityUpdate {
  let result: AdminEntityCreate | AdminEntityUpdate;
  if (state.isNew) {
    result = { _type: state.entitySpec.name, _name: state.name };
  } else {
    const { id } = state;
    if (!id) {
      throw new Error('Expected id');
    }
    result = { id, _type: state.entitySpec.name };
    if (state.name !== state.initialName) {
      result._name = state.name;
    }
  }
  for (const { fieldSpec, value, initialValue } of state.fields) {
    if (value !== initialValue) {
      result[fieldSpec.name] = value;
    }
  }
  return result;
}

async function submitEntity(
  editorState: EntityEditorState,
  setState: (state: EntityEditorState) => void,
  setSubmitLoading: Dispatch<SetStateAction<boolean>>,
  setSubmitMessage: Dispatch<SetStateAction<MessageItem | null>>,
  createEntity: DataDataContextValue['createEntity'],
  updateEntity: DataDataContextValue['updateEntity'],
  onEntityIdCreated: (id: string) => void
) {
  try {
    setSubmitLoading(true);
    const entity = createAdminEntity(editorState);
    const result = await (editorState.isNew
      ? createEntity(entity as AdminEntityCreate, { publish: true })
      : updateEntity(entity as AdminEntityUpdate, { publish: true }));

    if (result.isOk()) {
      setState(createEditorState(editorState.entitySpec, result.value));
      if (editorState.isNew) {
        onEntityIdCreated(result.value.id);
      }
    } else {
      setSubmitMessage({
        kind: 'danger',
        title: editorState.isNew ? 'Failed creating entity' : 'Failed saving entity',
        message: `${result.error}: ${result.message}`,
      });
    }
  } catch (error) {
    setSubmitMessage({
      kind: 'danger',
      title: editorState.isNew ? 'Failed creating entity' : 'Failed saving entity',
      message: error.message,
    });
  } finally {
    setSubmitLoading(false);
  }
}
