import { describe, test, expect } from 'vitest';
import { ItemTraverseNodeErrorType } from './ItemTraverser.js';
import { validateTraverseNode } from './ItemValidator.js';
import { AdminSchema } from './Schema.js';

const schema = new AdminSchema({ entityTypes: [], valueTypes: [] });

describe('validateTraverseNode', () => {
  test('foo', () => {
    expect(
      validateTraverseNode(
        schema,
        {
          type: 'error',
          path: ['entity', 'foo'],
          errorType: ItemTraverseNodeErrorType.generic,
          message: 'Error message',
        },
        { validatePublish: true }
      )
    ).toMatchInlineSnapshot(`
      {
        "message": "Error message",
        "path": [
          "entity",
          "foo",
        ],
      }
    `);
  });
});
