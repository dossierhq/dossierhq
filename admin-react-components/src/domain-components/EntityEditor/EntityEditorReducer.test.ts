import type { AdminEntity } from '@datadata/core';
import { CoreTestUtils } from '@datadata/core';
import schema from '../../stories/StoryboardSchema';
import { TestContextAdapter } from '../../test/TestContextAdapter';
import { foo1Id } from '../../test/EntityFixtures';
import type { EntityEditorState } from './EntityEditorReducer';
import {
  forTest,
  reduceEditorState,
  SetNameAction,
  UpdateEntityAction,
} from './EntityEditorReducer';
const { expectOkResult } = CoreTestUtils;
const { createEditorEntityState } = forTest;

function entityState(entity: AdminEntity): EntityEditorState['entity'] {
  const entitySpec = schema.getEntityTypeSpecification(entity._type);
  if (!entitySpec) {
    throw new Error('No entity spec');
  }
  return createEditorEntityState(entitySpec, entity);
}

function newState(state: { id: string } & Partial<EntityEditorState>): EntityEditorState {
  return { initMessage: null, entityLoadMessage: null, schema, entity: null, ...state };
}

function stateWithoutSchema(state: EntityEditorState) {
  const { schema, ...newState } = state;
  if (newState.entity) {
    const { entitySpec, ...newEntity } = newState.entity;
    newEntity.fields = newEntity.fields.map((field) => {
      const { fieldSpec, ...newField } = field;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return newField as any;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newState.entity = newEntity as any;
  }
  return newState;
}

describe('reduceEditorState', () => {
  test('SetNameAction', async () => {
    const fixtures = new TestContextAdapter();
    const entityResult = await fixtures.getEntity(foo1Id);
    if (expectOkResult(entityResult)) {
      const state = reduceEditorState(
        newState({ id: foo1Id, entity: entityState(entityResult.value) }),
        new SetNameAction('New name')
      );
      expect(state.entity?.name).toEqual('New name');
    }
  });

  test('UpdateEntityAction', async () => {
    const fixtures = new TestContextAdapter();
    const entityResult = await fixtures.getEntity(foo1Id);
    if (expectOkResult(entityResult)) {
      const entity = entityResult.value;
      const state = reduceEditorState(newState({ id: entity.id }), new UpdateEntityAction(entity));
      expect(stateWithoutSchema(state)).toMatchInlineSnapshot(`
        Object {
          "entity": Object {
            "fields": Array [
              Object {
                "initialValue": "Hello",
                "value": "Hello",
              },
              Object {
                "initialValue": Array [
                  "one",
                  "two",
                  "three",
                ],
                "value": Array [
                  "one",
                  "two",
                  "three",
                ],
              },
              Object {
                "initialValue": Object {
                  "lat": 55.60498,
                  "lng": 13.003822,
                },
                "value": Object {
                  "lat": 55.60498,
                  "lng": 13.003822,
                },
              },
              Object {
                "initialValue": Array [
                  Object {
                    "lat": 55.60498,
                    "lng": 13.003822,
                  },
                  Object {
                    "lat": 56.381561,
                    "lng": 13.99286,
                  },
                ],
                "value": Array [
                  Object {
                    "lat": 55.60498,
                    "lng": 13.003822,
                  },
                  Object {
                    "lat": 56.381561,
                    "lng": 13.99286,
                  },
                ],
              },
              Object {
                "initialValue": Object {
                  "id": "cb228716-d3dd-444f-9a77-80443d436339",
                },
                "value": Object {
                  "id": "cb228716-d3dd-444f-9a77-80443d436339",
                },
              },
              Object {
                "initialValue": Array [
                  Object {
                    "id": "cb228716-d3dd-444f-9a77-80443d436339",
                  },
                  Object {
                    "id": "eb5732e2-b931-492b-82f1-f8fdd464f0d2",
                  },
                ],
                "value": Array [
                  Object {
                    "id": "cb228716-d3dd-444f-9a77-80443d436339",
                  },
                  Object {
                    "id": "eb5732e2-b931-492b-82f1-f8fdd464f0d2",
                  },
                ],
              },
              Object {
                "initialValue": Object {
                  "_type": "AnnotatedBar",
                  "annotation": "Annotation",
                  "bar": Object {
                    "id": "eb5732e2-b931-492b-82f1-f8fdd464f0d2",
                  },
                },
                "value": Object {
                  "_type": "AnnotatedBar",
                  "annotation": "Annotation",
                  "bar": Object {
                    "id": "eb5732e2-b931-492b-82f1-f8fdd464f0d2",
                  },
                },
              },
              Object {
                "initialValue": Array [
                  Object {
                    "_type": "AnnotatedBar",
                    "annotation": "First",
                    "bar": Object {
                      "id": "cb228716-d3dd-444f-9a77-80443d436339",
                    },
                  },
                  Object {
                    "_type": "AnnotatedBar",
                    "annotation": "Second",
                    "bar": Object {
                      "id": "eb5732e2-b931-492b-82f1-f8fdd464f0d2",
                    },
                  },
                ],
                "value": Array [
                  Object {
                    "_type": "AnnotatedBar",
                    "annotation": "First",
                    "bar": Object {
                      "id": "cb228716-d3dd-444f-9a77-80443d436339",
                    },
                  },
                  Object {
                    "_type": "AnnotatedBar",
                    "annotation": "Second",
                    "bar": Object {
                      "id": "eb5732e2-b931-492b-82f1-f8fdd464f0d2",
                    },
                  },
                ],
              },
              Object {
                "initialValue": null,
                "value": null,
              },
            ],
            "initialName": "Foo 1",
            "name": "Foo 1",
            "version": 0,
          },
          "entityLoadMessage": null,
          "id": "fc66b4d7-61ff-44d4-8f68-cb7f526df046",
          "initMessage": null,
        }
      `);
    }
  });
});
