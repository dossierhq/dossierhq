import { AdminSchema } from '@jonasb/datadata-core';
import {
  EntityEditorActions,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from './EntityEditorReducer';

describe('initializeEntityEditorState', () => {
  test('no args', () => {
    const state = initializeEntityEditorState();
    expect(state).toMatchInlineSnapshot(`
      Object {
        "drafts": Array [],
        "schema": null,
        "status": "uninitialized",
      }
    `);
  });
});

describe('AddDraftAction', () => {
  test('add Foo', () => {
    const state = reduceEntityEditorState(
      initializeEntityEditorState(),
      new EntityEditorActions.AddDraft({
        id: '619725d7-e583-4544-8bb0-23fc3c2870c0',
        newType: 'Foo',
      })
    );
    expect(state).toMatchSnapshot();
  });
});

describe('UpdateSchemaSpecificationAction', () => {
  test('add empty schema', () => {
    const state = reduceEntityEditorState(
      initializeEntityEditorState(),
      new EntityEditorActions.UpdateSchemaSpecification(
        new AdminSchema({ entityTypes: [], valueTypes: [] })
      )
    );
    expect(state).toMatchSnapshot();
  });
});
