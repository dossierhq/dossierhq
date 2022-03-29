import type { AdminSchema, FieldType } from '@jonasb/datadata-core';

export interface SchemaTypeDraft {
  name: string;
  fields: SchemaFieldDraft[];
}

export interface SchemaEntityTypeDraft extends SchemaTypeDraft {
  type: 'entity';
}

export interface SchemaValueTypeDraft extends SchemaTypeDraft {
  type: 'value';
}

export interface SchemaFieldDraft {
  name: string;
  type: FieldType;
  list: boolean;
}

export interface SchemaEditorState {
  schema: AdminSchema | null;

  entityTypes: SchemaEntityTypeDraft[];
  valueTypes: SchemaValueTypeDraft[];
}

export interface SchemaEditorStateAction {
  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState>;
}

export function initializeSchemaEditorState(): SchemaEditorState {
  return { schema: null, entityTypes: [], valueTypes: [] };
}

export function reduceSchemaEditorState(
  state: Readonly<SchemaEditorState>,
  action: SchemaEditorStateAction
): Readonly<SchemaEditorState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

// ACTIONS

class AddEntityTypeAction implements SchemaEditorStateAction {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const entityType: SchemaEntityTypeDraft = { type: 'entity', name: this.name, fields: [] };
    const entityTypes = [...state.entityTypes, entityType];
    entityTypes.sort((a, b) => a.name.localeCompare(b.name));
    return { ...state, entityTypes };
  }
}

class UpdateSchemaSpecificationAction implements SchemaEditorStateAction {
  schema: AdminSchema;

  constructor(schema: AdminSchema) {
    this.schema = schema;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const entityTypes = this.schema.spec.entityTypes.map<SchemaEntityTypeDraft>((entityType) => ({
      type: 'entity',
      name: entityType.name,
      fields: entityType.fields.map<SchemaFieldDraft>((field) => ({
        name: field.name,
        type: field.type as FieldType,
        list: !!field.list,
      })),
    }));

    const valueTypes = this.schema.spec.valueTypes.map<SchemaValueTypeDraft>((valueType) => ({
      type: 'value',
      name: valueType.name,
      fields: valueType.fields.map<SchemaFieldDraft>((field) => ({
        name: field.name,
        type: field.type as FieldType,
        list: !!field.list,
      })),
    }));

    if (state.schema) return state; //TODO handle update to schema

    return { ...state, schema: this.schema, entityTypes, valueTypes };
  }
}

export const SchemaEditorActions = {
  AddEntityType: AddEntityTypeAction,
  UpdateSchemaSpecification: UpdateSchemaSpecificationAction,
};
