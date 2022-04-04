import type {
  AdminSchema,
  AdminSchemaSpecificationUpdate,
  AdminEntityTypeSpecificationUpdate,
  AdminValueTypeSpecificationUpdate,
} from '@jonasb/datadata-core';
import { FieldType } from '@jonasb/datadata-core';

export interface SchemaTypeDraft {
  name: string;
  status: 'new' | '' | 'changed';
  fields: readonly SchemaFieldDraft[];
}

export interface SchemaEntityTypeDraft extends SchemaTypeDraft {
  kind: 'entity';
}

export interface SchemaValueTypeDraft extends SchemaTypeDraft {
  kind: 'value';
}

export interface SchemaFieldDraft {
  name: string;
  status: 'new' | '' | 'changed';
  type: FieldType;
  list: boolean;
}

export interface SchemaEditorState {
  status: 'uninitialized' | 'changed' | '';
  schema: AdminSchema | null;

  entityTypes: SchemaEntityTypeDraft[];
  valueTypes: SchemaValueTypeDraft[];
}

export interface SchemaEditorStateAction {
  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState>;
}

export function initializeSchemaEditorState(): SchemaEditorState {
  return { status: 'uninitialized', schema: null, entityTypes: [], valueTypes: [] };
}

export function reduceSchemaEditorState(
  state: Readonly<SchemaEditorState>,
  action: SchemaEditorStateAction
): Readonly<SchemaEditorState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

// STATUS RESOLVERS

function resolveSchemaStatus(state: SchemaEditorState): SchemaEditorState['status'] {
  if (state.status === 'uninitialized') state.status;
  for (const type of [...state.entityTypes, ...state.valueTypes]) {
    if (type.status !== '') return 'changed';
  }
  return '';
}

function resolveTypeStatus(state: SchemaEntityTypeDraft): SchemaEntityTypeDraft['status'] {
  if (state.status === 'new') state.status;
  //TODO check field order
  for (const field of state.fields) {
    if (field.status !== '') return 'changed';
  }
  return '';
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

    let newEntityType = this.reduceEntityType(currentEntityType);
    if (newEntityType === currentEntityType) {
      return state;
    }

    newEntityType = { ...newEntityType, status: resolveTypeStatus(newEntityType) };

    const entityTypes = [...state.entityTypes];
    entityTypes[entityTypeIndex] = newEntityType;

    const newState = { ...state, entityTypes };
    newState.status = resolveSchemaStatus(newState);
    return newState;
  }

  abstract reduceEntityType(
    entityType: Readonly<SchemaEntityTypeDraft>
  ): Readonly<SchemaEntityTypeDraft>;
}

// ACTIONS

class AddTypeAction implements SchemaEditorStateAction {
  kind: 'entity' | 'value';
  name: string;

  constructor(kind: 'entity' | 'value', name: string) {
    this.kind = kind;
    this.name = name;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const typeDraft = {
      status: 'new',
      name: this.name,
      fields: [],
    } as const;
    const newState = { ...state };
    if (this.kind === 'entity') {
      newState.entityTypes = [...newState.entityTypes, { ...typeDraft, kind: 'entity' }];
      newState.entityTypes.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      newState.valueTypes = [...newState.valueTypes, { ...typeDraft, kind: 'value' }];
      newState.valueTypes.sort((a, b) => a.name.localeCompare(b.name));
    }
    newState.status = resolveSchemaStatus(newState);
    return newState;
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
      status: 'new',
      type: FieldType.String,
      list: false,
    };

    const fields = [...entityType.fields, field];

    return { ...entityType, fields };
  }
}

class UpdateSchemaSpecificationAction implements SchemaEditorStateAction {
  schema: AdminSchema;
  force: boolean;

  constructor(schema: AdminSchema, options?: { force: boolean }) {
    this.schema = schema;
    this.force = !!options?.force;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const entityTypes = this.schema.spec.entityTypes.map<SchemaEntityTypeDraft>((entityType) => ({
      kind: 'entity',
      name: entityType.name,
      status: '',
      fields: entityType.fields.map<SchemaFieldDraft>((field) => ({
        name: field.name,
        status: '',
        type: field.type as FieldType,
        list: !!field.list,
      })),
    }));

    const valueTypes = this.schema.spec.valueTypes.map<SchemaValueTypeDraft>((valueType) => ({
      kind: 'value',
      name: valueType.name,
      status: '',
      fields: valueType.fields.map<SchemaFieldDraft>((field) => ({
        name: field.name,
        status: '',
        type: field.type as FieldType,
        list: !!field.list,
      })),
    }));

    if (!this.force && state.schema) return state; //TODO handle update to schema

    return { ...state, status: '', schema: this.schema, entityTypes, valueTypes };
  }
}

export const SchemaEditorActions = {
  AddType: AddTypeAction,
  AddEntityTypeField: AddEntityTypeFieldAction,
  UpdateSchemaSpecification: UpdateSchemaSpecificationAction,
};

// CONVERSION

export function getSchemaSpecificationUpdateFromEditorState(
  state: SchemaEditorState
): AdminSchemaSpecificationUpdate {
  const update: AdminSchemaSpecificationUpdate = {};

  const entityTypes = state.entityTypes
    .filter((it) => it.status !== '')
    .map(getTypeUpdateFromEditorState);

  const valueTypes = state.valueTypes
    .filter((it) => it.status !== '')
    .map(getTypeUpdateFromEditorState);

  if (entityTypes.length > 0) {
    update.entityTypes = entityTypes;
  }
  if (valueTypes.length > 0) {
    update.valueTypes = valueTypes;
  }

  return update;
}

function getTypeUpdateFromEditorState(
  draftType: SchemaTypeDraft
): AdminEntityTypeSpecificationUpdate | AdminValueTypeSpecificationUpdate {
  const fields = draftType.fields.map((draftField) => {
    return {
      name: draftField.name,
      type: draftField.type,
      ...(draftField.list ? { list: draftField.list } : undefined),
    };
  });

  return {
    name: draftType.name,
    fields,
  };
}
