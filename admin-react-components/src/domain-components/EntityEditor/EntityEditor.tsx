import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  EntityTypeSpecification,
  FieldSpecification,
  Schema,
} from '@datadata/core';
import React, { useContext, useState } from 'react';
import {
  Button,
  DataDataContext,
  Divider,
  EntityFieldEditor,
  Form,
  FormField,
  InputText,
} from '../..';

interface NewEntity {
  _type: string;
}

export interface EntityEditorProps {
  idPrefix?: string;
  entity: NewEntity | AdminEntity;
  onSubmit: (entity: AdminEntityCreate | AdminEntityUpdate) => void;
}

type EntityEditorContentsProps = Pick<EntityEditorProps, 'entity' | 'onSubmit'> & {
  idPrefix: string;
  schema: Schema;
  entitySpec: EntityTypeSpecification;
};

interface EntityEditorState {
  name: string;
  initialName: string;
  fields: FieldEditorState[];
}

interface FieldEditorState {
  fieldSpec: FieldSpecification;
  value: unknown;
  initialValue: unknown;
}

export function EntityEditor({
  idPrefix,
  entity,
  onSubmit,
}: EntityEditorProps): JSX.Element | null {
  const context = useContext(DataDataContext);
  const [resolvedIdPrefix] = useState(
    idPrefix
      ? idPrefix
      : 'id' in entity
      ? `entity-${entity.id}`
      : `new-entity-${String(Math.random()).slice(2)}`
  );

  if (!context) {
    return null;
  }

  const { schema } = context;
  const { _type: type } = entity;
  const entitySpec = schema.getEntityTypeSpecification(type);
  if (!entitySpec) {
    throw new Error(`No such entity type in schema (${type})`);
  }

  return (
    <EntityEditorContents
      {...{ idPrefix: resolvedIdPrefix, entity, schema, entitySpec, onSubmit }}
    />
  );
}

function EntityEditorContents({
  idPrefix,
  entity,
  schema,
  entitySpec,
  onSubmit,
}: EntityEditorContentsProps): JSX.Element {
  const [state, setState] = useState(() => createInitialState(entitySpec, entity));

  const nameId = `${idPrefix}-_name`;

  return (
    <Form onSubmit={() => onSubmit(createAdminEntity(entity, state))}>
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

function createInitialState(
  entitySpec: EntityTypeSpecification,
  entity: NewEntity | AdminEntity
): EntityEditorState {
  const adminEntity = 'id' in entity ? entity : null;
  return {
    name: adminEntity?._name || '',
    initialName: adminEntity?._name || '',
    fields: entitySpec.fields.map((fieldSpec) => {
      const value = adminEntity?.[fieldSpec.name] ?? null;
      return { fieldSpec, value, initialValue: value };
    }),
  };
}

function createAdminEntity(
  originalEntity: NewEntity | AdminEntity,
  state: EntityEditorState
): AdminEntityCreate | AdminEntityUpdate {
  let result: AdminEntityCreate | AdminEntityUpdate;
  if ('id' in originalEntity) {
    result = { id: originalEntity.id, _type: originalEntity._type };
    if (state.name !== state.initialName) {
      result._name = state.name;
    }
  } else {
    result = { _type: originalEntity._type, _name: state.name };
  }
  for (const { fieldSpec, value, initialValue } of state.fields) {
    if (value !== initialValue) {
      result[fieldSpec.name] = value;
    }
  }
  return result;
}
