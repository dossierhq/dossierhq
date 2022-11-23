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
} from '@jonasb/datadata-core';
import { assertIsDefined, FieldType, RichTextNodeType } from '@jonasb/datadata-core';
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
  isName?: boolean;
  multiline?: boolean;
  index?: string | null;
  matchPattern?: string | null;
  richTextNodes?: string[];
  existingRichTextNodesWithPlaceholders?: string[];
  entityTypes?: string[];
  linkEntityTypes?: string[];
  valueTypes?: string[];
  existingFieldSpec: AdminFieldSpecification | null;
}

export interface SchemaIndexDraft extends SchemaIndexSpecification {
  status: 'new' | '';
}

export interface SchemaPatternDraft extends SchemaPatternSpecification {
  status: 'new' | '';
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
  [RichTextNodeType.root, RichTextNodeType.paragraph, RichTextNodeType.text],
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

function resolveTypeStatus(state: SchemaTypeDraft): SchemaTypeDraft['status'] {
  if (state.status === 'new') return state.status;
  //TODO check field order
  for (const field of state.fields) {
    if (field.status !== '') return 'changed';
  }
  return '';
}

function resolveFieldStatus(state: SchemaFieldDraft): SchemaFieldDraft['status'] {
  if (state.existingFieldSpec === null) {
    return 'new';
  }
  if (
    state.existingFieldSpec.type === FieldType.String &&
    !!state.existingFieldSpec.isName !== state.isName
  )
    return 'changed';
  if (
    state.richTextNodes &&
    !isEqual(state.richTextNodes, state.existingRichTextNodesWithPlaceholders)
  ) {
    return 'changed';
  }
  // TODO expand when supporting changing more properties of a field
  return '';
}

function withResolvedFieldStatus(state: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
  const newStatus = resolveFieldStatus(state);
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
      }
      return newFieldDraft;
    });
    if (changedFields) {
      const newTypeDraft: T = { ...typeDraft, fields: newFields };
      newTypeDraft.status = resolveTypeStatus(typeDraft);
      return newTypeDraft;
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
        { ...typeDraft, kind: 'entity', authKeyPattern: null },
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
      isName: false,
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
    this.entityTypes = entityTypes;
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
    this.linkEntityTypes = linkEntityTypes;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (isEqual(fieldDraft.linkEntityTypes, this.linkEntityTypes)) {
      return fieldDraft;
    }

    return { ...fieldDraft, linkEntityTypes: this.linkEntityTypes };
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
      if (!newRichTextNodes.includes(ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER.name)) {
        newRichTextNodes = [ROOT_PARAGRAPH_TEXT_NODES_PLACEHOLDER.name, ...newRichTextNodes];
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

class ChangeFieldIsNameAction extends FieldAction {
  isName: boolean;

  constructor(fieldSelector: SchemaFieldSelector, isName: boolean) {
    super(fieldSelector);
    this.isName = isName;
  }

  reduceField(fieldDraft: Readonly<SchemaFieldDraft>): Readonly<SchemaFieldDraft> {
    if (fieldDraft.isName === this.isName) {
      return fieldDraft;
    }

    return { ...fieldDraft, isName: this.isName };
  }

  override reduceType(
    typeDraft: Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft>
  ): Readonly<SchemaEntityTypeDraft> | Readonly<SchemaValueTypeDraft> {
    let newTypeDraft = super.reduceType(typeDraft);
    if (newTypeDraft === typeDraft) {
      return newTypeDraft;
    }

    // Reset other field with isName is set
    if (this.isName) {
      const otherNameFieldIndex = newTypeDraft.fields.findIndex(
        (it) => it.isName && it.name !== this.fieldName
      );
      if (otherNameFieldIndex >= 0) {
        newTypeDraft = replaceFieldWithIndex(
          newTypeDraft,
          otherNameFieldIndex,
          withResolvedFieldStatus({
            ...newTypeDraft.fields[otherNameFieldIndex],
            isName: false,
          })
        );
      }
    }

    return newTypeDraft;
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
    //TODO reset isName

    if (this.fieldType === FieldType.String) {
      newFieldDraft.multiline = !!newFieldDraft.multiline;
      newFieldDraft.index = newFieldDraft.index ?? null;
      newFieldDraft.matchPattern = newFieldDraft.matchPattern ?? null;
    } else {
      delete newFieldDraft.multiline;
      delete newFieldDraft.index;
      delete newFieldDraft.matchPattern;
    }

    if (this.fieldType === FieldType.RichText) {
      newFieldDraft.richTextNodes = [];
    } else {
      delete newFieldDraft.richTextNodes;
    }

    //TODO handle rich text?
    if (this.fieldType === FieldType.EntityType) {
      newFieldDraft.entityTypes = [];
    } else {
      delete newFieldDraft.entityTypes;
    }

    //TODO handle linkEntityTypes?

    if (this.fieldType === FieldType.ValueType) {
      newFieldDraft.valueTypes = [];
    } else {
      delete newFieldDraft.valueTypes;
    }

    return newFieldDraft;
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
    return { ...draft, pattern: this.pattern };
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
          fieldDraft.isName = fieldSpec.isName;
          fieldDraft.multiline = fieldSpec.multiline;
          fieldDraft.index = fieldSpec.index;
          fieldDraft.matchPattern = fieldSpec.matchPattern;
        }
        if (fieldSpec.type === FieldType.RichText) {
          fieldDraft.richTextNodes = this.getRichTextNodesWithPlaceholders(fieldSpec.richTextNodes);
          fieldDraft.existingRichTextNodesWithPlaceholders = [...fieldDraft.richTextNodes];
        }
        if (fieldSpec.type === FieldType.EntityType || fieldSpec.type === FieldType.RichText) {
          fieldDraft.entityTypes = fieldSpec.entityTypes;
        }
        if (fieldSpec.type === FieldType.RichText) {
          fieldDraft.linkEntityTypes = fieldSpec.linkEntityTypes;
        }
        if (fieldSpec.type === FieldType.ValueType || fieldSpec.type === FieldType.RichText) {
          fieldDraft.valueTypes = fieldSpec.valueTypes;
        }
        return fieldDraft;
      }),
    };
  }

  private getRichTextNodesWithPlaceholders(richTextNodes: string[]) {
    let result = richTextNodes;
    if (result.length > 0) {
      const placeholders: string[] = [];
      result = result.filter((richTextNode) => {
        if (RichTextNodesInPlaceholders.has(richTextNode)) {
          const placeholder = RichTextNodePlaceholders.find((it) =>
            it.nodes.includes(richTextNode)
          );
          assertIsDefined(placeholder);
          if (!placeholders.includes(placeholder.name)) {
            placeholders.push(placeholder.name);
          }
          return false;
        }
        return true;
      });

      result = [...placeholders, ...result];
    }
    return result;
  }
}

export const SchemaEditorActions = {
  AddIndex: AddIndexAction,
  AddType: AddTypeAction,
  AddField: AddFieldAction,
  AddPattern: AddPatternAction,
  ChangeFieldAdminOnly: ChangeFieldAdminOnlyAction,
  ChangeFieldAllowedEntityTypes: ChangeFieldAllowedEntityTypesAction,
  ChangeFieldAllowedLinkEntityTypes: ChangeFieldAllowedLinkEntityTypesAction,
  ChangeFieldAllowedRichTextNodes: ChangeFieldAllowedRichTextNodesAction,
  ChangeFieldAllowedValueTypes: ChangeFieldAllowedValueTypesAction,
  ChangeFieldIndex: ChangeFieldIndexAction,
  ChangeFieldIsName: ChangeFieldIsNameAction,
  ChangeFieldMatchPattern: ChangeFieldMatchPatternAction,
  ChangeFieldMultiline: ChangeFieldMultilineAction,
  ChangeFieldRequired: ChangeFieldRequiredAction,
  ChangeFieldType: ChangeFieldTypeAction,
  ChangePatternPattern: ChangePatternPatternAction,
  ChangeTypeAdminOnly: ChangeTypeAdminOnlyAction,
  ChangeTypeAuthKeyPattern: ChangeTypeAuthKeyPatternAction,
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
    let richTextNodes = draftField.richTextNodes;
    if (richTextNodes && richTextNodes.length > 0) {
      richTextNodes = richTextNodes.flatMap((it) => {
        const placeholder = RichTextNodePlaceholders.find((placeholder) => placeholder.name === it);
        if (placeholder) {
          return placeholder.nodes;
        }
        return it;
      });
    }
    return {
      name: draftField.name,
      type: draftField.type,
      required: draftField.required,
      adminOnly: draftField.adminOnly,
      ...(draftField.isName ? { isName: true } : undefined),
      ...(draftField.list ? { list: draftField.list } : undefined),
      ...(draftField.type === FieldType.String
        ? {
            multiline: draftField.multiline,
            index: draftField.index ?? null,
            matchPattern: draftField.matchPattern ?? null,
          }
        : undefined),
      ...(draftField.type === FieldType.RichText
        ? { richTextNodes, linkEntityTypes: draftField.linkEntityTypes ?? [] }
        : undefined),
      ...(draftField.type === FieldType.EntityType || draftField.type === FieldType.RichText
        ? { entityTypes: draftField.entityTypes ?? [] }
        : undefined),
      ...(draftField.type === FieldType.ValueType || draftField.type === FieldType.RichText
        ? { valueTypes: draftField.valueTypes ?? [] }
        : undefined),
    };
  });

  return {
    name: draftType.name,
    adminOnly: draftType.adminOnly,
    ...('authKeyPattern' in draftType ? { authKeyPattern: draftType.authKeyPattern } : undefined),
    fields,
  };
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
