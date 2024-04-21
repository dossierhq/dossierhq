import {
  isEntityNameAsRequested,
  normalizeContentField,
  traverseContentField,
  validateTraverseNodeForPublish,
  validateTraverseNodeForSave,
  type AdminEntity,
  type AdminEntityCreate,
  type EntityTypeSpecification,
  type AdminEntityUpdate,
  type FieldSpecification,
  type Schema,
  type PublishValidationIssue,
  type SaveValidationIssue,
} from '@dossierhq/core';
import isEqual from 'lodash/isEqual.js';
import { assertIsDefined } from '../../utils/AssertUtils.js';

type EntityEditorSelector = { id: string } | { id: string; newType: string };

type ValidationIssue = SaveValidationIssue | PublishValidationIssue;

export interface EntityEditorState {
  status: '' | 'changed';
  schema: Schema | null;
  drafts: EntityEditorDraftState[];
  activeEntityId: string | null;
  activeEntityEditorScrollSignal: number;
  activeEntityMenuScrollSignal: number;
  pendingSchemaActions: EntityEditorStateAction[] | null;
}

export interface EntityEditorDraftState {
  id: string;
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
  entity: AdminEntity | null;
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

export interface EntityEditorStateAction {
  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState>;
}

export function initializeEntityEditorState({
  actions,
}: { actions?: EntityEditorStateAction[] } = {}): EntityEditorState {
  return {
    status: '',
    schema: null,
    drafts: [],
    activeEntityId: null,
    activeEntityEditorScrollSignal: 0,
    activeEntityMenuScrollSignal: 0,
    pendingSchemaActions: actions ?? null,
  };
}

export function reduceEntityEditorState(
  state: Readonly<EntityEditorState>,
  action: EntityEditorStateAction,
): Readonly<EntityEditorState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

// STATUS RESOLVES

function resolveEditorStatus(state: EntityEditorState): EntityEditorState['status'] {
  const someChanged = state.drafts.some((it) => it.status === 'changed');
  return someChanged ? 'changed' : '';
}

function resolveDraftStatus(draftState: EntityEditorDraftState): EntityEditorDraftState['status'] {
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
  draftState: EntityEditorDraftState,
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
): Pick<EntityEditorDraftState, 'hasPublishErrors' | 'hasSaveErrors'> {
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

abstract class EntityEditorDraftAction implements EntityEditorStateAction {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState> {
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
    draftState: Readonly<EntityEditorDraftState>,
    editorState: Readonly<EntityEditorState>,
  ): Readonly<EntityEditorDraftState>;
}

abstract class EntityEditorFieldAction extends EntityEditorDraftAction {
  fieldName: string;

  constructor(entryId: string, fieldName: string) {
    super(entryId);
    this.fieldName = fieldName;
  }

  reduceDraft(
    draftState: Readonly<EntityEditorDraftState>,
    editorState: Readonly<EntityEditorState>,
  ): Readonly<EntityEditorDraftState> {
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
    draftState: Readonly<EntityEditorDraftState>,
    editorState: Readonly<EntityEditorState>,
  ): Readonly<FieldEditorState>;
}

// ACTIONS

class AddDraftAction implements EntityEditorStateAction {
  selector: EntityEditorSelector;
  constructor(selector: EntityEditorSelector) {
    this.selector = selector;
  }

  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState> {
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

    const draft: EntityEditorDraftState = {
      id: this.selector.id,
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

class DeleteDraftAction implements EntityEditorStateAction {
  id: string;
  constructor(id: string) {
    this.id = id;
  }

  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState> {
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

class SetActiveEntityAction implements EntityEditorStateAction {
  id: string;
  increaseMenuScrollSignal: boolean;
  increaseEditorScrollSignal: boolean;

  constructor(id: string, increaseMenuScrollSignal: boolean, increaseEditorScrollSignal: boolean) {
    this.id = id;
    this.increaseMenuScrollSignal = increaseMenuScrollSignal;
    this.increaseEditorScrollSignal = increaseEditorScrollSignal;
  }

  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState> {
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

class SetFieldAction extends EntityEditorFieldAction {
  value: unknown;

  constructor(entityId: string, fieldName: string, value: unknown) {
    super(entityId, fieldName);
    this.value = value;
  }

  reduceField(
    fieldState: Readonly<FieldEditorState>,
    _draftState: Readonly<EntityEditorDraftState>,
    editorState: Readonly<EntityEditorState>,
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
    draftState: Readonly<EntityEditorDraftState>,
    editorState: Readonly<EntityEditorState>,
  ): Readonly<EntityEditorDraftState> {
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

class SetNameAction extends EntityEditorDraftAction {
  name: string;

  constructor(id: string, name: string) {
    super(id);
    this.name = name;
  }

  reduceDraft(
    draftState: Readonly<EntityEditorDraftState>,
    _editorState: Readonly<EntityEditorState>,
  ): Readonly<EntityEditorDraftState> {
    if (!draftState.draft || draftState.draft.name === this.name) {
      return draftState;
    }

    // If new name is empty, link name to the field, otherwise unlink it
    const nameIsLinkedToField = !this.name;

    return { ...draftState, draft: { ...draftState.draft, name: this.name, nameIsLinkedToField } };
  }
}

class SetNextEntityUpdateIsDueToUpsertAction extends EntityEditorDraftAction {
  entityWillBeUpdatedDueToUpsert: boolean;

  constructor(id: string, entityWillBeUpdatedDueToUpsert: boolean) {
    super(id);
    this.entityWillBeUpdatedDueToUpsert = entityWillBeUpdatedDueToUpsert;
  }

  reduceDraft(
    draftState: Readonly<EntityEditorDraftState>,
    _editorState: Readonly<EntityEditorState>,
  ): Readonly<EntityEditorDraftState> {
    if (draftState.entityWillBeUpdatedDueToUpsert === this.entityWillBeUpdatedDueToUpsert) {
      return draftState;
    }

    return { ...draftState, entityWillBeUpdatedDueToUpsert: this.entityWillBeUpdatedDueToUpsert };
  }
}

class SetAuthKeyAction extends EntityEditorDraftAction {
  authKey: string;

  constructor(id: string, authKey: string) {
    super(id);
    this.authKey = authKey;
  }

  reduceDraft(
    draftState: Readonly<EntityEditorDraftState>,
    _editorState: Readonly<EntityEditorState>,
  ): Readonly<EntityEditorDraftState> {
    if (!draftState.draft || draftState.draft.authKey === this.authKey) {
      return draftState;
    }

    return { ...draftState, draft: { ...draftState.draft, authKey: this.authKey } };
  }
}

class UpdateEntityAction extends EntityEditorDraftAction {
  entity: AdminEntity;

  constructor(entity: AdminEntity) {
    super(entity.id);
    this.entity = entity;
  }

  override reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState> {
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
    draftState: Readonly<EntityEditorDraftState>,
    editorState: EntityEditorState,
  ): Readonly<EntityEditorDraftState> {
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
    };
  }
}

class UpdateSchemaSpecificationAction implements EntityEditorStateAction {
  schema: Schema;
  constructor(schema: Schema) {
    this.schema = schema;
  }

  reduce(state: Readonly<EntityEditorState>): Readonly<EntityEditorState> {
    // TODO apply migrations
    // TODO update specs in drafts
    const actions = state.pendingSchemaActions;
    let newState: EntityEditorState = { ...state, schema: this.schema, pendingSchemaActions: null };
    if (actions) {
      for (const action of actions) {
        newState = reduceEntityEditorState(newState, action);
      }
    }
    return newState;
  }
}

export const EntityEditorActions = {
  AddDraft: AddDraftAction,
  DeleteDraft: DeleteDraftAction,
  SetActiveEntity: SetActiveEntityAction,
  SetAuthKey: SetAuthKeyAction,
  SetField: SetFieldAction,
  SetName: SetNameAction,
  SetNextEntityUpdateIsDueToUpsert: SetNextEntityUpdateIsDueToUpsertAction,
  UpdateEntity: UpdateEntityAction,
  UpdateSchemaSpecification: UpdateSchemaSpecificationAction,
};

// HELPERS

function validateField(
  adminSchema: Schema,
  fieldSpec: FieldSpecification,
  adminOnly: boolean,
  value: unknown,
  previousErrors: ValidationIssue[],
): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  for (const node of traverseContentField(adminSchema, [], fieldSpec, value)) {
    const error = validateTraverseNodeForSave(adminSchema, node);
    if (error) errors.push(error);
  }
  if (!adminOnly) {
    const publishedSchema = adminSchema.toPublishedSchema();
    for (const node of traverseContentField(publishedSchema, [], fieldSpec, value)) {
      const error = validateTraverseNodeForPublish(adminSchema, node);
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
  entity: AdminEntity | null,
): EntityEditorDraftState['draft'] {
  const fields = entitySpec.fields.map<FieldEditorState>((fieldSpec) => {
    const value = entity?.fields[fieldSpec.name] ?? null;
    const adminOnly = entitySpec.adminOnly || fieldSpec.adminOnly;
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

export function getEntityCreateFromDraftState(draftState: EntityEditorDraftState) {
  const { draft } = draftState;
  assertIsDefined(draft);
  assertIsDefined(draft.authKey);

  const fields: AdminEntityCreate['fields'] = {};
  for (const field of draft.fields) {
    fields[field.fieldSpec.name] = field.value;
  }

  const result: AdminEntityCreate = {
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

export function getEntityUpdateFromDraftState(draftState: EntityEditorDraftState) {
  const { draft, entity } = draftState;
  assertIsDefined(draft);
  assertIsDefined(entity);

  const fields: AdminEntityCreate['fields'] = {};
  for (const field of draft.fields) {
    fields[field.fieldSpec.name] = field.value;
  }

  const result: AdminEntityUpdate = {
    id: draftState.id,
    info: {
      type: draft.entitySpec.name,
      ...(draft.name !== entity.info.name ? { name: draft.name } : {}),
    },
    fields,
  };

  return result;
}
