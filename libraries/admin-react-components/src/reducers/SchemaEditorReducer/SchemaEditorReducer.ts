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

function resolveTypeStatus(state: SchemaTypeDraft): SchemaTypeDraft['status'] {
  if (state.status === 'new') state.status;
  //TODO check field order
  for (const field of state.fields) {
    if (field.status !== '') return 'changed';
  }
  return '';
}

// ACTION HELPERS

abstract class TypeAction implements SchemaEditorStateAction {
  kind: 'entity' | 'value';
  typeName: string;

  constructor(kind: 'entity' | 'value', typeName: string) {
    this.kind = kind;
    this.typeName = typeName;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const typeCollection = this.kind === 'entity' ? state.entityTypes : state.valueTypes;
    const typeIndex = typeCollection.findIndex((it) => it.name === this.typeName);
    if (typeIndex < 0) throw new Error(`No such ${this.kind} type ${this.typeName}`);
    const currentTypeDraft = typeCollection[typeIndex];

    let newTypeDraft = this.reduceType(currentTypeDraft);
    if (newTypeDraft === currentTypeDraft) {
      return state;
    }

    newTypeDraft = { ...newTypeDraft, status: resolveTypeStatus(newTypeDraft) };

    const newTypeCollection = [...typeCollection];
    newTypeCollection[typeIndex] = newTypeDraft;

    const newState = { ...state };
    if (this.kind === 'entity') {
      newState.entityTypes = newTypeCollection as SchemaEntityTypeDraft[];
    } else {
      newState.valueTypes = newTypeCollection as SchemaValueTypeDraft[];
    }
    newState.status = resolveSchemaStatus(newState);
    return newState;
  }

  abstract reduceType(
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft>
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft>;
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

class AddTypeFieldAction extends TypeAction {
  fieldName: string;

  constructor(kind: 'entity' | 'value', typeName: string, fieldName: string) {
    super(kind, typeName);
    this.fieldName = fieldName;
  }

  reduceType(entityType: Readonly<SchemaEntityTypeDraft>): Readonly<SchemaEntityTypeDraft> {
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
  AddTypeField: AddTypeFieldAction,
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
