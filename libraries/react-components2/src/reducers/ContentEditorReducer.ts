import {
  isEntityNameAsRequested,
  normalizeContentField,
  traverseContentField,
  validateTraverseNodeForPublish,
  validateTraverseNodeForSave,
  type Entity,
  type EntityCreate,
  type EntityTypeSpecification,
  type EntityUpdate,
  type FieldSpecification,
  type PublishValidationIssue,
  type SaveValidationIssue,
  type Schema,
} from '@dossierhq/core';
import isEqual from 'lodash/isEqual.js';
import { assertIsDefined } from '../utils/AssertUtils.js';

type ContentEditorSelector = { id: string } | { id: string; newType: string };

type ValidationIssue = SaveValidationIssue | PublishValidationIssue;

export interface ContentEditorState {
  status: '' | 'changed';
  schema: Schema | null;
  drafts: ContentEditorDraftState[];
  activeEntityId: string | null;
  activeEntityEditorScrollSignal: number;
  activeEntityMenuScrollSignal: number;
  pendingSchemaActions: ContentEditorStateAction[] | null;
  showOpenDialog: boolean;
}

export interface ContentEditorDraftState {
  id: string;
  isNew: boolean;
  status: '' | 'changed';
  hasSaveErrors: boolean;
  hasPublishErrors: boolean;
  draft: {
    entitySpec: EntityTypeSpecification;
    authKey: string | null;
    name: string;
    nameIsLinkedToField: boolean;
    fields: FieldEditorState[];
  } | null;
  entity: Entity | null;
  entityWillBeUpdatedDueToUpsert: boolean;
}

export interface FieldEditorState {
  status: '' | 'changed';
  fieldSpec: FieldSpecification;
  adminOnly: boolean;
  value: unknown;
  normalizedValue: unknown;
  validationIssues: ValidationIssue[];
}

export interface ContentEditorStateAction {
  reduce(state: Readonly<ContentEditorState>): Readonly<ContentEditorState>;
}

export function initializeContentEditorState({
  actions,
}: { actions?: ContentEditorStateAction[] } = {}): ContentEditorState {
  return {
    status: '',
    schema: null,
    drafts: [],
    activeEntityId: null,
    activeEntityEditorScrollSignal: 0,
    activeEntityMenuScrollSignal: 0,
    pendingSchemaActions: actions ?? null,
    showOpenDialog: false,
  };
}

export function reduceContentEditorState(
  state: Readonly<ContentEditorState>,
  action: ContentEditorStateAction,
): Readonly<ContentEditorState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

// STATUS RESOLVES

function resolveEditorStatus(state: ContentEditorState): ContentEditorState['status'] {
  const someChanged = state.drafts.some((it) => it.status === 'changed');
  return someChanged ? 'changed' : '';
}

function resolveDraftStatus(
  draftState: ContentEditorDraftState,
): ContentEditorDraftState['status'] {
  if (!draftState.draft) {
    return '';
  }
  if (!draftState.entity) {
    if (
      (draftState.draft.entitySpec.authKeyPattern && draftState.draft.authKey !== null) ||
      draftState.draft.name
    ) {
      return 'changed';
    }
  } else {
    if (draftState.draft.name !== draftState.entity.info.name) {
      return 'changed';
    }
  }

  const someChangedField = draftState.draft.fields.some((it) => it.status === 'changed');
  if (someChangedField) {
    return 'changed';
  }
  return '';
}

function resolveFieldStatus(
  field: FieldEditorState,
  draftState: ContentEditorDraftState,
): FieldEditorState['status'] {
  const isEmpty = field.normalizedValue === null;
  if (!draftState.entity) {
    return isEmpty ? '' : 'changed';
  }

  const existingValue = draftState.entity.fields[field.fieldSpec.name];
  return isEqual(existingValue, field.normalizedValue) ? '' : 'changed';
}

function resolveDraftErrors(
  fields: FieldEditorState[] | undefined,
): Pick<ContentEditorDraftState, 'hasPublishErrors' | 'hasSaveErrors'> {
  let hasSaveErrors = false;
  let hasPublishErrors = false;
  if (fields) {
    for (const field of fields) {
      if (hasSaveErrors && hasPublishErrors) {
        break;
      }
      for (const error of field.validationIssues) {
        if (error.type === 'publish') {
          hasPublishErrors = true;
        } else if (error.type === 'save') {
          hasSaveErrors = true;
        }
      }
    }
  }
  return { hasSaveErrors, hasPublishErrors };
}

// ACTION HELPERS

abstract class ContentEditorDraftAction implements ContentEditorStateAction {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  reduce(state: Readonly<ContentEditorState>): Readonly<ContentEditorState> {
    const draftIndex = state.drafts.findIndex((it) => it.id === this.id);
    if (draftIndex < 0) throw new Error(`No such draft for id ${this.id}`);
    const currentDraft = state.drafts[draftIndex];

    let newDraft = this.reduceDraft(currentDraft, state);
    if (newDraft === currentDraft) {
      return state;
    }

    newDraft = { ...newDraft, status: resolveDraftStatus(newDraft) };

    const newDrafts = [...state.drafts];
    newDrafts[draftIndex] = newDraft;

    const newState = { ...state, drafts: newDrafts };
    newState.status = resolveEditorStatus(newState);
    return newState;
  }

  abstract reduceDraft(
    draftState: Readonly<ContentEditorDraftState>,
    editorState: Readonly<ContentEditorState>,
  ): Readonly<ContentEditorDraftState>;
}

abstract class ContentEditorFieldAction extends ContentEditorDraftAction {
  fieldName: string;

  constructor(entryId: string, fieldName: string) {
    super(entryId);
    this.fieldName = fieldName;
  }

  reduceDraft(
    draftState: Readonly<ContentEditorDraftState>,
    editorState: Readonly<ContentEditorState>,
  ): Readonly<ContentEditorDraftState> {
    assertIsDefined(draftState.draft);
    const fieldIndex = draftState.draft.fields.findIndex(
      (it) => it.fieldSpec.name === this.fieldName,
    );
    if (fieldIndex < 0) {
      throw new Error(`No such field ${this.fieldName} for entity with id ${this.id}`);
    }
    const currentField = draftState.draft.fields[fieldIndex];

    let newField = this.reduceField(currentField, draftState, editorState);
    if (newField === currentField) {
      return draftState;
    }
    newField = { ...newField, status: resolveFieldStatus(newField, draftState) };

    const newFields = [...draftState.draft.fields];
    newFields[fieldIndex] = newField;

    const { hasPublishErrors, hasSaveErrors } = resolveDraftErrors(newFields);

    return {
      ...draftState,
      draft: { ...draftState.draft, fields: newFields },
      hasPublishErrors,
      hasSaveErrors,
    };
  }

  abstract reduceField(
    fieldState: Readonly<FieldEditorState>,
    draftState: Readonly<ContentEditorDraftState>,
    editorState: Readonly<ContentEditorState>,
  ): Readonly<FieldEditorState>;
}

// ACTIONS

class AddDraftAction implements ContentEditorStateAction {
  selector: ContentEditorSelector;
  constructor(selector: ContentEditorSelector) {
    this.selector = selector;
  }

  reduce(state: Readonly<ContentEditorState>): Readonly<ContentEditorState> {
    let { activeEntityEditorScrollSignal, activeEntityMenuScrollSignal } = state;

    // If the entity already exist, make it active and scroll to it
    if (this.selector.id && state.drafts.find((it) => it.id === this.selector.id)) {
      activeEntityEditorScrollSignal++;
      activeEntityMenuScrollSignal++;
      return {
        ...state,
        activeEntityId: this.selector.id,
        activeEntityEditorScrollSignal,
        activeEntityMenuScrollSignal,
      };
    }

    const { schema } = state;
    assertIsDefined(schema);

    const isNew = 'newType' in this.selector;
    const draft: ContentEditorDraftState = {
      id: this.selector.id,
      isNew,
      status: '',
      hasSaveErrors: false,
      hasPublishErrors: false,
      draft: null,
      entity: null,
      entityWillBeUpdatedDueToUpsert: false,
    };

    if ('newType' in this.selector) {
      const entitySpec = schema.getEntityTypeSpecification(this.selector.newType);
      assertIsDefined(entitySpec);
      draft.draft = createEditorEntityDraftState(schema, entitySpec, null);

      const { hasPublishErrors, hasSaveErrors } = resolveDraftErrors(draft.draft?.fields);
      draft.hasPublishErrors = hasPublishErrors;
      draft.hasSaveErrors = hasSaveErrors;

      // Delay scroll signals when opening a new entity
      activeEntityEditorScrollSignal++;
      activeEntityMenuScrollSignal++;
    }

    return {
      ...state,
      drafts: [...state.drafts, draft],
      activeEntityId: draft.id,
      activeEntityEditorScrollSignal,
      activeEntityMenuScrollSignal,
    };
  }
}

class DeleteDraftAction implements ContentEditorStateAction {
  id: string;
  constructor(id: string) {
    this.id = id;
  }

  reduce(state: Readonly<ContentEditorState>): Readonly<ContentEditorState> {
    let { activeEntityId } = state;
    if (activeEntityId === this.id) {
      activeEntityId = null;
    }

    const newState = {
      ...state,
      activeEntityId,
      drafts: state.drafts.filter((it) => it.id !== this.id),
    };
    newState.status = resolveEditorStatus(newState);
    return newState;
  }
}

class SetActiveEntityAction implements ContentEditorStateAction {
  id: string;
  increaseMenuScrollSignal: boolean;
  increaseEditorScrollSignal: boolean;

  constructor(id: string, increaseMenuScrollSignal: boolean, increaseEditorScrollSignal: boolean) {
    this.id = id;
    this.increaseMenuScrollSignal = increaseMenuScrollSignal;
    this.increaseEditorScrollSignal = increaseEditorScrollSignal;
  }

  reduce(state: Readonly<ContentEditorState>): Readonly<ContentEditorState> {
    if (state.activeEntityId === this.id) {
      return state;
    }
    if (!state.drafts.some((it) => it.id === this.id)) {
      throw new Error(`No draft with id '${this.id}`);
    }
    let { activeEntityMenuScrollSignal, activeEntityEditorScrollSignal } = state;
    if (this.increaseMenuScrollSignal) {
      activeEntityMenuScrollSignal += 1;
    }
    if (this.increaseEditorScrollSignal) {
      activeEntityEditorScrollSignal += 1;
    }

    return {
      ...state,
      activeEntityId: this.id,
      activeEntityMenuScrollSignal,
      activeEntityEditorScrollSignal,
    };
  }
}

class SetFieldAction extends ContentEditorFieldAction {
  value: unknown;

  constructor(entityId: string, fieldName: string, value: unknown) {
    super(entityId, fieldName);
    this.value = value;
  }

  reduceField(
    fieldState: Readonly<FieldEditorState>,
    _draftState: Readonly<ContentEditorDraftState>,
    editorState: Readonly<ContentEditorState>,
  ): Readonly<FieldEditorState> {
    const { schema } = editorState;
    assertIsDefined(schema);

    if (fieldState.value === this.value) {
      return fieldState;
    }

    const normalizeResult = normalizeContentField(schema, [], fieldState.fieldSpec, this.value);
    const normalizedValue = normalizeResult.isOk() ? normalizeResult.value : this.value;

    const validationIssues = validateField(
      schema,
      fieldState.fieldSpec,
      fieldState.adminOnly,
      normalizedValue,
      fieldState.validationIssues,
    );

    return { ...fieldState, value: this.value, normalizedValue, validationIssues };
  }

  override reduceDraft(
    draftState: Readonly<ContentEditorDraftState>,
    editorState: Readonly<ContentEditorState>,
  ): Readonly<ContentEditorDraftState> {
    let newDraftState = super.reduceDraft(draftState, editorState);
    if (newDraftState === draftState) {
      return draftState;
    }

    if (newDraftState.draft) {
      const isNameField = newDraftState.draft.entitySpec.nameField === this.fieldName;

      if (
        isNameField &&
        newDraftState.draft.nameIsLinkedToField &&
        typeof this.value === 'string'
      ) {
        const name = this.value;
        newDraftState = { ...newDraftState, draft: { ...newDraftState.draft, name } };
      }
    }

    return newDraftState;
  }
}

class SetNameAction extends ContentEditorDraftAction {
  name: string;

  constructor(id: string, name: string) {
    super(id);
    this.name = name;
  }

  reduceDraft(
    draftState: Readonly<ContentEditorDraftState>,
    _editorState: Readonly<ContentEditorState>,
  ): Readonly<ContentEditorDraftState> {
    if (!draftState.draft || draftState.draft.name === this.name) {
      return draftState;
    }

    // If new name is empty, link name to the field, otherwise unlink it
    const nameIsLinkedToField = !this.name;

    return { ...draftState, draft: { ...draftState.draft, name: this.name, nameIsLinkedToField } };
  }
}

class SetEntityIsNoLongerNewAction extends ContentEditorDraftAction {
  constructor(id: string) {
    super(id);
  }

  reduceDraft(
    draftState: Readonly<ContentEditorDraftState>,
    _editorState: Readonly<ContentEditorState>,
  ) {
    if (!draftState.isNew) {
      return draftState;
    }

    return { ...draftState, isNew: false };
  }
}

class SetNextEntityUpdateIsDueToUpsertAction extends ContentEditorDraftAction {
  entityWillBeUpdatedDueToUpsert: boolean;

  constructor(id: string, entityWillBeUpdatedDueToUpsert: boolean) {
    super(id);
    this.entityWillBeUpdatedDueToUpsert = entityWillBeUpdatedDueToUpsert;
  }

  reduceDraft(
    draftState: Readonly<ContentEditorDraftState>,
    _editorState: Readonly<ContentEditorState>,
  ): Readonly<ContentEditorDraftState> {
    if (draftState.entityWillBeUpdatedDueToUpsert === this.entityWillBeUpdatedDueToUpsert) {
      return draftState;
    }

    return { ...draftState, entityWillBeUpdatedDueToUpsert: this.entityWillBeUpdatedDueToUpsert };
  }
}

class SetAuthKeyAction extends ContentEditorDraftAction {
  authKey: string;

  constructor(id: string, authKey: string) {
    super(id);
    this.authKey = authKey;
  }

  reduceDraft(
    draftState: Readonly<ContentEditorDraftState>,
    _editorState: Readonly<ContentEditorState>,
  ): Readonly<ContentEditorDraftState> {
    if (!draftState.draft || draftState.draft.authKey === this.authKey) {
      return draftState;
    }

    return { ...draftState, draft: { ...draftState.draft, authKey: this.authKey } };
  }
}

class ToggleShowOpenDialogAction implements ContentEditorStateAction {
  showOpenDialog: boolean;

  constructor(showOpenDialog: boolean) {
    this.showOpenDialog = showOpenDialog;
  }

  reduce(state: Readonly<ContentEditorState>): Readonly<ContentEditorState> {
    if (state.showOpenDialog === this.showOpenDialog) {
      return state;
    }

    return { ...state, showOpenDialog: this.showOpenDialog };
  }
}

class UpdateEntityAction extends ContentEditorDraftAction {
  entity: Entity;

  constructor(entity: Entity) {
    super(entity.id);
    this.entity = entity;
  }

  override reduce(state: Readonly<ContentEditorState>): Readonly<ContentEditorState> {
    const newState = super.reduce(state);
    if (state === newState) {
      return newState;
    }

    const firstUpdateOfActiveEntity =
      state.activeEntityId === this.id &&
      state.drafts.some((it) => it.id === this.id && it.entity === null);

    if (firstUpdateOfActiveEntity) {
      return {
        ...newState,
        activeEntityMenuScrollSignal: newState.activeEntityMenuScrollSignal + 1,
        activeEntityEditorScrollSignal: newState.activeEntityEditorScrollSignal + 1,
      };
    }
    return newState;
  }

  reduceDraft(
    draftState: Readonly<ContentEditorDraftState>,
    editorState: ContentEditorState,
  ): Readonly<ContentEditorDraftState> {
    if (!draftState.entityWillBeUpdatedDueToUpsert && draftState.entity) {
      if (isEqual(draftState.entity, this.entity)) {
        // no change
        return draftState;
      }
      if (isEqual(draftState.entity.fields, this.entity.fields)) {
        // only changed entity info
        return { ...draftState, entity: this.entity };
      }
      if (draftState.status !== '') {
        // TODO apply migrations and keep local changes
        const changedFields: string[] = [];
        for (const field of draftState.draft?.fields || []) {
          if (field.status === 'changed') {
            changedFields.push(field.fieldSpec.name);
          }
        }
        console.log(
          `Entity ${this.entity.id} changed on server, changes to fields ${changedFields.join(
            ', ',
          )} will be overwritten`,
        );
      }
    }

    const { schema } = editorState;
    assertIsDefined(schema);
    const entitySpec = schema.getEntityTypeSpecification(this.entity.info.type);
    assertIsDefined(entitySpec);

    const draft = createEditorEntityDraftState(schema, entitySpec, this.entity);
    const { hasPublishErrors, hasSaveErrors } = resolveDraftErrors(draft?.fields);

    return {
      ...draftState,
      draft,
      hasPublishErrors,
      hasSaveErrors,
      entity: this.entity,
      isNew: false,
    };
  }
}

class UpdateSchemaSpecificationAction implements ContentEditorStateAction {
  schema: Schema;
  constructor(schema: Schema) {
    this.schema = schema;
  }

  reduce(state: Readonly<ContentEditorState>): Readonly<ContentEditorState> {
    // TODO apply migrations
    // TODO update specs in drafts
    const actions = state.pendingSchemaActions;
    let newState: ContentEditorState = {
      ...state,
      schema: this.schema,
      pendingSchemaActions: null,
    };
    if (actions) {
      for (const action of actions) {
        newState = reduceContentEditorState(newState, action);
      }
    }
    return newState;
  }
}

export const ContentEditorActions = {
  AddDraft: AddDraftAction,
  DeleteDraft: DeleteDraftAction,
  SetActiveEntity: SetActiveEntityAction,
  SetAuthKey: SetAuthKeyAction,
  SetEntityIsNoLongerNew: SetEntityIsNoLongerNewAction,
  SetField: SetFieldAction,
  SetName: SetNameAction,
  SetNextEntityUpdateIsDueToUpsert: SetNextEntityUpdateIsDueToUpsertAction,
  ToggleShowOpenDialog: ToggleShowOpenDialogAction,
  UpdateEntity: UpdateEntityAction,
  UpdateSchemaSpecification: UpdateSchemaSpecificationAction,
};

// HELPERS

function validateField(
  schema: Schema,
  fieldSpec: FieldSpecification,
  adminOnly: boolean,
  value: unknown,
  previousErrors: ValidationIssue[],
): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  for (const node of traverseContentField(schema, [], fieldSpec, value)) {
    const error = validateTraverseNodeForSave(schema, node);
    if (error) errors.push(error);
  }
  if (!adminOnly) {
    const publishedSchema = schema.toPublishedSchema();
    for (const node of traverseContentField(publishedSchema, [], fieldSpec, value)) {
      const error = validateTraverseNodeForPublish(schema, node);
      if (error) errors.push(error);
    }
  }

  if (isEqual(errors, previousErrors)) {
    return previousErrors;
  }
  return errors;
}

function createEditorEntityDraftState(
  schema: Schema,
  entitySpec: EntityTypeSpecification,
  entity: Entity | null,
): ContentEditorDraftState['draft'] {
  const fields = entitySpec.fields.map<FieldEditorState>((fieldSpec) => {
    const value = entity?.fields[fieldSpec.name] ?? null;
    const adminOnly = !entitySpec.publishable || fieldSpec.adminOnly;
    const normalizationResult = normalizeContentField(schema, [], fieldSpec, value);
    const normalizedValue = normalizationResult.isOk() ? normalizationResult.value : value;
    const validationIssues = validateField(schema, fieldSpec, adminOnly, normalizedValue, []);
    return { status: '', fieldSpec, adminOnly, value, normalizedValue, validationIssues };
  });

  // authKey
  let authKey = entity?.info.authKey ?? null;
  if (authKey === null && !entitySpec.authKeyPattern) {
    authKey = ''; // default
  }

  // Check if name is linked to a field
  let nameIsLinkedToField = false;
  if (entity) {
    const nameFieldSpec = entitySpec.nameField
      ? entitySpec.fields.find((it) => it.name === entitySpec.nameField)
      : null;
    if (nameFieldSpec) {
      const nameFieldValue = entity.fields[nameFieldSpec.name];
      if (nameFieldValue && typeof nameFieldValue === 'string') {
        nameIsLinkedToField = isEntityNameAsRequested(entity.info.name, nameFieldValue);
      }
    }
  } else {
    nameIsLinkedToField = !!entitySpec.nameField; // true on new entities
  }

  return {
    entitySpec,
    authKey,
    name: entity?.info.name ?? '',
    nameIsLinkedToField,
    fields,
  };
}

//

export function getEntityCreateFromDraftState(draftState: ContentEditorDraftState) {
  const { draft } = draftState;
  assertIsDefined(draft);
  assertIsDefined(draft.authKey);

  const fields: EntityCreate['fields'] = {};
  for (const field of draft.fields) {
    fields[field.fieldSpec.name] = field.value;
  }

  const result: EntityCreate = {
    id: draftState.id,
    info: {
      type: draft.entitySpec.name,
      name: draft.name,
      authKey: draft.authKey,
    },
    fields,
  };

  return result;
}

export function getEntityUpdateFromDraftState(draftState: ContentEditorDraftState) {
  const { draft, entity } = draftState;
  assertIsDefined(draft);
  assertIsDefined(entity);

  const fields: EntityCreate['fields'] = {};
  for (const field of draft.fields) {
    fields[field.fieldSpec.name] = field.value;
  }

  const result: EntityUpdate = {
    id: draftState.id,
    info: {
      type: draft.entitySpec.name,
      ...(draft.name !== entity.info.name ? { name: draft.name } : {}),
    },
    fields,
  };

  return result;
}
