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
          "indexEntityTypes": [],
          "indexValueTypes": [],
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
          "indexEntityTypes": [],
          "indexValueTypes": [],
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
        "indexEntityTypes": [
          "OneType",
        ],
        "indexValueTypes": [],
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
        "indexEntityTypes": [],
        "indexValueTypes": [
          "OneType",
        ],
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
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
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
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
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
          "indexEntityTypes": [],
          "indexValueTypes": [],
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
          "indexEntityTypes": [],
          "indexValueTypes": [],
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
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
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
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
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
          "indexEntityTypes": [],
          "indexValueTypes": [],
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
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        }
      `);
  });
});
