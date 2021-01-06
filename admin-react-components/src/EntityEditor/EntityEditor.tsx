import {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  EntityTypeSpecification,
  FieldSpecification,
  isStringField,
  Schema,
} from '@datadata/core';
import React, { useState } from 'react';
import { Form, FormField, InputText } from '..';
import { InputSubmit } from '../InputSubmit/InputSubmit';

interface NewEntity {
  _type: string;
}

export interface EntityEditorProps {
  entity: NewEntity | AdminEntity;
  onSubmit: (entity: AdminEntityCreate | AdminEntityUpdate) => void;
  schema: Schema;
}

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

export function EntityEditor({ entity, schema, onSubmit }: EntityEditorProps): JSX.Element {
  const { _type: type } = entity;
  const entitySpec = schema.getEntityTypeSpecification(type);
  if (!entitySpec) {
    throw new Error(`No such entity type in schema (${type})`);
  }

  const [state, setState] = useState(() => createInitialState(entitySpec, entity));

  return (
    <Form onSubmit={() => onSubmit(createAdminEntity(entity, state))}>
      <FormField label="Name">
        <InputText value={state.name} onChange={(x) => setState({ ...state, name: x })} />
      </FormField>
      <hr />
      {state.fields.map(({ fieldSpec, value, initialValue }, index) => {
        if (isStringField(fieldSpec, value)) {
          return (
            <FormField key={fieldSpec.name} label={fieldSpec.name}>
              <InputText
                value={value}
                onChange={(x) => {
                  const newFields = [...state.fields];
                  newFields[index] = { fieldSpec, value: x, initialValue };
                  setState({ ...state, fields: newFields });
                }}
              />
            </FormField>
          );
        }
        throw new Error(`No support for fieldSpec ${fieldSpec.type} (list: ${!!fieldSpec.list})`);
      })}

      <InputSubmit value="Save" disabled={!state.name} />
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
