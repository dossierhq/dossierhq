import type { AdminClient } from '@jonasb/datadata-core';
import schema from '../../stories/StoryboardSchema.js';
import { foo1Id } from '../../test/EntityFixtures.js';
import { createBackendAdminClient } from '../../test/TestContextAdapter.js';
import { insecureTestUuidv4 } from '../../test/TestUtils.js';
import type { EntityEditorState } from './EntityEditorReducer.js';
import {
  AddEntityDraftAction,
  initializeEntityEditorState,
  reduceEntityEditorState,
  SetNameAction,
  UpdateEntityAction,
} from './EntityEditorReducer.js';

function newState(): EntityEditorState {
  return initializeEntityEditorState({ schema });
}

function stateWithoutSchema(state: EntityEditorState) {
  const { schema, ...newState } = state;
  newState.drafts = state.drafts.map((draftState) => {
    const newDraftState = { ...draftState };
    if (newDraftState.entity) {
      const { entitySpec, ...newEntity } = newDraftState.entity;
      newEntity.fields = newEntity.fields.map((field) => {
        const { fieldSpec, ...newField } = field;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return newField as any;
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newDraftState.entity = newEntity as any;
    }
    return newDraftState;
  });
  return newState;
}

async function updateEntityWithFixture(
  adminClient: AdminClient,
  state: EntityEditorState,
  id: string
): Promise<EntityEditorState> {
  const entityResult = await adminClient.getEntity({ id });
  if (entityResult.isError()) {
    throw entityResult.toError();
  }
  const entity = entityResult.value;
  return reduceEntityEditorState(state, new UpdateEntityAction(entity.id, entity));
}

describe('reduceEntityEditorState', () => {
  test('AddDraftAction new entity', async () => {
    const id = 'e4e78fce-1089-41b8-9b6b-440d2e044061';
    let state = newState();
    state = reduceEntityEditorState(state, new AddEntityDraftAction({ id, newType: 'Foo' }));
    expect(stateWithoutSchema(state)).toMatchSnapshot();
  });

  test('SetNameAction new entity', () => {
    const id = insecureTestUuidv4();
    let state = newState();
    state = reduceEntityEditorState(state, new AddEntityDraftAction({ id, newType: 'Foo' }));
    state = reduceEntityEditorState(state, new SetNameAction(id, 'New name'));
    expect(state.drafts[0].entity?.name).toEqual('New name');
  });

  test('UpdateEntityAction', async () => {
    const adminClient = createBackendAdminClient();
    let state = newState();
    state = reduceEntityEditorState(state, new AddEntityDraftAction({ id: foo1Id }));
    state = await updateEntityWithFixture(adminClient, state, foo1Id);
    expect(stateWithoutSchema(state)).toMatchSnapshot();
  });
});
