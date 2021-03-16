import { v4 as uuidv4 } from 'uuid';
import schema from '../../stories/StoryboardSchema';
import { TestContextAdapter } from '../../test/TestContextAdapter';
import { foo1Id } from '../../test/EntityFixtures';
import type { EntityEditorState } from './EntityEditorReducer';
import {
  AddDraftAction,
  initializeEditorState,
  reduceEditorState,
  SetNameAction,
  UpdateEntityAction,
} from './EntityEditorReducer';

function newState(): EntityEditorState {
  return initializeEditorState({ schema });
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
  state: EntityEditorState,
  fixtures: TestContextAdapter,
  id: string
): Promise<EntityEditorState> {
  const entityResult = await fixtures.getEntity(id);
  if (entityResult.isError()) {
    throw entityResult.toError();
  }
  const entity = entityResult.value;
  return reduceEditorState(state, new UpdateEntityAction(entity.id, entity));
}

describe('reduceEditorState', () => {
  test('AddDraftAction new entity', async () => {
    const id = 'e4e78fce-1089-41b8-9b6b-440d2e044061';
    let state = newState();
    state = reduceEditorState(state, new AddDraftAction({ id, newType: 'Foo' }));
    expect(stateWithoutSchema(state)).toMatchSnapshot();
  });

  test('SetNameAction new entity', () => {
    const id = uuidv4();
    let state = newState();
    state = reduceEditorState(state, new AddDraftAction({ id, newType: 'Foo' }));
    state = reduceEditorState(state, new SetNameAction(id, 'New name'));
    expect(state.drafts[0].entity?.name).toEqual('New name');
  });

  test('UpdateEntityAction', async () => {
    const fixtures = new TestContextAdapter();
    let state = newState();
    state = reduceEditorState(state, new AddDraftAction({ id: foo1Id }));
    state = await updateEntityWithFixture(state, fixtures, foo1Id);
    expect(stateWithoutSchema(state)).toMatchSnapshot();
  });
});
