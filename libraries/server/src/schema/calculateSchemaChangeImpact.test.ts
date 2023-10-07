import {
  AdminSchemaWithMigrations,
  FieldType,
  type AdminSchemaSpecificationUpdate,
} from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import { calculateSchemaChangeImpact } from './calculateSchemaChangeImpact.js';

function build(
  previousUpdate: AdminSchemaSpecificationUpdate,
  nextUpdate: AdminSchemaSpecificationUpdate,
) {
  const previous = AdminSchemaWithMigrations.createAndValidate(previousUpdate).valueOrThrow();
  const next = previous.updateAndValidate(nextUpdate).valueOrThrow();
  return { previous, next, transientMigrations: nextUpdate.transientMigrations ?? null };
}

describe('calculateSchemaChangeImpact unchanged', () => {
  test('no change: empty -> empty', () => {
    const { previous, next } = build({}, {});
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('no change: one entity type unchanged', () => {
    const { previous, next } = build({ entityTypes: [{ name: 'OneType', fields: [] }] }, {});
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('no change: one value type, unchanged', () => {
    const { previous, next } = build({ componentTypes: [{ name: 'OneType', fields: [] }] }, {});
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });
});

describe('calculateSchemaChangeImpact authKeyPattern', () => {
  test('change: authKeyPattern added', () => {
    const { previous, next } = build(
      { entityTypes: [{ name: 'OneType', fields: [] }] },
      {
        entityTypes: [{ name: 'OneType', authKeyPattern: 'pattern', fields: [] }],
        patterns: [{ name: 'pattern', pattern: 'added-pattern' }],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
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
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
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
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
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
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });
});

describe('calculateSchemaChangeImpact type.adminOnly', () => {
  test('change: from true to false entity type', () => {
    const { previous, next } = build(
      { entityTypes: [{ name: 'OneType', adminOnly: true, fields: [] }] },
      { entityTypes: [{ name: 'OneType', adminOnly: false, fields: [] }] },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('change: from true to false value type', () => {
    const { previous, next } = build(
      { componentTypes: [{ name: 'OneType', adminOnly: true, fields: [] }] },
      { componentTypes: [{ name: 'OneType', adminOnly: false, fields: [] }] },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });
});

describe('calculateSchemaChangeImpact field.adminOnly', () => {
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
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('change: from true to false value type', () => {
    const { previous, next } = build(
      {
        componentTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.Boolean, adminOnly: true }],
          },
        ],
      },
      {
        componentTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.Boolean, adminOnly: false }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });
});

describe('calculateSchemaChangeImpact field.index', () => {
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
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('change: index change value type', () => {
    const { previous, next } = build(
      {
        componentTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.String, index: 'anIndex' }],
          },
        ],
        indexes: [{ name: 'anIndex', type: 'unique' }],
      },
      {
        componentTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.String, index: 'anotherIndex' }],
          },
        ],
        indexes: [{ name: 'anotherIndex', type: 'unique' }],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });
});

describe('calculateSchemaChangeImpact field.matchPattern', () => {
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
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('change: matchPattern pattern change value type', () => {
    const { previous, next } = build(
      {
        componentTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.String, matchPattern: 'aPattern' }],
          },
        ],
        patterns: [{ name: 'aPattern', pattern: 'old-pattern' }],
      },
      { patterns: [{ name: 'aPattern', pattern: 'modified-pattern' }] },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });
});

describe('calculateSchemaChangeImpact migration deleteField', () => {
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
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('delete field on value type', () => {
    const { previous, next } = build(
      {
        componentTypes: [{ name: 'OneType', fields: [{ name: 'field', type: FieldType.String }] }],
      },
      {
        migrations: [
          {
            version: 2,
            actions: [{ action: 'deleteField', componentType: 'OneType', field: 'field' }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });
});

describe('calculateSchemaChangeImpact migration renameField', () => {
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
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('rename field on value type', () => {
    const { previous, next } = build(
      {
        componentTypes: [{ name: 'OneType', fields: [{ name: 'field', type: FieldType.String }] }],
      },
      {
        migrations: [
          {
            version: 2,
            actions: [
              {
                action: 'renameField',
                componentType: 'OneType',
                field: 'field',
                newName: 'newName',
              },
            ],
          },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });
});

describe('calculateSchemaChangeImpact migration deleteType', () => {
  test('delete entity type', () => {
    const { previous, next } = build(
      { entityTypes: [{ name: 'OneType', fields: [] }] },
      { migrations: [{ version: 2, actions: [{ action: 'deleteType', entityType: 'OneType' }] }] },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [
          "OneType",
        ],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
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
        componentTypes: [
          {
            name: 'AnotherValueItem',
            fields: [{ name: 'richText', type: FieldType.RichText, linkEntityTypes: ['OneType'] }],
          },
        ],
      },
      { migrations: [{ version: 2, actions: [{ action: 'deleteType', entityType: 'OneType' }] }] },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [
          "OneType",
        ],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "AnotherEntity",
            "OneType",
          ],
          "validateValueTypes": [
            "AnotherValueItem",
          ],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('delete value type', () => {
    const { previous, next } = build(
      { componentTypes: [{ name: 'OneType', fields: [] }] },
      {
        migrations: [{ version: 2, actions: [{ action: 'deleteType', componentType: 'OneType' }] }],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [
          "OneType",
        ],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OneType",
          ],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('delete value type with referencing fields', () => {
    const { previous, next } = build(
      {
        componentTypes: [
          { name: 'OneType', fields: [] },
          {
            name: 'AnotherValueItem',
            fields: [{ name: 'valueItem', type: FieldType.Component, componentTypes: ['OneType'] }],
          },
        ],
        entityTypes: [
          {
            name: 'AnotherEntity',
            fields: [{ name: 'richText', type: FieldType.RichText, componentTypes: ['OneType'] }],
          },
        ],
      },
      {
        migrations: [{ version: 2, actions: [{ action: 'deleteType', componentType: 'OneType' }] }],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [
          "OneType",
        ],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OneType",
          ],
          "validateEntityTypes": [
            "AnotherEntity",
          ],
          "validateValueTypes": [
            "AnotherValueItem",
            "OneType",
          ],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('rename and delete entity type', () => {
    // Is not a normal use case, but we want to make sure we handle it correctly
    const { previous, next } = build(
      { entityTypes: [{ name: 'OldName', fields: [] }] },
      {
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameType', entityType: 'OldName', newName: 'NewName' },
              { action: 'deleteType', entityType: 'NewName' },
            ],
          },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [
          "OldName",
        ],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [
            "OldName",
          ],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "OldName",
          ],
          "validateValueTypes": [],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('rename and delete value type', () => {
    // Is not a normal use case, but we want to make sure we handle it correctly
    const { previous, next } = build(
      { componentTypes: [{ name: 'OldName', fields: [] }] },
      {
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameType', componentType: 'OldName', newName: 'NewName' },
              { action: 'deleteType', componentType: 'NewName' },
            ],
          },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [
          "OldName",
        ],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [
            "OldName",
          ],
          "validateEntityTypes": [],
          "validateValueTypes": [
            "OldName",
          ],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });
});

describe('calculateSchemaChangeImpact migration renameType', () => {
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
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {
          "OldName": "NewName",
        },
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('rename entity type with referencing fields', () => {
    const { previous, next } = build(
      {
        entityTypes: [
          { name: 'OldName', fields: [] },
          {
            name: 'AnotherEntity',
            fields: [{ name: 'entity', type: FieldType.Entity, entityTypes: ['OldName'] }],
          },
        ],
        componentTypes: [
          {
            name: 'AnotherValueItem',
            fields: [{ name: 'richText', type: FieldType.RichText, linkEntityTypes: ['OldName'] }],
          },
        ],
      },
      {
        migrations: [
          {
            version: 2,
            actions: [{ action: 'renameType', entityType: 'OldName', newName: 'NewName' }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "AnotherEntity",
          ],
          "validateValueTypes": [
            "AnotherValueItem",
          ],
        },
        "renameEntityTypes": {
          "OldName": "NewName",
        },
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('rename and change entity type', () => {
    const { previous, next } = build(
      { entityTypes: [{ name: 'OldName', fields: [{ name: 'field', type: FieldType.String }] }] },
      {
        entityTypes: [
          {
            name: 'NewName',
            fields: [{ name: 'field', type: FieldType.String, values: [{ value: 'one' }] }],
          },
        ],
        migrations: [
          {
            version: 2,
            actions: [{ action: 'renameType', entityType: 'OldName', newName: 'NewName' }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "NewName",
          ],
          "validateValueTypes": [],
        },
        "renameEntityTypes": {
          "OldName": "NewName",
        },
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('rename entity type twice', () => {
    // Not a normal use case, but we want to make sure we handle it correctly
    const { previous, next } = build(
      { entityTypes: [{ name: 'OldName', fields: [{ name: 'field', type: FieldType.String }] }] },
      {
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameType', entityType: 'OldName', newName: 'MidName' },
              { action: 'renameType', entityType: 'MidName', newName: 'NewName' },
            ],
          },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {
          "OldName": "NewName",
        },
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('rename value type', () => {
    const { previous, next } = build(
      {
        componentTypes: [{ name: 'OldName', fields: [{ name: 'field', type: FieldType.String }] }],
      },
      {
        migrations: [
          {
            version: 2,
            actions: [{ action: 'renameType', componentType: 'OldName', newName: 'NewName' }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {
          "OldName": "NewName",
        },
      }
    `);
  });

  test('rename value type with referencing fields', () => {
    const { previous, next } = build(
      {
        componentTypes: [
          { name: 'OldName', fields: [] },
          {
            name: 'AnotherValueItem',
            fields: [{ name: 'valueItem', type: FieldType.Component, componentTypes: ['OldName'] }],
          },
        ],
        entityTypes: [
          {
            name: 'AnotherEntity',
            fields: [{ name: 'richText', type: FieldType.RichText, componentTypes: ['OldName'] }],
          },
        ],
      },
      {
        migrations: [
          {
            version: 2,
            actions: [{ action: 'renameType', componentType: 'OldName', newName: 'NewName' }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "AnotherEntity",
          ],
          "validateValueTypes": [
            "AnotherValueItem",
          ],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {
          "OldName": "NewName",
        },
      }
    `);
  });

  test('rename and change value type', () => {
    const { previous, next } = build(
      {
        componentTypes: [{ name: 'OldName', fields: [{ name: 'field', type: FieldType.String }] }],
      },
      {
        componentTypes: [
          {
            name: 'NewName',
            fields: [{ name: 'field', type: FieldType.String, values: [{ value: 'one' }] }],
          },
        ],
        migrations: [
          {
            version: 2,
            actions: [{ action: 'renameType', componentType: 'OldName', newName: 'NewName' }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [],
          "indexValueTypes": [],
          "validateEntityTypes": [],
          "validateValueTypes": [
            "NewName",
          ],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {
          "OldName": "NewName",
        },
      }
    `);
  });

  test('rename value type twice', () => {
    // Not a normal use case, but we want to make sure we handle it correctly
    const { previous, next } = build(
      {
        componentTypes: [{ name: 'OldName', fields: [{ name: 'field', type: FieldType.String }] }],
      },
      {
        migrations: [
          {
            version: 2,
            actions: [
              { action: 'renameType', componentType: 'OldName', newName: 'MidName' },
              { action: 'renameType', componentType: 'MidName', newName: 'NewName' },
            ],
          },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, null).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {
          "OldName": "NewName",
        },
      }
    `);
  });
});

describe('calculateSchemaChangeImpact transient migration deleteIndex', () => {
  test('delete unique index', () => {
    const { previous, next, transientMigrations } = build(
      {
        entityTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.String, index: 'anIndex' }],
          },
        ],
        indexes: [{ name: 'anIndex', type: 'unique' }],
      },
      { version: 2, transientMigrations: [{ action: 'deleteIndex', index: 'anIndex' }] },
    );
    expect(calculateSchemaChangeImpact(previous, next, transientMigrations).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteEntityTypes": [],
          "deleteUniqueValueIndexes": [
            "anIndex",
          ],
          "deleteValueTypes": [],
          "dirtyEntitiesSelector": {
            "indexEntityTypes": [
              "OneType",
            ],
            "indexValueTypes": [],
            "validateEntityTypes": [
              "OneType",
            ],
            "validateValueTypes": [],
          },
          "renameEntityTypes": {},
          "renameUniqueValueIndexes": {},
          "renameValueTypes": {},
        }
      `);
  });

  test('rename and delete unique index', () => {
    const { previous, next, transientMigrations } = build(
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
        version: 2,
        transientMigrations: [
          { action: 'renameIndex', index: 'anIndex', newName: 'newName' },
          { action: 'deleteIndex', index: 'newName' },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, transientMigrations).valueOrThrow())
      .toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteUniqueValueIndexes": [
          "anIndex",
        ],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": {
          "indexEntityTypes": [
            "OneType",
          ],
          "indexValueTypes": [],
          "validateEntityTypes": [
            "OneType",
          ],
          "validateValueTypes": [],
        },
        "renameEntityTypes": {},
        "renameUniqueValueIndexes": {},
        "renameValueTypes": {},
      }
    `);
  });
});

describe('calculateSchemaChangeImpact transient migration renameIndex', () => {
  test('rename unique index', () => {
    const { previous, next, transientMigrations } = build(
      {
        entityTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.String, index: 'oldName' }],
          },
        ],
        indexes: [{ name: 'oldName', type: 'unique' }],
      },
      {
        version: 2,
        transientMigrations: [{ action: 'renameIndex', index: 'oldName', newName: 'newName' }],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, transientMigrations).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteEntityTypes": [],
          "deleteUniqueValueIndexes": [],
          "deleteValueTypes": [],
          "dirtyEntitiesSelector": {
            "indexEntityTypes": [
              "OneType",
            ],
            "indexValueTypes": [],
            "validateEntityTypes": [
              "OneType",
            ],
            "validateValueTypes": [],
          },
          "renameEntityTypes": {},
          "renameUniqueValueIndexes": {
            "oldName": "newName",
          },
          "renameValueTypes": {},
        }
      `);
  });

  test('rename unique index twice', () => {
    // Not a normal use case, but we want to make sure we handle it correctly
    const { previous, next, transientMigrations } = build(
      {
        entityTypes: [
          {
            name: 'OneType',
            fields: [{ name: 'field', type: FieldType.String, index: 'oldName' }],
          },
        ],
        indexes: [{ name: 'oldName', type: 'unique' }],
      },
      {
        version: 2,
        transientMigrations: [
          { action: 'renameIndex', index: 'oldName', newName: 'midName' },
          { action: 'renameIndex', index: 'midName', newName: 'newName' },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next, transientMigrations).valueOrThrow())
      .toMatchInlineSnapshot(`
        {
          "deleteEntityTypes": [],
          "deleteUniqueValueIndexes": [],
          "deleteValueTypes": [],
          "dirtyEntitiesSelector": {
            "indexEntityTypes": [
              "OneType",
            ],
            "indexValueTypes": [],
            "validateEntityTypes": [
              "OneType",
            ],
            "validateValueTypes": [],
          },
          "renameEntityTypes": {},
          "renameUniqueValueIndexes": {
            "oldName": "newName",
          },
          "renameValueTypes": {},
        }
      `);
  });
});
