import type {
  AdminEntityTypeSpecificationUpdate,
  AdminSchema,
  AdminSchemaSpecificationUpdate,
  AdminValueTypeSpecification,
  AdminValueTypeSpecificationUpdate,
} from '@jonasb/datadata-core';
import { FieldType, RichTextNodeType } from '@jonasb/datadata-core';
import isEqual from 'lodash/isEqual';

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
  multiline?: boolean;
  richTextNodes?: string[];
  entityTypes?: string[];
  valueTypes?: string[];
}

export interface SchemaEditorState {
  status: 'uninitialized' | 'changed' | '';
  schema: AdminSchema | null;
  schemaWillBeUpdatedDueToSave: boolean;

  entityTypes: SchemaEntityTypeDraft[];
  valueTypes: SchemaValueTypeDraft[];

  activeSelector: null | SchemaTypeSelector;
  activeSelectorEditorScrollSignal: number;
  activeSelectorMenuScrollSignal: number;
}

export interface SchemaEditorStateAction {
  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState>;
}

export function initializeSchemaEditorState(): SchemaEditorState {
  return {
    status: 'uninitialized',
    schema: null,
    schemaWillBeUpdatedDueToSave: false,
    entityTypes: [],
    valueTypes: [],
    activeSelector: null,
    activeSelectorMenuScrollSignal: 0,
    activeSelectorEditorScrollSignal: 0,
  };
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
    const newState: SchemaEditorState = {
      ...state,
      activeSelector: { kind: this.kind, typeName: this.name },
      activeSelectorMenuScrollSignal: state.activeSelectorMenuScrollSignal + 1,
      activeSelectorEditorScrollSignal: state.activeSelectorEditorScrollSignal + 1,
    };
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

class AddFieldAction extends TypeAction {
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
      multiline: false,
      list: false,
      required: false,
    };

    const fields = [...typeSpec.fields, field];

    return { ...typeSpec, fields };
  }
}

class ChangeFieldAllowedEntityTypesAction extends FieldAction {
  entityTypes: string[];

  constructor(fieldSelector: SchemaFieldSelector, entityTypes: string[]) {
    super(fieldSelector);
    this.entityTypes = entityTypes;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (isEqual(fieldDraft.entityTypes, this.entityTypes)) {
      return fieldDraft;
    }

    return { ...fieldDraft, entityTypes: this.entityTypes };
  }
}

class ChangeFieldAllowedRichTextNodesAction extends FieldAction {
  richTextNodes: string[];

  constructor(fieldSelector: SchemaFieldSelector, richTextNodes: string[]) {
    super(fieldSelector);
    this.richTextNodes = richTextNodes;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (isEqual(fieldDraft.richTextNodes, this.richTextNodes)) {
      return fieldDraft;
    }

    let newRichTextNodes = this.richTextNodes;

    if (newRichTextNodes.length > 0) {
      const basicNodes = [RichTextNodeType.root, RichTextNodeType.paragraph, RichTextNodeType.text];
      const missingBasicNodes = basicNodes.filter((it) => !newRichTextNodes.includes(it));
      if (missingBasicNodes.length > 0) {
        newRichTextNodes = [...newRichTextNodes];
        newRichTextNodes.push(...missingBasicNodes);
      }
    }

    return { ...fieldDraft, richTextNodes: newRichTextNodes };
  }
}

class ChangeFieldAllowedValueTypesAction extends FieldAction {
  valueTypes: string[];

  constructor(fieldSelector: SchemaFieldSelector, valueTypes: string[]) {
    super(fieldSelector);
    this.valueTypes = valueTypes;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (isEqual(fieldDraft.valueTypes, this.valueTypes)) {
      return fieldDraft;
    }

    return { ...fieldDraft, valueTypes: this.valueTypes };
  }
}

class ChangeFieldMultilineAction extends FieldAction {
  multiline: boolean;

  constructor(fieldSelector: SchemaFieldSelector, multiline: boolean) {
    super(fieldSelector);
    this.multiline = multiline;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (fieldDraft.multiline === this.multiline) {
      return fieldDraft;
    }

    return { ...fieldDraft, multiline: this.multiline };
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

    const newFieldDraft = { ...fieldDraft, type: this.fieldType, list: this.list };

    if (this.fieldType === FieldType.String) {
      newFieldDraft.multiline = !!newFieldDraft.multiline;
    } else {
      delete newFieldDraft.multiline;
    }

    if (this.fieldType === FieldType.RichText) {
      newFieldDraft.richTextNodes = [];
    } else {
      delete newFieldDraft.richTextNodes;
    }

    if (this.fieldType === FieldType.EntityType) {
      newFieldDraft.entityTypes = [];
    } else {
      delete newFieldDraft.entityTypes;
    }

    if (this.fieldType === FieldType.ValueType) {
      newFieldDraft.valueTypes = [];
    } else {
      delete newFieldDraft.valueTypes;
    }

    return newFieldDraft;
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

class DeleteFieldAction extends TypeAction {
  fieldName: string;

  constructor({ fieldName, ...typeSelector }: SchemaFieldSelector) {
    super(typeSelector);
    this.fieldName = fieldName;
  }

  reduceType(typeDraft: Readonly<SchemaEntityTypeDraft>): Readonly<SchemaEntityTypeDraft> {
    const fields = typeDraft.fields.filter((fieldDraft) => fieldDraft.name !== this.fieldName);

    return { ...typeDraft, fields };
  }
}

class DeleteTypeAction implements SchemaEditorStateAction {
  selector: SchemaTypeSelector;

  constructor(selector: SchemaTypeSelector) {
    this.selector = selector;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    let { activeSelector, entityTypes, valueTypes } = state;
    if (this.selector.kind === 'entity') {
      entityTypes = entityTypes.filter((it) => it.name !== this.selector.typeName);
    } else {
      valueTypes = valueTypes.filter((it) => it.name !== this.selector.typeName);
    }

    if (isEqual(activeSelector, this.selector)) {
      activeSelector = null;
    }

    const newState = { ...state, activeSelector, entityTypes, valueTypes };
    newState.status = resolveSchemaStatus(newState);
    return newState;
  }
}

class RenameFieldAction extends FieldAction {
  newFieldName: string;

  constructor(fieldSelector: SchemaFieldSelector, newFieldName: string) {
    super(fieldSelector);
    this.newFieldName = newFieldName;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (this.newFieldName === fieldDraft.name) {
      return fieldDraft;
    }
    return { ...fieldDraft, name: this.newFieldName };
  }
}

class RenameTypeAction extends TypeAction {
  name: string;

  constructor(selector: SchemaTypeSelector, name: string) {
    super(selector);
    this.name = name;
  }

  reduceType(
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft>
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft> {
    return { ...typeDraft, name: this.name };
  }

  override reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const superState = super.reduce(state);

    const newState: SchemaEditorState = {
      ...superState,
      activeSelector: { kind: this.kind, typeName: this.name },
      activeSelectorMenuScrollSignal: state.activeSelectorMenuScrollSignal + 1,
      activeSelectorEditorScrollSignal: state.activeSelectorEditorScrollSignal + 1,
    };

    if (this.kind === 'entity') {
      newState.entityTypes.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      newState.valueTypes.sort((a, b) => a.name.localeCompare(b.name));
    }
    return newState;
  }
}

class SetActiveSelectorAction implements SchemaEditorStateAction {
  selector: SchemaTypeSelector | null;
  increaseMenuScrollSignal: boolean;
  increaseEditorScrollSignal: boolean;

  constructor(
    selector: SchemaTypeSelector | null,
    increaseMenuScrollSignal: boolean,
    increaseEditorScrollSignal: boolean
  ) {
    this.selector = selector;
    this.increaseMenuScrollSignal = increaseMenuScrollSignal;
    this.increaseEditorScrollSignal = increaseEditorScrollSignal;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    if (isEqual(state.activeSelector, this.selector)) {
      return state;
    }
    let { activeSelectorMenuScrollSignal, activeSelectorEditorScrollSignal } = state;
    if (this.increaseMenuScrollSignal) {
      activeSelectorMenuScrollSignal += 1;
    }
    if (this.increaseEditorScrollSignal) {
      activeSelectorEditorScrollSignal += 1;
    }
    return {
      ...state,
      activeSelector: this.selector,
      activeSelectorMenuScrollSignal,
      activeSelectorEditorScrollSignal,
    };
  }
}

class SetNextUpdateSchemaSpecificationIsDueToSaveAction implements SchemaEditorStateAction {
  schemaWillBeUpdatedDueToSave: boolean;

  constructor(schemaWillBeUpdatedDueToSave: boolean) {
    this.schemaWillBeUpdatedDueToSave = schemaWillBeUpdatedDueToSave;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    if (state.schemaWillBeUpdatedDueToSave === this.schemaWillBeUpdatedDueToSave) return state;
    return { ...state, schemaWillBeUpdatedDueToSave: this.schemaWillBeUpdatedDueToSave };
  }
}

class UpdateSchemaSpecificationAction implements SchemaEditorStateAction {
  schema: AdminSchema;

  constructor(schema: AdminSchema) {
    this.schema = schema;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const entityTypes = this.schema.spec.entityTypes.map((entityTypeSpec) =>
      this.convertField('entity', entityTypeSpec)
    );

    const valueTypes = this.schema.spec.valueTypes.map((valueTypeSpec) =>
      this.convertField('value', valueTypeSpec)
    );

    if (!state.schemaWillBeUpdatedDueToSave && state.schema) return state; //TODO handle update to schema

    return {
      ...state,
      status: '',
      schema: this.schema,
      schemaWillBeUpdatedDueToSave: false,
      entityTypes,
      valueTypes,
    };
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
      fields: typeSpec.fields.map<SchemaFieldDraft>((fieldSpec) => {
        const fieldDraft: SchemaFieldDraft = {
          name: fieldSpec.name,
          status: '',
          type: fieldSpec.type as FieldType,
          list: !!fieldSpec.list,
          required: !!fieldSpec.required,
        };
        if (fieldSpec.type === FieldType.String) {
          fieldDraft.multiline = !!fieldSpec.multiline;
        }
        if (fieldSpec.type === FieldType.RichText) {
          fieldDraft.richTextNodes = fieldSpec.richTextNodes ?? [];
        }
        if (fieldSpec.type === FieldType.EntityType) {
          fieldDraft.entityTypes = fieldSpec.entityTypes ?? [];
        }
        if (fieldSpec.type === FieldType.ValueType) {
          fieldDraft.valueTypes = fieldSpec.valueTypes ?? [];
        }
        return fieldDraft;
      }),
    };
  }
}

export const SchemaEditorActions = {
  AddType: AddTypeAction,
  AddField: AddFieldAction,
  ChangeFieldAllowedEntityTypes: ChangeFieldAllowedEntityTypesAction,
  ChangeFieldAllowedRichTextNodes: ChangeFieldAllowedRichTextNodesAction,
  ChangeFieldAllowedValueTypes: ChangeFieldAllowedValueTypesAction,
  ChangeFieldMultiline: ChangeFieldMultilineAction,
  ChangeFieldRequired: ChangeFieldRequiredAction,
  ChangeFieldType: ChangeFieldTypeAction,
  ChangeTypeAdminOnly: ChangeTypeAdminOnlyAction,
  DeleteField: DeleteFieldAction,
  DeleteType: DeleteTypeAction,
  RenameField: RenameFieldAction,
  RenameType: RenameTypeAction,
  SetActiveSelector: SetActiveSelectorAction,
  SetNextUpdateSchemaSpecificationIsDueToSave: SetNextUpdateSchemaSpecificationIsDueToSaveAction,
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
      ...(draftField.type === FieldType.String ? { multiline: draftField.multiline } : undefined),
      ...(draftField.type === FieldType.RichText
        ? { richTextNodes: draftField.richTextNodes }
        : undefined),
      ...(draftField.type === FieldType.EntityType //TODO or rich text
        ? { entityTypes: draftField.entityTypes ?? [] }
        : undefined),
      ...(draftField.type === FieldType.ValueType //TODO or rich text
        ? { valueType: draftField.valueTypes ?? [] }
        : undefined),
    };
  });

  return {
    name: draftType.name,
    adminOnly: draftType.adminOnly,
    fields,
  };
}
