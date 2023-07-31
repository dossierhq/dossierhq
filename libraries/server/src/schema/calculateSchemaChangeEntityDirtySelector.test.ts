import {
  AdminSchemaWithMigrations,
  FieldType,
  ok,
  type AdminSchemaSpecificationUpdate,
} from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import { calculateSchemaChangeEntityDirtySelector } from './calculateSchemaChangeEntityDirtySelector.js';

function build(
  previousUpdate: AdminSchemaSpecificationUpdate,
  nextUpdate: AdminSchemaSpecificationUpdate,
) {
  const previous = AdminSchemaWithMigrations.createAndValidate(previousUpdate).valueOrThrow();
  const next = previous.updateAndValidate(nextUpdate).valueOrThrow();
  return { previous, next };
}

describe('calculateSchemaChangeEntityDirtySelector unchanged', () => {
  test('no change: empty -> empty', () => {
    const { previous, next } = build({}, {});
    expect(calculateSchemaChangeEntityDirtySelector(previous, next)).toEqual(ok(null));
  });

  test('no change: one entity type unchanged', () => {
    const { previous, next } = build({ entityTypes: [{ name: 'OneType', fields: [] }] }, {});
    expect(calculateSchemaChangeEntityDirtySelector(previous, next)).toEqual(ok(null));
  });

  test('no change: one value type, unchanged', () => {
    const { previous, next } = build({ valueTypes: [{ name: 'OneType', fields: [] }] }, {});
    expect(calculateSchemaChangeEntityDirtySelector(previous, next)).toEqual(ok(null));
  });
});

describe('calculateSchemaChangeEntityDirtySelector authKeyPattern', () => {
  test('change: authKeyPattern added', () => {
    const { previous, next } = build(
      { entityTypes: [{ name: 'OneType', fields: [] }] },
      {
        entityTypes: [{ name: 'OneType', authKeyPattern: 'pattern', fields: [] }],
        patterns: [{ name: 'pattern', pattern: 'added-pattern' }],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "renameValueTypes": {},
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        }
      `);
  });

  test('change: authKeyPattern modified', () => {
    const { previous, next } = build(
      {
        entityTypes: [{ name: 'OneType', authKeyPattern: 'pattern', fields: [] }],
        patterns: [{ name: 'pattern', pattern: 'old-pattern' }],
      },
      { patterns: [{ name: 'pattern', pattern: 'new-pattern' }] },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "renameValueTypes": {},
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        }
      `);
  });

  test('no change: authKeyPattern removed', () => {
    const { previous, next } = build(
      {
        entityTypes: [{ name: 'OneType', authKeyPattern: 'pattern', fields: [] }],
        patterns: [{ name: 'pattern', pattern: 'added-pattern' }],
      },
      { entityTypes: [{ name: 'OneType', fields: [] }] },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next)).toEqual(ok(null));
  });

  test('no change: authKeyPattern renamed', () => {
    const { previous, next } = build(
      {
        entityTypes: [{ name: 'OneType', authKeyPattern: 'previousPatternName', fields: [] }],
        patterns: [{ name: 'previousPatternName', pattern: 'the-pattern' }],
      },
      {
        entityTypes: [{ name: 'OneType', authKeyPattern: 'nextPatternName', fields: [] }],
        patterns: [{ name: 'nextPatternName', pattern: 'the-pattern' }],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow()).toEqual(null);
  });
});

describe('calculateSchemaChangeEntityDirtySelector type.adminOnly', () => {
  test('change: from true to false entity type', () => {
    const { previous, next } = build(
      { entityTypes: [{ name: 'OneType', adminOnly: true, fields: [] }] },
      { entityTypes: [{ name: 'OneType', adminOnly: false, fields: [] }] },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
          "renameValueTypes": {},
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        }
      `);
  });

  test('change: from true to false value type', () => {
    const { previous, next } = build(
      { valueTypes: [{ name: 'OneType', adminOnly: true, fields: [] }] },
      { valueTypes: [{ name: 'OneType', adminOnly: false, fields: [] }] },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
          "renameValueTypes": {},
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        }
      `);
  });
});

describe('calculateSchemaChangeEntityDirtySelector field.adminOnly', () => {
  test('change: from true to false entity type', () => {
    const { previous, next } = build(
      {
        entityTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.Boolean, adminOnly: true }],
          },
        ],
      },
      {
        entityTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.Boolean, adminOnly: false }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
          "renameValueTypes": {},
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        }
      `);
  });

  test('change: from true to false value type', () => {
    const { previous, next } = build(
      {
        valueTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.Boolean, adminOnly: true }],
          },
        ],
      },
      {
        valueTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.Boolean, adminOnly: false }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
          "renameValueTypes": {},
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        }
      `);
  });
});

describe('calculateSchemaChangeEntityDirtySelector field.index', () => {
  test('change: index change entity type', () => {
    const { previous, next } = build(
      {
        entityTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.String, index: 'anIndex' }],
          },
        ],
        indexes: [{ name: 'anIndex', type: 'unique' }],
      },
      {
        entityTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.String, index: 'anotherIndex' }],
          },
        ],
        indexes: [{ name: 'anotherIndex', type: 'unique' }],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
          "renameValueTypes": {},
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        }
      `);
  });

  test('change: index change value type', () => {
    const { previous, next } = build(
      {
        valueTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.String, index: 'anIndex' }],
          },
        ],
        indexes: [{ name: 'anIndex', type: 'unique' }],
      },
      {
        valueTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.String, index: 'anotherIndex' }],
          },
        ],
        indexes: [{ name: 'anotherIndex', type: 'unique' }],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
          "renameValueTypes": {},
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        }
      `);
  });
});

describe('calculateSchemaChangeEntityDirtySelector field.matchPattern', () => {
  test('change: matchPattern pattern change entity type', () => {
    const { previous, next } = build(
      {
        entityTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.String, matchPattern: 'aPattern' }],
          },
        ],
        patterns: [{ name: 'aPattern', pattern: 'old-pattern' }],
      },
      { patterns: [{ name: 'aPattern', pattern: 'modified-pattern' }] },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "renameValueTypes": {},
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        }
      `);
  });

  test('change: matchPattern pattern change value type', () => {
    const { previous, next } = build(
      {
        valueTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.String, matchPattern: 'aPattern' }],
          },
        ],
        patterns: [{ name: 'aPattern', pattern: 'old-pattern' }],
      },
      { patterns: [{ name: 'aPattern', pattern: 'modified-pattern' }] },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "renameValueTypes": {},
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        }
      `);
  });
});

describe('calculateSchemaChangeEntityDirtySelector migration deleteField', () => {
  test('delete field on entity type', () => {
    const { previous, next } = build(
      { entityTypes: [{ name: 'OneType', fields: [{ name: 'field', type: FieldType.String }] }] },
      {
        migrations: [
          {
            version: 2,
            actions: [{ action: 'deleteField', entityType: 'OneType', field: 'field' }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
          "renameValueTypes": {},
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        }
      `);
  });

  test('delete field on value type', () => {
    const { previous, next } = build(
      { valueTypes: [{ name: 'OneType', fields: [{ name: 'field', type: FieldType.String }] }] },
      {
        migrations: [
          {
            version: 2,
            actions: [{ action: 'deleteField', valueType: 'OneType', field: 'field' }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
          "renameValueTypes": {},
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        }
      `);
  });
});

describe('calculateSchemaChangeEntityDirtySelector migration renameField', () => {
  test('rename field on entity type', () => {
    const { previous, next } = build(
      { entityTypes: [{ name: 'OneType', fields: [{ name: 'field', type: FieldType.String }] }] },
      {
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameField', entityType: 'OneType', field: 'field', newName: 'newName' },
            ],
          },
        ],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "renameValueTypes": {},
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        }
      `);
  });

  test('rename field on value type', () => {
    const { previous, next } = build(
      { valueTypes: [{ name: 'OneType', fields: [{ name: 'field', type: FieldType.String }] }] },
      {
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameField', valueType: 'OneType', field: 'field', newName: 'newName' },
            ],
          },
        ],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "renameValueTypes": {},
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        }
      `);
  });
});

describe('calculateSchemaChangeEntityDirtySelector migration deleteType', () => {
  test('delete entity type', () => {
    const { previous, next } = build(
      { entityTypes: [{ name: 'OneType', fields: [] }] },
      { migrations: [{ version: 2, actions: [{ action: 'deleteType', entityType: 'OneType' }] }] },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
          "renameValueTypes": {},
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        }
      `);
  });

  test('delete entity type with referencing fields', () => {
    const { previous, next } = build(
      {
        entityTypes: [
          { name: 'OneType', fields: [] },
          {
            name: 'AnotherEntity',
            fields: [{ name: 'entity', type: FieldType.Entity, entityTypes: ['OneType'] }],
          },
        ],
        valueTypes: [
          {
            name: 'AnotherValueItem',
            fields: [{ name: 'richText', type: FieldType.RichText, linkEntityTypes: ['OneType'] }],
          },
        ],
      },
      { migrations: [{ version: 2, actions: [{ action: 'deleteType', entityType: 'OneType' }] }] },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [],
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
          "renameValueTypes": {},
          "validateEntityTypes": [
            "AnotherEntity",
            "OneType",
          ],
          "validateValueTypes": [
            "AnotherValueItem",
          ],
        }
      `);
  });

  test('delete value type', () => {
    const { previous, next } = build(
      { valueTypes: [{ name: 'OneType', fields: [] }] },
      { migrations: [{ version: 2, actions: [{ action: 'deleteType', valueType: 'OneType' }] }] },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [
            "OneType",
          ],
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
          "renameValueTypes": {},
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        }
      `);
  });

  test('delete value type with referencing fields', () => {
    const { previous, next } = build(
      {
        valueTypes: [
          { name: 'OneType', fields: [] },
          {
            name: 'AnotherValueItem',
            fields: [{ name: 'valueItem', type: FieldType.ValueItem, valueTypes: ['OneType'] }],
          },
        ],
        entityTypes: [
          {
            name: 'AnotherEntity',
            fields: [{ name: 'richText', type: FieldType.RichText, valueTypes: ['OneType'] }],
          },
        ],
      },
      { migrations: [{ version: 2, actions: [{ action: 'deleteType', valueType: 'OneType' }] }] },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteValueTypes": [
            "OneType",
          ],
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
          "renameValueTypes": {},
          "validateEntityTypes": [
            "AnotherEntity",
          ],
          "validateValueTypes": [
            "AnotherValueItem",
            "OneType",
          ],
        }
      `);
  });

  test('rename and delete value type', () => {
    // Is not a normal use case, but we want to make sure we handle it correctly
    const { previous, next } = build(
      { valueTypes: [{ name: 'OldName', fields: [] }] },
      {
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameType', valueType: 'OldName', newName: 'NewName' },
              { action: 'deleteType', valueType: 'NewName' },
            ],
          },
        ],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
      {
        "deleteValueTypes": [
          "OldName",
        ],
        "indexEntityTypes": [],
        "indexValueTypes": [
          "OldName",
        ],
        "renameValueTypes": {},
        "validateEntityTypes": [],
        "validateValueTypes": [
          "OldName",
        ],
      }
    `);
  });
});

describe('calculateSchemaChangeEntityDirtySelector migration renameType', () => {
  test('rename entity type', () => {
    const { previous, next } = build(
      { entityTypes: [{ name: 'OldName', fields: [{ name: 'field', type: FieldType.String }] }] },
      {
        migrations: [
          {
            version: 2,
            actions: [{ action: 'renameType', entityType: 'OldName', newName: 'NewName' }],
          },
        ],
      },
    );
    expect(
      calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow(),
    ).toMatchInlineSnapshot('null'); //TODO
  });

  test('rename value type', () => {
    const { previous, next } = build(
      { valueTypes: [{ name: 'OldName', fields: [{ name: 'field', type: FieldType.String }] }] },
      {
        migrations: [
          {
            version: 2,
            actions: [{ action: 'renameType', valueType: 'OldName', newName: 'NewName' }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
      {
        "deleteValueTypes": [],
        "indexEntityTypes": [],
        "indexValueTypes": [],
        "renameValueTypes": {
          "OldName": "NewName",
        },
        "validateEntityTypes": [],
        "validateValueTypes": [],
      }
    `);
  });

  test('rename and change value type', () => {
    const { previous, next } = build(
      { valueTypes: [{ name: 'OldName', fields: [{ name: 'field', type: FieldType.String }] }] },
      {
        valueTypes: [
          {
            name: 'NewName',
            fields: [{ name: 'field', type: FieldType.String, values: [{ value: 'one' }] }],
          },
        ],
        migrations: [
          {
            version: 2,
            actions: [{ action: 'renameType', valueType: 'OldName', newName: 'NewName' }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
      {
        "deleteValueTypes": [],
        "indexEntityTypes": [],
        "indexValueTypes": [],
        "renameValueTypes": {
          "OldName": "NewName",
        },
        "validateEntityTypes": [],
        "validateValueTypes": [
          "NewName",
        ],
      }
    `);
  });

  test('rename value type twice', () => {
    // Not a normal use case, but we want to make sure we handle it correctly
    const { previous, next } = build(
      { valueTypes: [{ name: 'OldName', fields: [{ name: 'field', type: FieldType.String }] }] },
      {
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameType', valueType: 'OldName', newName: 'MidName' },
              { action: 'renameType', valueType: 'MidName', newName: 'NewName' },
            ],
          },
        ],
      },
    );
    expect(calculateSchemaChangeEntityDirtySelector(previous, next).valueOrThrow())
      .toMatchInlineSnapshot(`
      {
        "deleteValueTypes": [],
        "indexEntityTypes": [],
        "indexValueTypes": [],
        "renameValueTypes": {
          "OldName": "NewName",
        },
        "validateEntityTypes": [],
        "validateValueTypes": [],
      }
    `);
  });
});
