import type {
  AdminSchema,
  AdminSchemaSpecificationUpdate,
  AdminEntityTypeSpecificationUpdate,
  AdminValueTypeSpecificationUpdate,
  AdminValueTypeSpecification,
} from '@jonasb/datadata-core';
import { FieldType } from '@jonasb/datadata-core';

export interface SchemaTypeSelector {
  kind: 'entity' | 'value';
  typeName: string;
}

export interface SchemaFieldSelector extends SchemaTypeSelector {
  fieldName: string;
}

export interface SchemaTypeDraft {
  name: string;
  status: 'new' | '' | 'changed';
  adminOnly: boolean;
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
  required: boolean;
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
  if (state.status === 'new') return state.status;
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

  constructor({ kind, typeName }: SchemaTypeSelector) {
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

abstract class FieldAction extends TypeAction {
  fieldName: string;

  constructor(fieldSelector: SchemaFieldSelector) {
    super(fieldSelector);
    this.fieldName = fieldSelector.fieldName;
  }

  reduceType(
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft>
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft> {
    const fieldIndex = typeDraft.fields.findIndex((it) => it.name === this.fieldName);
    if (fieldIndex < 0) throw new Error(`No such field ${this.fieldName} in type ${this.typeName}`);
    const currentFieldDraft = typeDraft.fields[fieldIndex];

    const newFieldDraft = this.reduceField(currentFieldDraft);
    if (newFieldDraft === currentFieldDraft) {
      return typeDraft;
    }

    const newFields = [...typeDraft.fields];
    newFields[fieldIndex] = newFieldDraft;

    const newTypeDraft = { ...typeDraft, fields: newFields };
    return newTypeDraft;
  }

  abstract reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft>;
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
      adminOnly: false,
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

  constructor(typeSelector: SchemaTypeSelector, fieldName: string) {
    super(typeSelector);
    this.fieldName = fieldName;
  }

  reduceType(typeSpec: Readonly<SchemaEntityTypeDraft>): Readonly<SchemaEntityTypeDraft> {
    const field: SchemaFieldDraft = {
      name: this.fieldName,
      status: 'new',
      type: FieldType.String,
      list: false,
      required: false,
    };

    const fields = [...typeSpec.fields, field];

    return { ...typeSpec, fields };
  }
}

class ChangeFieldRequiredAction extends FieldAction {
  required: boolean;

  constructor(fieldSelector: SchemaFieldSelector, required: boolean) {
    super(fieldSelector);
    this.required = required;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (fieldDraft.required === this.required) {
      return fieldDraft;
    }

    return { ...fieldDraft, required: this.required };
  }
}

class ChangeFieldTypeAction extends FieldAction {
  fieldType: FieldType;
  list: boolean;

  constructor(fieldSelector: SchemaFieldSelector, fieldType: FieldType, list: boolean) {
    super(fieldSelector);
    this.fieldType = fieldType;
    this.list = list;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (fieldDraft.type === this.fieldType && fieldDraft.list === this.list) {
      return fieldDraft;
    }

    return { ...fieldDraft, type: this.fieldType, list: this.list };
  }
}

class ChangeTypeAdminOnlyAction extends TypeAction {
  adminOnly: boolean;

  constructor(typeSelector: SchemaTypeSelector, adminOnly: boolean) {
    super(typeSelector);
    this.adminOnly = adminOnly;
  }

  reduceType(typeDraft: Readonly<SchemaEntityTypeDraft>): Readonly<SchemaEntityTypeDraft> {
    if (typeDraft.adminOnly === this.adminOnly) {
      return typeDraft;
    }
    return { ...typeDraft, adminOnly: this.adminOnly };
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
    const entityTypes = this.schema.spec.entityTypes.map((entityTypeSpec) =>
      this.convertField('entity', entityTypeSpec)
    );

    const valueTypes = this.schema.spec.valueTypes.map((valueTypeSpec) =>
      this.convertField('value', valueTypeSpec)
    );

    if (!this.force && state.schema) return state; //TODO handle update to schema

    return { ...state, status: '', schema: this.schema, entityTypes, valueTypes };
  }

  convertField<TKind extends 'entity' | 'value'>(
    kind: TKind,
    typeSpec: AdminEntityTypeSpecificationUpdate | AdminValueTypeSpecification
  ): SchemaTypeDraft & { kind: TKind } {
    return {
      kind,
      name: typeSpec.name,
      status: '',
      adminOnly: !!typeSpec.adminOnly,
      fields: typeSpec.fields.map<SchemaFieldDraft>((fieldSpec) => ({
        name: fieldSpec.name,
        status: '',
        type: fieldSpec.type as FieldType,
        list: !!fieldSpec.list,
        required: !!fieldSpec.required,
      })),
    };
  }
}

export const SchemaEditorActions = {
  AddType: AddTypeAction,
  AddTypeField: AddTypeFieldAction,
  ChangeFieldRequired: ChangeFieldRequiredAction,
  ChangeFieldType: ChangeFieldTypeAction,
  ChangeTypeAdminOnly: ChangeTypeAdminOnlyAction,
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
      required: draftField.required,
      ...(draftField.list ? { list: draftField.list } : undefined),
    };
  });

  return {
    name: draftType.name,
    adminOnly: draftType.adminOnly,
    fields,
  };
}
