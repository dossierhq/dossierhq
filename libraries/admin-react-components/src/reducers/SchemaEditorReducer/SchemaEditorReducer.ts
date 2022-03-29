import type { AdminSchema, AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import { FieldType } from '@jonasb/datadata-core';

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

// ACTION HELPERS

abstract class EntityTypeAction implements SchemaEditorStateAction {
  entityTypeName: string;

  constructor(entityTypeName: string) {
    this.entityTypeName = entityTypeName;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const entityTypeIndex = state.entityTypes.findIndex((it) => it.name === this.entityTypeName);
    if (entityTypeIndex < 0) throw new Error(`No such entity type ${this.entityTypeName}`);
    const currentEntityType = state.entityTypes[entityTypeIndex];

    const newEntityType = this.reduceEntityType(currentEntityType);
    if (newEntityType === currentEntityType) {
      return state;
    }

    const entityTypes = [...state.entityTypes];
    entityTypes[entityTypeIndex] = newEntityType;

    return { ...state, entityTypes };
  }

  abstract reduceEntityType(
    entityType: Readonly<SchemaEntityTypeDraft>
  ): Readonly<SchemaEntityTypeDraft>;
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

class AddEntityTypeFieldAction extends EntityTypeAction {
  fieldName: string;

  constructor(entityTypeName: string, fieldName: string) {
    super(entityTypeName);
    this.fieldName = fieldName;
  }

  reduceEntityType(entityType: Readonly<SchemaEntityTypeDraft>): Readonly<SchemaEntityTypeDraft> {
    const field: SchemaFieldDraft = {
      name: this.fieldName,
      type: FieldType.String,
      list: false,
    };

    const fields = [...entityType.fields, field];

    return { ...entityType, fields };
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
  AddEntityTypeField: AddEntityTypeFieldAction,
  UpdateSchemaSpecification: UpdateSchemaSpecificationAction,
};

// CONVERSION

export function getSchemaSpecificationUpdateFromEditorState(
  state: SchemaEditorState
): AdminSchemaSpecificationUpdate {
  return {
    entityTypes: state.entityTypes.map((draftType) => ({
      name: draftType.name,
      fields: draftType.fields.map((draftField) => ({
        name: draftField.name,
        type: draftField.type,
        list: draftField.list,
      })),
    })),
  };
}
