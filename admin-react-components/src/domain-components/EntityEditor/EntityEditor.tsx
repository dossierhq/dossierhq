import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  EntityTypeSpecification,
  FieldSpecification,
  Schema,
} from '@datadata/core';
import React, { useContext, useEffect, useState } from 'react';
import {
  Button,
  DataDataContext,
  Divider,
  EntityFieldEditor,
  Form,
  FormField,
  InputText,
} from '../..';
import type { DataDataContextValue } from '../..';

export interface EntityEditorProps {
  idPrefix?: string;
  entity: { id: string } | { type: string; isNew: true };
}

interface EntityEditorInnerProps {
  idPrefix: string;
  schema: Schema;
  initialEditorState: EntityEditorState;
  createEntity: DataDataContextValue['createEntity'];
  updateEntity: DataDataContextValue['updateEntity'];
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

export function EntityEditor({ idPrefix, entity }: EntityEditorProps): JSX.Element | null {
  const context = useContext(DataDataContext);
  const [resolvedIdPrefix] = useState(
    idPrefix
      ? idPrefix
      : 'id' in entity
      ? `entity-${entity.id}`
      : `new-entity-${String(Math.random()).slice(2)}`
  );
  const [initialEditorState, setInitialEditorState] = useState<EntityEditorState | null>(null);
  useEffect(() => {
    if (!context?.schema || !context?.getEntity || initialEditorState) {
      return;
    }
    if ('isNew' in entity) {
      const entitySpec = context.schema.getEntityTypeSpecification(entity.type);
      if (!entitySpec) {
        throw new Error(`No such entity type in schema (${entity.type})`);
      }
      setInitialEditorState(createEditorState(entitySpec, null));
    } else {
      (async () => {
        const result = await context.getEntity(entity.id, {});
        if (result.isOk()) {
          const { item } = result.value;
          const entitySpec = context.schema.getEntityTypeSpecification(item._type);
          if (!entitySpec) {
            throw new Error(`No such entity type in schema (${item._type})`);
          }
          setInitialEditorState(createEditorState(entitySpec, item));
        }
      })();
    }
  }, [context, entity, initialEditorState]);

  if (!context || !initialEditorState) {
    return null;
  }

  const { schema, createEntity, updateEntity } = context;

  return (
    <EntityEditorInner
      {...{
        idPrefix: resolvedIdPrefix,
        schema,
        initialEditorState,
        createEntity,
        updateEntity,
      }}
    />
  );
}

function EntityEditorInner({
  idPrefix,
  initialEditorState,
  schema,
  createEntity,
  updateEntity,
}: EntityEditorInnerProps): JSX.Element {
  const [state, setState] = useState(initialEditorState);

  const nameId = `${idPrefix}-_name`;

  return (
    <Form onSubmit={() => createOrSaveEntity(state, setState, createEntity, updateEntity)}>
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

      <Button className="bg-primary" type="submit" disabled={!state.name}>
        Save
      </Button>
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

async function createOrSaveEntity(
  editorState: EntityEditorState,
  setState: (state: EntityEditorState) => void,
  createEntity: DataDataContextValue['createEntity'],
  updateEntity: DataDataContextValue['updateEntity']
) {
  const entity = createAdminEntity(editorState);
  const result = await (editorState.isNew
    ? createEntity(entity as AdminEntityCreate, { publish: true })
    : updateEntity(entity as AdminEntityUpdate, { publish: true }));
  // TODO handle error
  if (result.isOk()) {
    setState(createEditorState(editorState.entitySpec, result.value));
  }
}
