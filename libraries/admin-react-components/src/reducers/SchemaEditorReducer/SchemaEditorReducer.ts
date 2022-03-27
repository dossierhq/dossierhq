import type { AdminSchema } from '@jonasb/datadata-core';

export interface EntityTypeDraft {
  name: string;
}

export interface SchemaEditorState {
  schema: AdminSchema | null;

  entityTypes: EntityTypeDraft[];
}

export interface SchemaEditorStateAction {
  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState>;
}

export function initializeSchemaEditorState(): SchemaEditorState {
  return { schema: null, entityTypes: [] };
}

export function reduceSchemaEditorState(
  state: Readonly<SchemaEditorState>,
  action: SchemaEditorStateAction
): Readonly<SchemaEditorState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

// ACTIONS

class UpdateSchemaSpecificationAction implements SchemaEditorStateAction {
  schema: AdminSchema;

  constructor(schema: AdminSchema) {
    this.schema = schema;
  }

  reduce(state: Readonly<SchemaEditorState>): Readonly<SchemaEditorState> {
    const entityTypes = this.schema.spec.entityTypes.map((entityType) => ({
      name: entityType.name,
    }));

    if (state.schema) return state; //TODO handle update to schema

    return { ...state, schema: this.schema, entityTypes };
  }
}

export const SchemaEditorActions = {
  UpdateSchemaSpecification: UpdateSchemaSpecificationAction,
};
