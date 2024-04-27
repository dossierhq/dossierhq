import {
  FieldType,
  REQUIRED_RICH_TEXT_NODES,
  RichTextNodeType,
  type ComponentTypeSpecification,
  type ComponentTypeSpecificationUpdate,
  type EntityTypeSpecification,
  type EntityTypeSpecificationUpdate,
  type FieldSpecification,
  type Schema,
  type SchemaSpecificationUpdate,
  type SchemaTransientMigrationAction,
  type SchemaVersionMigration,
  type SchemaIndexSpecification,
  type SchemaPatternSpecification,
} from '@dossierhq/core';
import isEqual from 'lodash/isEqual.js';
import { assertIsDefined } from '../../utils/AssertUtils.js';

export type SchemaSelector =
  | SchemaFieldSelector
  | SchemaTypeSelector
  | SchemaIndexSelector
  | SchemaPatternSelector;

export interface SchemaTypeSelector {
  kind: 'entity' | 'component';
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
  existingName: string | null;
  status: 'new' | '' | 'changed';
  fields: readonly SchemaFieldDraft[];
  deletedFields: readonly string[];
  existingFieldOrder: string[];
}

export interface SchemaEntityTypeDraft extends SchemaTypeDraft {
  kind: 'entity';
  authKeyPattern: string | null;
  existingAuthKeyPattern: string | null;
  nameField: string | null;
  existingNameField: string | null;
  publishable: boolean;
  existingPublishable: boolean;
}

export interface SchemaComponentTypeDraft extends SchemaTypeDraft {
  kind: 'component';
  adminOnly: boolean;
  existingAdminOnly: boolean;
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
  // component, rich text
  componentTypes?: string[];
  // number
  integer?: boolean;
  //
  existingFieldSpec: FieldSpecification | null;
}

export interface SchemaIndexDraft extends SchemaIndexSpecification {
  status: 'new' | '' | 'changed';
  existingIndexSpec: SchemaIndexSpecification | null;
}

export interface SchemaPatternDraft extends SchemaPatternSpecification {
  status: 'new' | '' | 'changed';
  existingPatternSpec: SchemaPatternSpecification | null;
}

export interface SchemaEditorState {
  status: 'uninitialized' | 'changed' | '';
  schema: Schema | null;
  schemaWillBeUpdatedDueToSave: boolean;

  entityTypes: SchemaEntityTypeDraft[];
  deletedEntityTypes: readonly string[];
  componentTypes: SchemaComponentTypeDraft[];
  deletedComponentTypes: readonly string[];
  indexes: SchemaIndexDraft[];
  deletedIndexes: readonly string[];
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
  REQUIRED_RICH_TEXT_NODES,
  [RichTextNodeType.code, RichTextNodeType['code-highlight']],
  [RichTextNodeType.list, RichTextNodeType.listitem],
].map((nodes) => ({ name: nodes.join(', '), nodes }));

const RichTextNodesInPlaceholders = new Set(
  RichTextNodePlaceholders.flatMap((placeholder) => placeholder.nodes),
);

export const REQUIRED_NODES_PLACEHOLDER = RichTextNodePlaceholders[0];

export function initializeSchemaEditorState(): SchemaEditorState {
  return {
    status: 'uninitialized',
    schema: null,
    schemaWillBeUpdatedDueToSave: false,
    entityTypes: [],
    deletedEntityTypes: [],
    componentTypes: [],
    deletedComponentTypes: [],
    indexes: [],
    deletedIndexes: [],
    patterns: [],
    activeSelector: null,
    activeSelectorMenuScrollSignal: 0,
    activeSelectorEditorScrollSignal: 0,
  };
}

export function reduceSchemaEditorState(
  state: Readonly<SchemaEditorState>,
  action: SchemaEditorStateAction,
): Readonly<SchemaEditorState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

// STATUS RESOLVERS

function resolveSchemaStatus(state: SchemaEditorState): SchemaEditorState['status'] {
  if (state.status === 'uninitialized') {
    return state.status;
  }
  for (const type of [
    ...state.entityTypes,
    ...state.componentTypes,
    ...state.indexes,
    ...state.patterns,
  ]) {
    if (type.status !== '') {
      return 'changed';
    }
  }
  if (state.deletedEntityTypes.length > 0 || state.deletedComponentTypes.length > 0) {
    return 'changed';
  }
  return '';
}

function withResolvedSchemaStatus(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
  const newStatus = resolveSchemaStatus(state);
  if (newStatus === state.status) return state;
  return { ...state, status: newStatus };
}

function resolveTypeStatus(
  state: Readonly<SchemaEntityTypeDraft | SchemaComponentTypeDraft>,
): SchemaTypeDraft['status'] {
  if (state.status === 'new') return state.status;
  if (state.name !== state.existingName) return 'changed';

  if (state.kind === 'entity') {
    if (state.publishable !== state.existingPublishable) return 'changed';
    if (state.nameField !== state.existingNameField) return 'changed';
    if (state.authKeyPattern !== state.existingAuthKeyPattern) return 'changed';
  } else {
    if (state.adminOnly !== state.existingAdminOnly) return 'changed';
  }

  if (state.deletedFields.length > 0) return 'changed';
  for (const field of state.fields) {
    if (field.status !== '') return 'changed';
  }
  for (let i = 0; i < state.existingFieldOrder.length; i++) {
    if (state.existingFieldOrder[i] !== state.fields[i].name) return 'changed';
  }
  return '';
}

function withResolvedTypeStatus<T extends SchemaEntityTypeDraft | SchemaComponentTypeDraft>(
  state: Readonly<T>,
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
  if (existingFieldSpec.name !== state.name) {
    return 'changed';
  }
  if (existingFieldSpec.required !== state.required) {
    return 'changed';
  }
  if (existingFieldSpec.adminOnly !== state.adminOnly) {
    return 'changed';
  }
  if (
    (existingFieldSpec.type === FieldType.Reference ||
      existingFieldSpec.type === FieldType.RichText) &&
    !isEqual(state.entityTypes, existingFieldSpec.entityTypes)
  ) {
    return 'changed';
  }
  if (
    (existingFieldSpec.type === FieldType.Component ||
      existingFieldSpec.type === FieldType.RichText) &&
    !isEqual(state.componentTypes, existingFieldSpec.componentTypes)
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
    if (state.index !== existingFieldSpec.index) {
      return 'changed';
    }
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
  return '';
}

function withResolvedFieldStatus(state: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
  const newStatus = resolveFieldStatus(state);
  if (newStatus === state.status) return state;
  return { ...state, status: newStatus };
}

function resolveIndexStatus(state: Readonly<SchemaIndexDraft>): SchemaIndexDraft['status'] {
  if (!state.existingIndexSpec) {
    return 'new';
  }
  if (state.name !== state.existingIndexSpec.name) {
    return 'changed';
  }
  if (state.type !== state.existingIndexSpec.type) {
    return 'changed';
  }
  return '';
}

function withResolvedIndexStatus(state: Readonly<SchemaIndexDraft>): Readonly<SchemaIndexDraft> {
  const newStatus = resolveIndexStatus(state);
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
  state: Readonly<SchemaPatternDraft>,
): Readonly<SchemaPatternDraft> {
  const newStatus = resolvePatternStatus(state);
  if (newStatus === state.status) return state;
  return { ...state, status: newStatus };
}

// ACTION HELPERS

abstract class TypeAction implements SchemaEditorStateAction {
  kind: 'entity' | 'component';
  typeName: string;

  constructor({ kind, typeName }: SchemaTypeSelector) {
    this.kind = kind;
    this.typeName = typeName;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const typeCollection = this.kind === 'entity' ? state.entityTypes : state.componentTypes;
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
      newState.componentTypes = newTypeCollection as SchemaComponentTypeDraft[];
    }
    newState.status = resolveSchemaStatus(newState);
    return newState;
  }

  abstract reduceType(
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft>,
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft>;
}

abstract class FieldAction extends TypeAction {
  fieldName: string;

  constructor(fieldSelector: SchemaFieldSelector) {
    super(fieldSelector);
    this.fieldName = fieldSelector.fieldName;
  }

  reduceType(
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft>,
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft> {
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
  reduceType: (entityTypeDraft: Readonly<SchemaEntityTypeDraft>) => Readonly<SchemaEntityTypeDraft>,
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
  reduceField: (fieldDraft: Readonly<SchemaFieldDraft>) => Readonly<SchemaFieldDraft>,
): Readonly<SchemaEditorState> {
  function reduceTypeFields<T extends SchemaEntityTypeDraft | SchemaComponentTypeDraft>(
    typeDraft: Readonly<T>,
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

  // Component types
  let changedComponentTypes = false;
  const newComponentTypes = state.componentTypes.map((typeDraft) => {
    const newTypeDraft = reduceTypeFields(typeDraft);
    if (newTypeDraft !== typeDraft) {
      changedComponentTypes = true;
    }
    return newTypeDraft;
  });

  if (!changedEntityTypes && !changedComponentTypes) {
    return state;
  }
  const newState = {
    ...state,
    entityTypes: changedEntityTypes ? newEntityTypes : state.entityTypes,
    componentTypes: changedComponentTypes ? newComponentTypes : state.componentTypes,
  };
  newState.status = resolveSchemaStatus(newState);
  return newState;
}

function replaceFieldWithIndex(
  typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft>,
  fieldIndex: number,
  newFieldDraft: SchemaFieldDraft,
): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft> {
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
  kind: 'entity' | 'component';
  name: string;

  constructor(kind: 'entity' | 'component', name: string) {
    this.kind = kind;
    this.name = name;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const typeDraft = {
      status: 'new',
      name: this.name,
      existingName: null,
      deletedFields: [],
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
          publishable: true,
          existingPublishable: true,
          nameField: null,
          existingNameField: null,
          existingFieldOrder: [],
        },
      ];
      newState.entityTypes.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      newState.componentTypes = [
        ...newState.componentTypes,
        {
          ...typeDraft,
          kind: 'component',
          adminOnly: false,
          existingAdminOnly: false,
          existingFieldOrder: [],
        },
      ];
      newState.componentTypes.sort((a, b) => a.name.localeCompare(b.name));
    }
    return withResolvedSchemaStatus(newState);
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
      existingIndexSpec: null,
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

    if (value.length > 0 && !value.includes(REQUIRED_NODES_PLACEHOLDER.name)) {
      value.push(REQUIRED_NODES_PLACEHOLDER.name);
    }

    sortRichTextNodesWithPlaceholders(value);

    if (isEqual(fieldDraft.richTextNodesWithPlaceholders, value)) {
      return fieldDraft;
    }

    return { ...fieldDraft, richTextNodesWithPlaceholders: value };
  }
}

class ChangeFieldAllowedComponentTypesAction extends FieldAction {
  componentTypes: string[];

  constructor(fieldSelector: SchemaFieldSelector, componentTypes: string[]) {
    super(fieldSelector);
    this.componentTypes = [...componentTypes].sort();
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (isEqual(fieldDraft.componentTypes, this.componentTypes)) {
      return fieldDraft;
    }

    return { ...fieldDraft, componentTypes: this.componentTypes };
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
    if (this.fieldType === FieldType.Reference) {
      newFieldDraft.entityTypes = [];
    } else {
      delete newFieldDraft.entityTypes;
    }

    //TODO handle linkEntityTypes?

    if (this.fieldType === FieldType.Component) {
      newFieldDraft.componentTypes = [];
    } else {
      delete newFieldDraft.componentTypes;
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
    return withResolvedPatternStatus({ ...draft, pattern: this.pattern });
  }
}

class ChangeTypeAdminOnlyOrPublishableAction extends TypeAction {
  value: boolean;

  constructor(typeSelector: SchemaTypeSelector, value: boolean) {
    super(typeSelector);
    this.value = value;
  }

  reduceType(
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft>,
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft> {
    if (typeDraft.kind === 'entity') {
      if (typeDraft.publishable === this.value) {
        return typeDraft;
      }
      return { ...typeDraft, publishable: this.value };
    }
    if (typeDraft.adminOnly === this.value) {
      return typeDraft;
    }
    return { ...typeDraft, adminOnly: this.value };
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
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft>,
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft> {
    if (typeDraft.kind === 'component' || typeDraft.nameField === this.nameField) {
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
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft>,
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft> {
    const fieldIndex = typeDraft.fields.findIndex(
      (fieldDraft) => fieldDraft.name === this.fieldName,
    );
    if (fieldIndex === -1) {
      return typeDraft;
    }

    const fields = [...typeDraft.fields];
    const [fieldDraft] = fields.splice(fieldIndex, 1);

    let deletedFields = typeDraft.deletedFields;
    if (fieldDraft.existingFieldSpec) {
      deletedFields = [...deletedFields, this.fieldName].sort();
    }

    const existingFieldOrder = typeDraft.existingFieldOrder.filter((it) => it !== this.fieldName);
    const newTypeDraft = { ...typeDraft, fields, deletedFields, existingFieldOrder };

    if ('nameField' in newTypeDraft && newTypeDraft.nameField === this.fieldName) {
      newTypeDraft.nameField = null;
    }

    return newTypeDraft;
  }

  override reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const newState = super.reduce(state);
    const activeSelector = newState.activeSelector;
    if (
      activeSelector &&
      activeSelector.kind == this.kind &&
      activeSelector.typeName == this.typeName &&
      'fieldName' in activeSelector &&
      activeSelector.fieldName == this.fieldName
    ) {
      return { ...newState, activeSelector: null };
    }
    return newState;
  }
}

class DeleteIndexAction implements SchemaEditorStateAction {
  selector: SchemaIndexSelector;

  constructor(selector: SchemaIndexSelector) {
    this.selector = selector;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const indexDraftIndex = state.indexes.findIndex((it) => it.name === this.selector.name);
    if (indexDraftIndex < 0) {
      return state;
    }

    const indexes = [...state.indexes];
    const [indexDraft] = indexes.splice(indexDraftIndex, 1);

    let newState = { ...state, indexes };

    if (isEqual(newState.activeSelector, this.selector)) {
      newState.activeSelector = null;
    }

    // Remove references to index in fields
    newState = reduceFieldsOfAllTypes(newState, (fieldDraft) => {
      if (fieldDraft.index === this.selector.name) {
        return { ...fieldDraft, index: null };
      }
      return fieldDraft;
    });

    if (indexDraft.existingIndexSpec) {
      newState.deletedIndexes = [...newState.deletedIndexes, this.selector.name].sort();
    }

    return withResolvedSchemaStatus(newState);
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
      if (fieldDraft.matchPattern === this.selector.name) {
        return { ...fieldDraft, matchPattern: null };
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
    let { activeSelector, entityTypes, deletedEntityTypes, componentTypes, deletedComponentTypes } =
      state;

    const typeDrafts = this.selector.kind === 'entity' ? entityTypes : componentTypes;
    const typeIndex = typeDrafts.findIndex((it) => it.name === this.selector.typeName);
    if (typeIndex < 0)
      throw new Error(`No such ${this.selector.kind} type ${this.selector.typeName}`);
    const typeDraft = typeDrafts[typeIndex];
    const newTypeDrafts = [...typeDrafts];
    newTypeDrafts.splice(typeIndex, 1);

    if (this.selector.kind === 'entity') {
      entityTypes = newTypeDrafts as typeof entityTypes;
      if (typeDraft.existingName) {
        deletedEntityTypes = [...deletedEntityTypes, typeDraft.existingName].sort();
      }
    } else {
      componentTypes = newTypeDrafts as typeof componentTypes;
      if (typeDraft.existingName) {
        deletedComponentTypes = [...deletedComponentTypes, typeDraft.existingName].sort();
      }
    }

    if (isEqual(activeSelector, this.selector)) {
      activeSelector = null;
    }

    let newState = {
      ...state,
      activeSelector,
      entityTypes,
      deletedEntityTypes,
      componentTypes,
      deletedComponentTypes,
    };

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
              (it) => it !== this.selector.typeName,
            );
          }
          if (newFieldDraft.linkEntityTypes) {
            newFieldDraft.linkEntityTypes = newFieldDraft.linkEntityTypes.filter(
              (it) => it !== this.selector.typeName,
            );
          }
          return newFieldDraft;
        }
      } else {
        if (fieldDraft.componentTypes?.includes(this.selector.typeName)) {
          return {
            ...fieldDraft,
            componentTypes: fieldDraft.componentTypes.filter((it) => it !== this.selector.typeName),
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
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft>,
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft> {
    const superTypeDraft = super.reduceType(typeDraft);

    if (superTypeDraft === typeDraft) {
      return typeDraft;
    }

    const existingFieldOrder = superTypeDraft.existingFieldOrder.map((it) =>
      it === this.fieldName ? this.newFieldName : it,
    );

    const newTypeDraft = { ...superTypeDraft, existingFieldOrder };

    if ('nameField' in newTypeDraft && newTypeDraft.nameField === this.fieldName) {
      newTypeDraft.nameField = this.newFieldName;
    }

    if ('existingNameField' in newTypeDraft && newTypeDraft.existingNameField === this.fieldName) {
      newTypeDraft.existingNameField = this.newFieldName;
    }

    return newTypeDraft;
  }

  override reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const newState = super.reduce(state);

    if (newState === state) {
      return state;
    }

    return {
      ...newState,
      activeSelector: { kind: this.kind, typeName: this.typeName, fieldName: this.newFieldName },
      activeSelectorMenuScrollSignal: state.activeSelectorMenuScrollSignal + 1,
      activeSelectorEditorScrollSignal: state.activeSelectorEditorScrollSignal + 1,
    };
  }
}

class RenameIndexAction implements SchemaEditorStateAction {
  selector: SchemaIndexSelector;
  name: string;

  constructor(selector: SchemaIndexSelector, name: string) {
    this.selector = selector;
    this.name = name;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    // Rename index
    let newState: SchemaEditorState = {
      ...state,
      indexes: state.indexes.map((it) => {
        if (it.name === this.selector.name) {
          return withResolvedIndexStatus({ ...it, name: this.name });
        }
        return it;
      }),
      activeSelector: { kind: 'index', name: this.name },
      activeSelectorMenuScrollSignal: state.activeSelectorMenuScrollSignal + 1,
      activeSelectorEditorScrollSignal: state.activeSelectorEditorScrollSignal + 1,
    };

    // Sort indexes
    newState.indexes.sort((a, b) => a.name.localeCompare(b.name));

    // Rename references to index in fields
    newState = reduceFieldsOfAllTypes(newState, (fieldDraft) => {
      if (fieldDraft.index === this.selector.name) {
        return { ...fieldDraft, index: this.name };
      }
      return fieldDraft;
    });

    return newState;
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
      if (fieldDraft.matchPattern === this.selector.name) {
        return { ...fieldDraft, matchPattern: this.name };
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
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft>,
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft> {
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
      newState.componentTypes.sort((a, b) => a.name.localeCompare(b.name));
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
              it === this.typeName ? this.name : it,
            ),
            linkEntityTypes: fieldDraft.linkEntityTypes?.map((it) =>
              it === this.typeName ? this.name : it,
            ),
          };
        }
      } else {
        if (fieldDraft.componentTypes?.includes(this.typeName)) {
          return {
            ...fieldDraft,
            componentTypes: fieldDraft.componentTypes.map((it) =>
              it === this.typeName ? this.name : it,
            ),
          };
        }
      }
      return fieldDraft;
    });

    return newState;
  }
}

class ReorderFieldsAction extends TypeAction {
  fieldToMove: string;
  position: 'after' | 'before';
  targetField: string;

  constructor(
    selector: SchemaTypeSelector,
    fieldToMove: string,
    position: 'after' | 'before',
    targetField: string,
  ) {
    super(selector);
    this.fieldToMove = fieldToMove;
    this.position = position;
    this.targetField = targetField;
  }

  override reduceType(
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft>,
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaComponentTypeDraft> {
    if (this.fieldToMove === this.targetField) {
      return typeDraft;
    }

    const fields = [...typeDraft.fields];
    const fieldToMoveIndex = fields.findIndex((it) => it.name === this.fieldToMove);
    const [fieldToMove] = fields.splice(fieldToMoveIndex, 1);
    const targetFieldIndex = fields.findIndex((it) => it.name === this.targetField);
    if (this.position === 'after') {
      fields.splice(targetFieldIndex + 1, 0, fieldToMove);
    } else {
      fields.splice(targetFieldIndex, 0, fieldToMove);
    }
    return { ...typeDraft, fields };
  }
}

class SetActiveSelectorAction implements SchemaEditorStateAction {
  selector: SchemaSelector | null;
  increaseMenuScrollSignal: boolean;
  increaseEditorScrollSignal: boolean;

  constructor(
    selector: SchemaSelector | null,
    increaseMenuScrollSignal: boolean,
    increaseEditorScrollSignal: boolean,
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
  schema: Schema;

  constructor(schema: Schema) {
    this.schema = schema;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const entityTypes = this.schema.spec.entityTypes.map((entityTypeSpec) => ({
      ...this.convertType('entity', entityTypeSpec),
      authKeyPattern: entityTypeSpec.authKeyPattern,
      existingAuthKeyPattern: entityTypeSpec.authKeyPattern,
      nameField: entityTypeSpec.nameField,
      existingNameField: entityTypeSpec.nameField,
      publishable: entityTypeSpec.publishable,
      existingPublishable: entityTypeSpec.publishable,
    }));

    const componentTypes = this.schema.spec.componentTypes.map((componentTypeSpec) => ({
      ...this.convertType('component', componentTypeSpec),
      adminOnly: componentTypeSpec.adminOnly,
      existingAdminOnly: componentTypeSpec.adminOnly,
    }));

    const indexes = this.schema.spec.indexes.map<SchemaIndexDraft>((indexSpec) => ({
      ...indexSpec,
      status: '',
      existingIndexSpec: indexSpec,
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
      deletedEntityTypes: [],
      componentTypes,
      deletedComponentTypes: [],
      indexes,
      deletedIndexes: [],
      patterns,
    };
  }

  convertType<TKind extends 'entity' | 'component'>(
    kind: TKind,
    typeSpec: EntityTypeSpecification | ComponentTypeSpecification,
  ): SchemaTypeDraft & { kind: TKind } {
    return {
      kind,
      name: typeSpec.name,
      existingName: typeSpec.name,
      status: '',
      deletedFields: [],
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
            fieldSpec.richTextNodes,
          );
          fieldDraft.existingRichTextNodesWithPlaceholders = [
            ...fieldDraft.richTextNodesWithPlaceholders,
          ];
        }
        if (fieldSpec.type === FieldType.Reference || fieldSpec.type === FieldType.RichText) {
          fieldDraft.entityTypes = fieldSpec.entityTypes;
        }
        if (fieldSpec.type === FieldType.Number) {
          fieldDraft.integer = fieldSpec.integer;
        }
        if (fieldSpec.type === FieldType.RichText) {
          fieldDraft.linkEntityTypes = fieldSpec.linkEntityTypes;
        }
        if (fieldSpec.type === FieldType.Component || fieldSpec.type === FieldType.RichText) {
          fieldDraft.componentTypes = fieldSpec.componentTypes;
        }
        return fieldDraft;
      }),
      existingFieldOrder: typeSpec.fields.map((fieldSpec) => fieldSpec.name),
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
    if (a === REQUIRED_NODES_PLACEHOLDER.name) {
      return -1;
    }
    if (b === REQUIRED_NODES_PLACEHOLDER.name) {
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
  ChangeFieldAllowedComponentTypes: ChangeFieldAllowedComponentTypesAction,
  ChangeFieldAllowedEntityTypes: ChangeFieldAllowedEntityTypesAction,
  ChangeFieldAllowedLinkEntityTypes: ChangeFieldAllowedLinkEntityTypesAction,
  ChangeFieldAllowedRichTextNodes: ChangeFieldAllowedRichTextNodesAction,
  ChangeFieldIndex: ChangeFieldIndexAction,
  ChangeFieldInteger: ChangeFieldIntegerAction,
  ChangeFieldMatchPattern: ChangeFieldMatchPatternAction,
  ChangeFieldMultiline: ChangeFieldMultilineAction,
  ChangeFieldRequired: ChangeFieldRequiredAction,
  ChangeFieldType: ChangeFieldTypeAction,
  ChangeFieldValues: ChangeFieldValuesAction,
  ChangePatternPattern: ChangePatternPatternAction,
  ChangeTypeAdminOnly: ChangeTypeAdminOnlyOrPublishableAction,
  ChangeTypeAuthKeyPattern: ChangeTypeAuthKeyPatternAction,
  ChangeTypeNameField: ChangeTypeNameFieldAction,
  DeleteField: DeleteFieldAction,
  DeleteIndex: DeleteIndexAction,
  DeletePattern: DeletePatternAction,
  DeleteType: DeleteTypeAction,
  RenameField: RenameFieldAction,
  RenameIndex: RenameIndexAction,
  RenamePattern: RenamePatternAction,
  RenameType: RenameTypeAction,
  ReorderFields: ReorderFieldsAction,
  SetActiveSelector: SetActiveSelectorAction,
  SetNextUpdateSchemaSpecificationIsDueToSave: SetNextUpdateSchemaSpecificationIsDueToSaveAction,
  UpdateSchemaSpecification: UpdateSchemaSpecificationAction,
};

// CONVERSION

export function getSchemaSpecificationUpdateFromEditorState(
  state: SchemaEditorState,
): SchemaSpecificationUpdate {
  const update: SchemaSpecificationUpdate = {};

  const entityTypes = state.entityTypes
    .filter((it) => it.status !== '')
    .map(getTypeUpdateFromEditorState);

  const componentTypes = state.componentTypes
    .filter((it) => it.status !== '')
    .map(getTypeUpdateFromEditorState);

  const indexes = state.indexes
    .filter((it) => it.status !== '')
    .map(({ name, type }) => ({ name, type }));

  const patterns = state.patterns
    .filter((it) => it.status !== '')
    .map(({ name, pattern }) => ({ name, pattern }));

  const migrations = getMigrationsFromEditorState(state);
  const transientMigrations = getTransientMigrationsFromEditorState(state);

  if (entityTypes.length > 0) {
    update.entityTypes = entityTypes;
  }
  if (componentTypes.length > 0) {
    update.componentTypes = componentTypes;
  }
  if (indexes.length > 0) {
    update.indexes = indexes;
  }
  if (patterns.length > 0) {
    update.patterns = patterns;
  }
  if (migrations.length > 0) {
    update.migrations = migrations;
  }
  if (transientMigrations.length > 0) {
    update.transientMigrations = transientMigrations;
  }

  if (Object.keys(update).length > 0 && state.schema) {
    update.version = state.schema.spec.version + 1;
  }

  return update;
}

function getTypeUpdateFromEditorState(
  draftType: SchemaComponentTypeDraft | SchemaEntityTypeDraft,
): EntityTypeSpecificationUpdate | ComponentTypeSpecificationUpdate {
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
              draftField.richTextNodesWithPlaceholders,
            ),
            linkEntityTypes: draftField.linkEntityTypes ?? [],
          }
        : undefined),
      ...(draftField.type === FieldType.Number ? { integer: !!draftField.integer } : undefined),
      ...(draftField.type === FieldType.Reference || draftField.type === FieldType.RichText
        ? { entityTypes: draftField.entityTypes ?? [] }
        : undefined),
      ...(draftField.type === FieldType.Component || draftField.type === FieldType.RichText
        ? { componentTypes: draftField.componentTypes ?? [] }
        : undefined),
    };
  });

  const shared = { name: draftType.name, fields };
  if (draftType.kind === 'entity') {
    return {
      ...shared,
      authKeyPattern: draftType.authKeyPattern,
      nameField: draftType.nameField,
      publishable: draftType.publishable,
    };
  } else {
    return { ...shared, adminOnly: draftType.adminOnly };
  }
}

function getMigrationsFromEditorState(state: SchemaEditorState): SchemaVersionMigration[] {
  const actions: SchemaVersionMigration['actions'] = [];

  for (const typeName of state.deletedEntityTypes) {
    actions.push({ action: 'deleteType', entityType: typeName });
  }

  for (const typeName of state.deletedComponentTypes) {
    actions.push({ action: 'deleteType', componentType: typeName });
  }

  for (const typeDraft of [...state.entityTypes, ...state.componentTypes]) {
    if (typeDraft.status !== 'changed') {
      continue;
    }
    const typeName =
      typeDraft.kind === 'entity'
        ? { entityType: typeDraft.name }
        : { componentType: typeDraft.name };

    if (typeDraft.existingName && typeDraft.existingName !== typeDraft.name) {
      actions.push({
        action: 'renameType',
        ...(typeDraft.kind === 'entity'
          ? { entityType: typeDraft.existingName }
          : { componentType: typeDraft.existingName }),
        newName: typeDraft.name,
      });
    }

    for (const fieldName of typeDraft.deletedFields) {
      actions.push({ action: 'deleteField', ...typeName, field: fieldName });
    }

    for (const fieldDraft of typeDraft.fields) {
      if (fieldDraft.existingFieldSpec && fieldDraft.existingFieldSpec.name !== fieldDraft.name) {
        actions.push({
          action: 'renameField',
          ...typeName,
          field: fieldDraft.existingFieldSpec.name,
          newName: fieldDraft.name,
        });
      }
    }
  }

  if (actions.length > 0) {
    return [{ version: (state.schema?.spec.version ?? 0) + 1, actions }];
  }
  return [];
}

function getTransientMigrationsFromEditorState(
  state: SchemaEditorState,
): SchemaTransientMigrationAction[] {
  const actions: SchemaTransientMigrationAction[] = [];

  for (const index of state.deletedIndexes) {
    actions.push({ action: 'deleteIndex', index });
  }

  for (const indexDraft of state.indexes) {
    const existingName = indexDraft.existingIndexSpec?.name;
    if (existingName && existingName !== indexDraft.name) {
      actions.push({ action: 'renameIndex', index: existingName, newName: indexDraft.name });
    }
  }

  return actions;
}

// SELECTORS

export function getElementIdForSelector(
  selector: SchemaSelector | null,
  section: 'menuItem' | 'header',
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
