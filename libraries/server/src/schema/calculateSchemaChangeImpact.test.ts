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
  return { previous, next };
}

describe('calculateSchemaChangeImpact unchanged', () => {
  test('no change: empty -> empty', () => {
    const { previous, next } = build({}, {});
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('no change: one entity type unchanged', () => {
    const { previous, next } = build({ entityTypes: [{ name: 'OneType', fields: [] }] }, {});
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
        "renameValueTypes": {},
      }
    `);
  });

  test('no change: one value type, unchanged', () => {
    const { previous, next } = build({ valueTypes: [{ name: 'OneType', fields: [] }] }, {});
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
        "renameValueTypes": {},
      }
    `);
  });

  test('change: from true to false value type', () => {
    const { previous, next } = build(
      { valueTypes: [{ name: 'OneType', adminOnly: true, fields: [] }] },
      { valueTypes: [{ name: 'OneType', adminOnly: false, fields: [] }] },
    );
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
        "renameValueTypes": {},
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
        "renameValueTypes": {},
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
        "renameValueTypes": {},
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
        "renameValueTypes": {},
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
        "renameValueTypes": {},
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [
          "OneType",
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
        valueTypes: [
          {
            name: 'AnotherValueItem',
            fields: [{ name: 'richText', type: FieldType.RichText, linkEntityTypes: ['OneType'] }],
          },
        ],
      },
      { migrations: [{ version: 2, actions: [{ action: 'deleteType', entityType: 'OneType' }] }] },
    );
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [
          "OneType",
        ],
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
        "renameValueTypes": {},
      }
    `);
  });

  test('delete value type', () => {
    const { previous, next } = build(
      { valueTypes: [{ name: 'OneType', fields: [] }] },
      { migrations: [{ version: 2, actions: [{ action: 'deleteType', valueType: 'OneType' }] }] },
    );
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
        "renameValueTypes": {},
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [
          "OldName",
        ],
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
        "renameValueTypes": {},
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {
          "OldName": "NewName",
        },
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
        valueTypes: [
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {
          "OldName": "NewName",
        },
        "renameValueTypes": {},
      }
    `);
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
        "renameValueTypes": {
          "OldName": "NewName",
        },
      }
    `);
  });

  test('rename value type with referencing fields', () => {
    const { previous, next } = build(
      {
        valueTypes: [
          { name: 'OldName', fields: [] },
          {
            name: 'AnotherValueItem',
            fields: [{ name: 'valueItem', type: FieldType.ValueItem, valueTypes: ['OldName'] }],
          },
        ],
        entityTypes: [
          {
            name: 'AnotherEntity',
            fields: [{ name: 'richText', type: FieldType.RichText, valueTypes: ['OldName'] }],
          },
        ],
      },
      {
        migrations: [
          {
            version: 2,
            actions: [{ action: 'renameType', valueType: 'OldName', newName: 'NewName' }],
          },
        ],
      },
    );
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
        "renameValueTypes": {
          "OldName": "NewName",
        },
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
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
        "renameValueTypes": {
          "OldName": "NewName",
        },
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
    expect(calculateSchemaChangeImpact(previous, next).valueOrThrow()).toMatchInlineSnapshot(`
      {
        "deleteEntityTypes": [],
        "deleteValueTypes": [],
        "dirtyEntitiesSelector": null,
        "renameEntityTypes": {},
        "renameValueTypes": {
          "OldName": "NewName",
        },
      }
    `);
  });
});
