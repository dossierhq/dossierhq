import type {
  AdminEntityTypeSpecification,
  AdminEntityTypeSpecificationUpdate,
  AdminFieldSpecification,
  AdminSchema,
  AdminSchemaSpecificationUpdate,
  AdminValueTypeSpecification,
  AdminValueTypeSpecificationUpdate,
  SchemaIndexSpecification,
  SchemaPatternSpecification,
} from '@dossierhq/core';
import { FieldType, RichTextNodeType, assertIsDefined } from '@dossierhq/core';
import isEqual from 'lodash/isEqual.js';

export type SchemaSelector =
  | SchemaFieldSelector
  | SchemaTypeSelector
  | SchemaIndexSelector
  | SchemaPatternSelector;

export interface SchemaTypeSelector {
  kind: 'entity' | 'value';
  typeName: string;
}

export interface SchemaFieldSelector extends SchemaTypeSelector {
  fieldName: string;
}

export interface SchemaIndexSelector {
  kind: 'index';
  name: string;
}

export interface SchemaPatternSelector {
  kind: 'pattern';
  name: string;
}

export interface SchemaTypeDraft {
  name: string;
  status: 'new' | '' | 'changed';
  adminOnly: boolean;
  fields: readonly SchemaFieldDraft[];
}

export interface SchemaEntityTypeDraft extends SchemaTypeDraft {
  kind: 'entity';
  authKeyPattern: string | null;
  existingAuthKeyPattern: string | null;
  nameField: string | null;
  existingNameField: string | null;
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
  adminOnly: boolean;
  // string
  multiline?: boolean;
  index?: string | null;
  matchPattern?: string | null;
  values?: { value: string }[];
  // rich text
  richTextNodesWithPlaceholders?: string[];
  existingRichTextNodesWithPlaceholders?: string[];
  // entity, rich text
  entityTypes?: string[];
  // rich text
  linkEntityTypes?: string[];
  // value item, rich text
  valueTypes?: string[];
  // number
  integer?: boolean;
  //
  existingFieldSpec: AdminFieldSpecification | null;
}

export interface SchemaIndexDraft extends SchemaIndexSpecification {
  status: 'new' | '';
}

export interface SchemaPatternDraft extends SchemaPatternSpecification {
  status: 'new' | '' | 'changed';
  existingPatternSpec: SchemaPatternSpecification | null;
}

export interface SchemaEditorState {
  status: 'uninitialized' | 'changed' | '';
  schema: AdminSchema | null;
  schemaWillBeUpdatedDueToSave: boolean;

  entityTypes: SchemaEntityTypeDraft[];
  valueTypes: SchemaValueTypeDraft[];
  indexes: SchemaIndexDraft[];
  patterns: SchemaPatternDraft[];

  activeSelector: null | SchemaSelector;
  activeSelectorEditorScrollSignal: number;
  activeSelectorMenuScrollSignal: number;
}

export interface SchemaEditorStateAction {
  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState>;
}

interface NodePlaceholderConfig {
  name: string;
  nodes: string[];
}

export const RichTextNodePlaceholders: NodePlaceholderConfig[] = [
  [
    RichTextNodeType.root,
    RichTextNodeType.paragraph,
    RichTextNodeType.text,
    RichTextNodeType.linebreak,
  ],
  [RichTextNodeType.code, RichTextNodeType['code-highlight']],
  [RichTextNodeType.list, RichTextNodeType.listitem],
].map((nodes) => ({ name: nodes.join(', '), nodes }));

const RichTextNodesInPlaceholders = new Set(
  RichTextNodePlaceholders.flatMap((placeholder) => placeholder.nodes)
);

export const ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER = RichTextNodePlaceholders[0];

export function initializeSchemaEditorState(): SchemaEditorState {
  return {
    status: 'uninitialized',
    schema: null,
    schemaWillBeUpdatedDueToSave: false,
    entityTypes: [],
    valueTypes: [],
    indexes: [],
    patterns: [],
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
  for (const type of [
    ...state.entityTypes,
    ...state.valueTypes,
    ...state.indexes,
    ...state.patterns,
  ]) {
    if (type.status !== '') return 'changed';
  }
  return '';
}

function withResolvedSchemaStatus(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
  const newStatus = resolveSchemaStatus(state);
  if (newStatus === state.status) return state;
  return { ...state, status: newStatus };
}

function resolveTypeStatus(
  state: Readonly<SchemaEntityTypeDraft | SchemaValueTypeDraft>
): SchemaTypeDraft['status'] {
  if (state.status === 'new') return state.status;
  if (state.kind === 'entity') {
    if (state.nameField !== state.existingNameField) return 'changed';
    if (state.authKeyPattern !== state.existingAuthKeyPattern) return 'changed';
  }
  //TODO check field order
  for (const field of state.fields) {
    if (field.status !== '') return 'changed';
  }
  return '';
}

function withResolvedTypeStatus<T extends SchemaEntityTypeDraft | SchemaValueTypeDraft>(
  state: Readonly<T>
): Readonly<T> {
  const newStatus = resolveTypeStatus(state);
  if (newStatus === state.status) return state;
  return { ...state, status: newStatus };
}

function resolveFieldStatus(state: SchemaFieldDraft): SchemaFieldDraft['status'] {
  const { existingFieldSpec } = state;
  if (existingFieldSpec === null) {
    return 'new';
  }
  if (existingFieldSpec.required !== state.required) {
    return 'changed';
  }
  if (
    (existingFieldSpec.type === FieldType.Entity ||
      existingFieldSpec.type === FieldType.RichText) &&
    !isEqual(state.entityTypes, existingFieldSpec.entityTypes)
  ) {
    return 'changed';
  }
  if (
    (existingFieldSpec.type === FieldType.ValueItem ||
      existingFieldSpec.type === FieldType.RichText) &&
    !isEqual(state.valueTypes, existingFieldSpec.valueTypes)
  ) {
    return 'changed';
  }
  if (
    existingFieldSpec.type === FieldType.Number &&
    existingFieldSpec.integer !== !!state.integer
  ) {
    return 'changed';
  }
  if (existingFieldSpec.type === FieldType.RichText) {
    if (!isEqual(state.linkEntityTypes, existingFieldSpec.linkEntityTypes)) {
      return 'changed';
    }
    if (
      !isEqual(state.richTextNodesWithPlaceholders, state.existingRichTextNodesWithPlaceholders)
    ) {
      return 'changed';
    }
  }
  if (existingFieldSpec.type === FieldType.String) {
    if (state.matchPattern !== existingFieldSpec.matchPattern) {
      return 'changed';
    }
    if (!!state.multiline !== !!existingFieldSpec.multiline) {
      return 'changed';
    }
    if (!isEqual(state.values, existingFieldSpec.values)) {
      return 'changed';
    }
  }
  // TODO expand when supporting changing more properties of a field
  return '';
}

function withResolvedFieldStatus(state: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
  const newStatus = resolveFieldStatus(state);
  if (newStatus === state.status) return state;
  return { ...state, status: newStatus };
}

function resolvePatternStatus(state: Readonly<SchemaPatternDraft>): SchemaPatternDraft['status'] {
  if (!state.existingPatternSpec) {
    return 'new';
  }
  if (state.name !== state.existingPatternSpec.name) {
    return 'changed';
  }
  if (state.pattern !== state.existingPatternSpec.pattern) {
    return 'changed';
  }
  return '';
}

function withResolvedPatternStatus(
  state: Readonly<SchemaPatternDraft>
): Readonly<SchemaPatternDraft> {
  const newStatus = resolvePatternStatus(state);
  if (newStatus === state.status) return state;
  return { ...state, status: newStatus };
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

    return replaceFieldWithIndex(typeDraft, fieldIndex, withResolvedFieldStatus(newFieldDraft));
  }

  abstract reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft>;
}

abstract class PatternAction implements SchemaEditorStateAction {
  name: string;

  constructor({ name }: SchemaPatternSelector) {
    this.name = name;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const patternIndex = state.patterns.findIndex((it) => it.name === this.name);
    if (patternIndex < 0) throw new Error(`No such pattern ${this.name}`);
    const currentDraft = state.patterns[patternIndex];

    const newDraft = this.reducePattern(currentDraft);
    if (newDraft === currentDraft) {
      return state;
    }

    const newPatterns = [...state.patterns];
    newPatterns[patternIndex] = newDraft;

    const newState = { ...state, patterns: newPatterns };
    newState.status = resolveSchemaStatus(newState);
    return newState;
  }

  abstract reducePattern(draft: Readonly<SchemaPatternDraft>): Readonly<SchemaPatternDraft>;
}

function reduceEntityTypes(
  state: Readonly<SchemaEditorState>,
  reduceType: (entityTypeDraft: Readonly<SchemaEntityTypeDraft>) => Readonly<SchemaEntityTypeDraft>
): Readonly<SchemaEditorState> {
  let changedEntityTypes = false;
  const newEntityTypes = state.entityTypes.map((typeDraft) => {
    const newTypeDraft = reduceType(typeDraft);
    if (newTypeDraft !== typeDraft) {
      changedEntityTypes = true;
      return withResolvedTypeStatus(newTypeDraft);
    }
    return newTypeDraft;
  });

  if (!changedEntityTypes) {
    return state;
  }

  return withResolvedSchemaStatus({ ...state, entityTypes: newEntityTypes });
}

function reduceFieldsOfAllTypes(
  state: Readonly<SchemaEditorState>,
  reduceField: (fieldDraft: Readonly<SchemaFieldDraft>) => Readonly<SchemaFieldDraft>
): Readonly<SchemaEditorState> {
  function reduceTypeFields<T extends SchemaEntityTypeDraft | SchemaValueTypeDraft>(
    typeDraft: Readonly<T>
  ): Readonly<T> {
    let changedFields = false;
    const newFields = typeDraft.fields.map((fieldDraft) => {
      const newFieldDraft = reduceField(fieldDraft);
      if (newFieldDraft !== fieldDraft) {
        changedFields = true;
        return withResolvedFieldStatus(newFieldDraft);
      }
      return newFieldDraft;
    });
    if (changedFields) {
      const newTypeDraft: Readonly<T> = { ...typeDraft, fields: newFields };
      return withResolvedTypeStatus(newTypeDraft);
    }
    return typeDraft;
  }

  // Entity types
  let changedEntityTypes = false;
  const newEntityTypes = state.entityTypes.map((typeDraft) => {
    const newTypeDraft = reduceTypeFields(typeDraft);
    if (newTypeDraft !== typeDraft) {
      changedEntityTypes = true;
    }
    return newTypeDraft;
  });

  // Value types
  let changedValueTypes = false;
  const newValueTypes = state.valueTypes.map((typeDraft) => {
    const newTypeDraft = reduceTypeFields(typeDraft);
    if (newTypeDraft !== typeDraft) {
      changedValueTypes = true;
    }
    return newTypeDraft;
  });

  if (!changedEntityTypes && !changedValueTypes) {
    return state;
  }
  const newState = {
    ...state,
    entityTypes: changedEntityTypes ? newEntityTypes : state.entityTypes,
    valueTypes: changedValueTypes ? newValueTypes : state.valueTypes,
  };
  newState.status = resolveSchemaStatus(newState);
  return newState;
}

function replaceFieldWithIndex(
  typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft>,
  fieldIndex: number,
  newFieldDraft: SchemaFieldDraft
): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft> {
  if (typeDraft.fields[fieldIndex] === newFieldDraft) {
    return typeDraft;
  }

  const newFields = [...typeDraft.fields];
  newFields[fieldIndex] = newFieldDraft;

  const newTypeDraft = { ...typeDraft, fields: newFields };
  return newTypeDraft;
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
      newState.entityTypes = [
        ...newState.entityTypes,
        {
          ...typeDraft,
          kind: 'entity',
          authKeyPattern: null,
          existingAuthKeyPattern: null,
          nameField: null,
          existingNameField: null,
        },
      ];
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
      adminOnly: false,
      existingFieldSpec: null,
    };

    const fields = [...typeSpec.fields, field];

    return { ...typeSpec, fields };
  }
}

class AddIndexAction implements SchemaEditorStateAction {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const indexDraft: SchemaIndexDraft = {
      status: 'new',
      name: this.name,
      type: 'unique',
    };
    const newState: SchemaEditorState = {
      ...state,
      indexes: [...state.indexes, indexDraft].sort((a, b) => a.name.localeCompare(b.name)),
      activeSelector: { kind: 'index', name: this.name },
      activeSelectorMenuScrollSignal: state.activeSelectorMenuScrollSignal + 1,
      activeSelectorEditorScrollSignal: state.activeSelectorEditorScrollSignal + 1,
    };
    newState.status = resolveSchemaStatus(newState);
    return newState;
  }
}

class AddPatternAction implements SchemaEditorStateAction {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const patternDraft: SchemaPatternDraft = {
      status: 'new',
      name: this.name,
      pattern: '',
      existingPatternSpec: null,
    };
    const newState: SchemaEditorState = {
      ...state,
      patterns: [...state.patterns, patternDraft].sort((a, b) => a.name.localeCompare(b.name)),
      activeSelector: { kind: 'pattern', name: this.name },
      activeSelectorMenuScrollSignal: state.activeSelectorMenuScrollSignal + 1,
      activeSelectorEditorScrollSignal: state.activeSelectorEditorScrollSignal + 1,
    };
    newState.status = resolveSchemaStatus(newState);
    return newState;
  }
}

class ChangeFieldAdminOnlyAction extends FieldAction {
  adminOnly: boolean;

  constructor(fieldSelector: SchemaFieldSelector, adminOnly: boolean) {
    super(fieldSelector);
    this.adminOnly = adminOnly;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (fieldDraft.adminOnly === this.adminOnly) {
      return fieldDraft;
    }

    return { ...fieldDraft, adminOnly: this.adminOnly };
  }
}

class ChangeFieldAllowedEntityTypesAction extends FieldAction {
  entityTypes: string[];

  constructor(fieldSelector: SchemaFieldSelector, entityTypes: string[]) {
    super(fieldSelector);
    this.entityTypes = [...entityTypes].sort();
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (isEqual(fieldDraft.entityTypes, this.entityTypes)) {
      return fieldDraft;
    }

    return { ...fieldDraft, entityTypes: this.entityTypes };
  }
}

class ChangeFieldAllowedLinkEntityTypesAction extends FieldAction {
  linkEntityTypes: string[];

  constructor(fieldSelector: SchemaFieldSelector, linkEntityTypes: string[]) {
    super(fieldSelector);
    this.linkEntityTypes = [...linkEntityTypes].sort();
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (isEqual(fieldDraft.linkEntityTypes, this.linkEntityTypes)) {
      return fieldDraft;
    }

    return { ...fieldDraft, linkEntityTypes: this.linkEntityTypes };
  }
}

class ChangeFieldAllowedRichTextNodesAction extends FieldAction {
  richTextNodesWithPlaceholders: string[];

  constructor(fieldSelector: SchemaFieldSelector, richTextNodes: string[]) {
    super(fieldSelector);
    this.richTextNodesWithPlaceholders = richTextNodes;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    const value = [...this.richTextNodesWithPlaceholders];

    if (value.length > 0 && !value.includes(ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER.name)) {
      value.push(ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER.name);
    }

    sortRichTextNodesWithPlaceholders(value);

    if (isEqual(fieldDraft.richTextNodesWithPlaceholders, value)) {
      return fieldDraft;
    }

    return { ...fieldDraft, richTextNodesWithPlaceholders: value };
  }
}

class ChangeFieldAllowedValueTypesAction extends FieldAction {
  valueTypes: string[];

  constructor(fieldSelector: SchemaFieldSelector, valueTypes: string[]) {
    super(fieldSelector);
    this.valueTypes = [...valueTypes].sort();
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (isEqual(fieldDraft.valueTypes, this.valueTypes)) {
      return fieldDraft;
    }

    return { ...fieldDraft, valueTypes: this.valueTypes };
  }
}

class ChangeFieldIndexAction extends FieldAction {
  index: string | null;

  constructor(fieldSelector: SchemaFieldSelector, index: string | null) {
    super(fieldSelector);
    this.index = index;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (fieldDraft.index === this.index) {
      return fieldDraft;
    }

    return { ...fieldDraft, index: this.index };
  }
}

class ChangeFieldIntegerAction extends FieldAction {
  integer: boolean;

  constructor(fieldSelector: SchemaFieldSelector, integer: boolean) {
    super(fieldSelector);
    this.integer = integer;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (fieldDraft.integer === this.integer) {
      return fieldDraft;
    }

    return { ...fieldDraft, integer: this.integer };
  }
}

class ChangeFieldMatchPatternAction extends FieldAction {
  pattern: string | null;

  constructor(fieldSelector: SchemaFieldSelector, pattern: string | null) {
    super(fieldSelector);
    this.pattern = pattern;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (fieldDraft.matchPattern === this.pattern) {
      return fieldDraft;
    }

    return { ...fieldDraft, matchPattern: this.pattern };
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

    if (this.fieldType === FieldType.Number) {
      newFieldDraft.integer = false;
    } else {
      delete newFieldDraft.integer;
    }

    if (this.fieldType === FieldType.String) {
      newFieldDraft.multiline = !!newFieldDraft.multiline;
      newFieldDraft.index = newFieldDraft.index ?? null;
      newFieldDraft.matchPattern = newFieldDraft.matchPattern ?? null;
      newFieldDraft.values = newFieldDraft.values ?? [];
    } else {
      delete newFieldDraft.multiline;
      delete newFieldDraft.index;
      delete newFieldDraft.matchPattern;
      delete newFieldDraft.values;
    }

    if (this.fieldType === FieldType.RichText) {
      newFieldDraft.richTextNodesWithPlaceholders = [];
    } else {
      delete newFieldDraft.richTextNodesWithPlaceholders;
    }

    //TODO handle rich text?
    if (this.fieldType === FieldType.Entity) {
      newFieldDraft.entityTypes = [];
    } else {
      delete newFieldDraft.entityTypes;
    }

    //TODO handle linkEntityTypes?

    if (this.fieldType === FieldType.ValueItem) {
      newFieldDraft.valueTypes = [];
    } else {
      delete newFieldDraft.valueTypes;
    }

    return newFieldDraft;
  }
}

class ChangeFieldValuesAction extends FieldAction {
  values: { value: string }[];

  constructor(fieldSelector: SchemaFieldSelector, values: { value: string }[]) {
    super(fieldSelector);
    this.values = [...values].sort((a, b) => a.value.localeCompare(b.value));

    // remove duplicates iterating from the end
    for (let i = this.values.length - 1; i > 0; i--) {
      if (this.values[i].value === this.values[i - 1].value) {
        this.values.splice(i, 1);
      }
    }
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (isEqual(fieldDraft.values, this.values)) {
      return fieldDraft;
    }

    return { ...fieldDraft, values: this.values };
  }
}

class ChangePatternPatternAction extends PatternAction {
  pattern: string;

  constructor(selector: SchemaPatternSelector, pattern: string) {
    super(selector);
    this.pattern = pattern;
  }

  reducePattern(draft: Readonly<SchemaPatternDraft>): Readonly<SchemaPatternDraft> {
    if (draft.pattern === this.pattern) {
      return draft;
    }
    const newDraft = { ...draft, pattern: this.pattern };
    newDraft.status = resolvePatternStatus(newDraft);
    return newDraft;
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

class ChangeTypeAuthKeyPatternAction extends TypeAction {
  pattern: string | null;

  constructor(typeSelector: SchemaTypeSelector, pattern: string | null) {
    super(typeSelector);
    this.pattern = pattern;
  }

  reduceType(typeDraft: Readonly<SchemaEntityTypeDraft>): Readonly<SchemaEntityTypeDraft> {
    if (typeDraft.authKeyPattern === this.pattern) {
      return typeDraft;
    }
    return { ...typeDraft, authKeyPattern: this.pattern };
  }
}

class ChangeTypeNameFieldAction extends TypeAction {
  nameField: string | null;

  constructor(typeSelector: SchemaTypeSelector, nameField: string | null) {
    super(typeSelector);
    this.nameField = nameField;
  }

  reduceType(
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft>
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft> {
    if (typeDraft.kind === 'value' || typeDraft.nameField === this.nameField) {
      return typeDraft;
    }
    return withResolvedTypeStatus({ ...typeDraft, nameField: this.nameField });
  }
}

class DeleteFieldAction extends TypeAction {
  fieldName: string;

  constructor({ fieldName, ...typeSelector }: SchemaFieldSelector) {
    super(typeSelector);
    this.fieldName = fieldName;
  }

  reduceType(
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft>
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft> {
    const fields = typeDraft.fields.filter((fieldDraft) => fieldDraft.name !== this.fieldName);

    if (typeDraft.kind === 'entity' && typeDraft.nameField === this.fieldName) {
      return { ...typeDraft, fields, nameField: null };
    }

    return { ...typeDraft, fields };
  }
}

class DeletePatternAction implements SchemaEditorStateAction {
  selector: SchemaPatternSelector;

  constructor(selector: SchemaPatternSelector) {
    this.selector = selector;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    let newState = {
      ...state,
      patterns: state.patterns.filter((it) => it.name !== this.selector.name),
    };

    if (isEqual(newState.activeSelector, this.selector)) {
      newState.activeSelector = null;
    }

    // Remove references to pattern in entity types
    newState = reduceEntityTypes(newState, (typeDraft) => {
      if (typeDraft.authKeyPattern === this.selector.name) {
        return { ...typeDraft, authKeyPattern: null };
      }
      return typeDraft;
    });

    // Remove references to pattern in fields
    newState = reduceFieldsOfAllTypes(newState, (fieldDraft) => {
      if (fieldDraft.matchPattern?.includes(this.selector.name)) {
        return {
          ...fieldDraft,
          matchPattern: null,
        };
      }
      return fieldDraft;
    });

    return withResolvedSchemaStatus(newState);
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

    let newState = { ...state, activeSelector, entityTypes, valueTypes };

    // Remove references to type in fields
    newState = reduceFieldsOfAllTypes(newState, (fieldDraft) => {
      if (this.selector.kind === 'entity') {
        if (
          fieldDraft.entityTypes?.includes(this.selector.typeName) ||
          fieldDraft.linkEntityTypes?.includes(this.selector.typeName)
        ) {
          const newFieldDraft = { ...fieldDraft };
          if (newFieldDraft.entityTypes) {
            newFieldDraft.entityTypes = newFieldDraft.entityTypes.filter(
              (it) => it !== this.selector.typeName
            );
          }
          if (newFieldDraft.linkEntityTypes) {
            newFieldDraft.linkEntityTypes = newFieldDraft.linkEntityTypes.filter(
              (it) => it !== this.selector.typeName
            );
          }
          return newFieldDraft;
        }
      } else {
        if (fieldDraft.valueTypes?.includes(this.selector.typeName)) {
          return {
            ...fieldDraft,
            valueTypes: fieldDraft.valueTypes.filter((it) => it !== this.selector.typeName),
          };
        }
      }
      return fieldDraft;
    });

    return withResolvedSchemaStatus(newState);
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

  override reduceType(
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft>
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft> {
    let newTypeDraft = super.reduceType(typeDraft);

    if (newTypeDraft === typeDraft) {
      return typeDraft;
    }

    if (newTypeDraft.kind === 'entity' && newTypeDraft.nameField === this.fieldName) {
      newTypeDraft = { ...newTypeDraft, nameField: this.newFieldName };
    }

    return newTypeDraft;
  }
}

class RenamePatternAction implements SchemaEditorStateAction {
  selector: SchemaPatternSelector;
  name: string;

  constructor(selector: SchemaPatternSelector, name: string) {
    this.selector = selector;
    this.name = name;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    // Rename pattern
    let newState: SchemaEditorState = {
      ...state,
      patterns: state.patterns.map((it) => {
        if (it.name === this.selector.name) {
          return withResolvedPatternStatus({ ...it, name: this.name });
        }
        return it;
      }),
      activeSelector: { kind: 'pattern', name: this.name },
      activeSelectorMenuScrollSignal: state.activeSelectorMenuScrollSignal + 1,
      activeSelectorEditorScrollSignal: state.activeSelectorEditorScrollSignal + 1,
    };

    // Sort patterns
    newState.patterns.sort((a, b) => a.name.localeCompare(b.name));

    // Rename references to pattern in entity types
    newState = reduceEntityTypes(newState, (typeDraft) => {
      if (typeDraft.authKeyPattern === this.selector.name) {
        return { ...typeDraft, authKeyPattern: this.name };
      }
      return typeDraft;
    });

    // Rename references to pattern in fields
    newState = reduceFieldsOfAllTypes(newState, (fieldDraft) => {
      if (fieldDraft.matchPattern?.includes(this.selector.name)) {
        return {
          ...fieldDraft,
          matchPattern: this.name,
        };
      }
      return fieldDraft;
    });

    return newState;
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

    // Rename type
    let newState: SchemaEditorState = {
      ...superState,
      activeSelector: { kind: this.kind, typeName: this.name },
      activeSelectorMenuScrollSignal: state.activeSelectorMenuScrollSignal + 1,
      activeSelectorEditorScrollSignal: state.activeSelectorEditorScrollSignal + 1,
    };

    // Sort types
    if (this.kind === 'entity') {
      newState.entityTypes.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      newState.valueTypes.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Rename references to type in fields
    newState = reduceFieldsOfAllTypes(newState, (fieldDraft) => {
      if (this.kind === 'entity') {
        if (
          fieldDraft.entityTypes?.includes(this.typeName) ||
          fieldDraft.linkEntityTypes?.includes(this.typeName)
        ) {
          return {
            ...fieldDraft,
            entityTypes: fieldDraft.entityTypes?.map((it) =>
              it === this.typeName ? this.name : it
            ),
            linkEntityTypes: fieldDraft.linkEntityTypes?.map((it) =>
              it === this.typeName ? this.name : it
            ),
          };
        }
      } else {
        if (fieldDraft.valueTypes?.includes(this.typeName)) {
          return {
            ...fieldDraft,
            valueTypes: fieldDraft.valueTypes.map((it) => (it === this.typeName ? this.name : it)),
          };
        }
      }
      return fieldDraft;
    });

    return newState;
  }
}

class SetActiveSelectorAction implements SchemaEditorStateAction {
  selector: SchemaSelector | null;
  increaseMenuScrollSignal: boolean;
  increaseEditorScrollSignal: boolean;

  constructor(
    selector: SchemaSelector | null,
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
    const entityTypes = this.schema.spec.entityTypes.map((entityTypeSpec) => ({
      ...this.convertType('entity', entityTypeSpec),
      authKeyPattern: entityTypeSpec.authKeyPattern,
      existingAuthKeyPattern: entityTypeSpec.authKeyPattern,
      nameField: entityTypeSpec.nameField,
      existingNameField: entityTypeSpec.nameField,
    }));

    const valueTypes = this.schema.spec.valueTypes.map((valueTypeSpec) =>
      this.convertType('value', valueTypeSpec)
    );

    const indexes = this.schema.spec.indexes.map<SchemaIndexDraft>((indexSpec) => ({
      ...indexSpec,
      status: '',
    }));

    const patterns = this.schema.spec.patterns.map<SchemaPatternDraft>((patternSpec) => ({
      ...patternSpec,
      status: '',
      existingPatternSpec: patternSpec,
    }));

    if (!state.schemaWillBeUpdatedDueToSave && state.schema) return state; //TODO handle update to schema

    return {
      ...state,
      status: '',
      schema: this.schema,
      schemaWillBeUpdatedDueToSave: false,
      entityTypes,
      valueTypes,
      indexes,
      patterns,
    };
  }

  convertType<TKind extends 'entity' | 'value'>(
    kind: TKind,
    typeSpec: AdminEntityTypeSpecification | AdminValueTypeSpecification
  ): SchemaTypeDraft & { kind: TKind } {
    return {
      kind,
      name: typeSpec.name,
      status: '',
      adminOnly: typeSpec.adminOnly,
      fields: typeSpec.fields.map<SchemaFieldDraft>((fieldSpec) => {
        const fieldDraft: SchemaFieldDraft = {
          name: fieldSpec.name,
          status: '',
          type: fieldSpec.type,
          list: fieldSpec.list,
          required: fieldSpec.required,
          adminOnly: fieldSpec.adminOnly,
          existingFieldSpec: fieldSpec,
        };
        if (fieldSpec.type === FieldType.String) {
          fieldDraft.multiline = fieldSpec.multiline;
          fieldDraft.index = fieldSpec.index;
          fieldDraft.matchPattern = fieldSpec.matchPattern;
          fieldDraft.values = fieldSpec.values;
        }
        if (fieldSpec.type === FieldType.RichText) {
          fieldDraft.richTextNodesWithPlaceholders = getRichTextNodesWithPlaceholders(
            fieldSpec.richTextNodes
          );
          fieldDraft.existingRichTextNodesWithPlaceholders = [
            ...fieldDraft.richTextNodesWithPlaceholders,
          ];
        }
        if (fieldSpec.type === FieldType.Entity || fieldSpec.type === FieldType.RichText) {
          fieldDraft.entityTypes = fieldSpec.entityTypes;
        }
        if (fieldSpec.type === FieldType.Number) {
          fieldDraft.integer = fieldSpec.integer;
        }
        if (fieldSpec.type === FieldType.RichText) {
          fieldDraft.linkEntityTypes = fieldSpec.linkEntityTypes;
        }
        if (fieldSpec.type === FieldType.ValueItem || fieldSpec.type === FieldType.RichText) {
          fieldDraft.valueTypes = fieldSpec.valueTypes;
        }
        return fieldDraft;
      }),
    };
  }
}

function getRichTextNodesWithPlaceholders(richTextNodes: string[]) {
  let result = richTextNodes;
  if (result.length > 0) {
    const placeholders: string[] = [];
    result = result.filter((richTextNode) => {
      if (RichTextNodesInPlaceholders.has(richTextNode)) {
        const placeholder = RichTextNodePlaceholders.find((it) => it.nodes.includes(richTextNode));
        assertIsDefined(placeholder);
        if (!placeholders.includes(placeholder.name)) {
          placeholders.push(placeholder.name);
        }
        return false;
      }
      return true;
    });

    result = [...placeholders, ...result];
    sortRichTextNodesWithPlaceholders(result);
  }
  return result;
}

function getRichTextNodesWithoutPlaceholders(richTextNodesWithPlaceholders: string[] | undefined) {
  if (!richTextNodesWithPlaceholders || richTextNodesWithPlaceholders.length === 0) {
    return richTextNodesWithPlaceholders;
  }
  const richTextNodes = richTextNodesWithPlaceholders.flatMap((node) => {
    const placeholder = RichTextNodePlaceholders.find((placeholder) => placeholder.name === node);
    if (placeholder) {
      return placeholder.nodes;
    }
    return node;
  });
  richTextNodes.sort();
  return richTextNodes;
}

export function sortRichTextNodesWithPlaceholders(richTextNodesWithPlaceholders: string[]) {
  if (richTextNodesWithPlaceholders.length <= 1) {
    return;
  }

  richTextNodesWithPlaceholders.sort((a, b) => {
    if (a === ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER.name) {
      return -1;
    }
    if (b === ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER.name) {
      return 1;
    }
    return a.localeCompare(b);
  });
}

export const SchemaEditorActions = {
  AddField: AddFieldAction,
  AddIndex: AddIndexAction,
  AddPattern: AddPatternAction,
  AddType: AddTypeAction,
  ChangeFieldAdminOnly: ChangeFieldAdminOnlyAction,
  ChangeFieldAllowedEntityTypes: ChangeFieldAllowedEntityTypesAction,
  ChangeFieldAllowedLinkEntityTypes: ChangeFieldAllowedLinkEntityTypesAction,
  ChangeFieldAllowedRichTextNodes: ChangeFieldAllowedRichTextNodesAction,
  ChangeFieldAllowedValueTypes: ChangeFieldAllowedValueTypesAction,
  ChangeFieldIndex: ChangeFieldIndexAction,
  ChangeFieldInteger: ChangeFieldIntegerAction,
  ChangeFieldMatchPattern: ChangeFieldMatchPatternAction,
  ChangeFieldMultiline: ChangeFieldMultilineAction,
  ChangeFieldRequired: ChangeFieldRequiredAction,
  ChangeFieldType: ChangeFieldTypeAction,
  ChangeFieldValues: ChangeFieldValuesAction,
  ChangePatternPattern: ChangePatternPatternAction,
  ChangeTypeAdminOnly: ChangeTypeAdminOnlyAction,
  ChangeTypeAuthKeyPattern: ChangeTypeAuthKeyPatternAction,
  ChangeTypeNameField: ChangeTypeNameFieldAction,
  DeleteField: DeleteFieldAction,
  DeletePattern: DeletePatternAction,
  DeleteType: DeleteTypeAction,
  RenameField: RenameFieldAction,
  RenamePattern: RenamePatternAction,
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

  const indexes = state.indexes
    .filter((it) => it.status !== '')
    .map(({ name, type }) => ({ name, type }));

  const patterns = state.patterns
    .filter((it) => it.status !== '')
    .map(({ name, pattern }) => ({ name, pattern }));

  if (entityTypes.length > 0) {
    update.entityTypes = entityTypes;
  }
  if (valueTypes.length > 0) {
    update.valueTypes = valueTypes;
  }
  if (indexes.length > 0) {
    update.indexes = indexes;
  }
  if (patterns.length > 0) {
    update.patterns = patterns;
  }

  return update;
}

function getTypeUpdateFromEditorState(
  draftType: SchemaValueTypeDraft | SchemaEntityTypeDraft
): AdminEntityTypeSpecificationUpdate | AdminValueTypeSpecificationUpdate {
  const fields = draftType.fields.map((draftField) => {
    return {
      name: draftField.name,
      type: draftField.type,
      required: draftField.required,
      adminOnly: draftField.adminOnly,
      ...(draftField.list ? { list: draftField.list } : undefined),
      ...(draftField.type === FieldType.String
        ? {
            multiline: draftField.multiline,
            index: draftField.index ?? null,
            matchPattern: draftField.matchPattern ?? null,
            values: draftField.values ?? [],
          }
        : undefined),
      ...(draftField.type === FieldType.RichText
        ? {
            richTextNodes: getRichTextNodesWithoutPlaceholders(
              draftField.richTextNodesWithPlaceholders
            ),
            linkEntityTypes: draftField.linkEntityTypes ?? [],
          }
        : undefined),
      ...(draftField.type === FieldType.Number ? { integer: !!draftField.integer } : undefined),
      ...(draftField.type === FieldType.Entity || draftField.type === FieldType.RichText
        ? { entityTypes: draftField.entityTypes ?? [] }
        : undefined),
      ...(draftField.type === FieldType.ValueItem || draftField.type === FieldType.RichText
        ? { valueTypes: draftField.valueTypes ?? [] }
        : undefined),
    };
  });

  const shared = { name: draftType.name, adminOnly: draftType.adminOnly, fields };
  if (draftType.kind === 'entity') {
    return { ...shared, authKeyPattern: draftType.authKeyPattern, nameField: draftType.nameField };
  }

  return shared;
}

// SELECTORS

export function getElementIdForSelector(
  selector: SchemaSelector | null,
  section: 'menuItem' | 'header'
) {
  if (!selector) {
    return undefined;
  }
  if (selector.kind === 'index') {
    return `index-${selector.name}-${section}`;
  }
  if (selector.kind === 'pattern') {
    return `pattern-${selector.name}-${section}`;
  }
  return `${selector.typeName}-${section}`;
}
