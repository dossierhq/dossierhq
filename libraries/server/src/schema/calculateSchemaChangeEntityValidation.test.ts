import {
  AdminSchemaWithMigrations,
  FieldType,
  ok,
  type AdminSchemaSpecificationUpdate,
} from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import { calculateSchemaChangeEntityValidation } from './calculateSchemaChangeEntityValidation.js';

function build(
  previousUpdate: AdminSchemaSpecificationUpdate,
  nextUpdate: AdminSchemaSpecificationUpdate,
) {
  const previous = AdminSchemaWithMigrations.createAndValidate(previousUpdate).valueOrThrow();
  const next = previous.updateAndValidate(nextUpdate).valueOrThrow();
  return { previous, next };
}

describe('calculateSchemaChangeEntityValidation unchanged', () => {
  test('no change: empty -> empty', () => {
    const { previous, next } = build({}, {});
    expect(calculateSchemaChangeEntityValidation(previous, next)).toEqual(
      ok({ entityTypes: [], valueTypes: [] }),
    );
  });

  test('no change: one entity type unchanged', () => {
    const { previous, next } = build({ entityTypes: [{ name: 'OneType', fields: [] }] }, {});
    expect(calculateSchemaChangeEntityValidation(previous, next)).toEqual(
      ok({ entityTypes: [], valueTypes: [] }),
    );
  });

  test('no change: one value type, unchanged', () => {
    const { previous, next } = build({ valueTypes: [{ name: 'OneType', fields: [] }] }, {});
    expect(calculateSchemaChangeEntityValidation(previous, next)).toEqual(
      ok({ entityTypes: [], valueTypes: [] }),
    );
  });
});

describe('calculateSchemaChangeEntityValidation authKeyPattern', () => {
  test('change: authKeyPattern added', () => {
    const { previous, next } = build(
      { entityTypes: [{ name: 'OneType', fields: [] }] },
      {
        entityTypes: [{ name: 'OneType', authKeyPattern: 'pattern', fields: [] }],
        patterns: [{ name: 'pattern', pattern: 'added-pattern' }],
      },
    );
    expect(calculateSchemaChangeEntityValidation(previous, next)).toEqual(
      ok({ entityTypes: ['OneType'], valueTypes: [] }),
    );
  });

  test('change: authKeyPattern modified', () => {
    const { previous, next } = build(
      {
        entityTypes: [{ name: 'OneType', authKeyPattern: 'pattern', fields: [] }],
        patterns: [{ name: 'pattern', pattern: 'old-pattern' }],
      },
      { patterns: [{ name: 'pattern', pattern: 'new-pattern' }] },
    );
    expect(calculateSchemaChangeEntityValidation(previous, next)).toEqual(
      ok({ entityTypes: ['OneType'], valueTypes: [] }),
    );
  });

  test('no change: authKeyPattern removed', () => {
    const { previous, next } = build(
      {
        entityTypes: [{ name: 'OneType', authKeyPattern: 'pattern', fields: [] }],
        patterns: [{ name: 'pattern', pattern: 'added-pattern' }],
      },
      { entityTypes: [{ name: 'OneType', fields: [] }] },
    );
    expect(calculateSchemaChangeEntityValidation(previous, next)).toEqual(
      ok({ entityTypes: [], valueTypes: [] }),
    );
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
    expect(calculateSchemaChangeEntityValidation(previous, next)).toEqual(
      ok({ entityTypes: [], valueTypes: [] }),
    );
  });
});

describe('calculateSchemaChangeEntityValidation field.matchPattern', () => {
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
    expect(calculateSchemaChangeEntityValidation(previous, next)).toEqual(
      ok({ entityTypes: ['OneType'], valueTypes: [] }),
    );
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
    expect(calculateSchemaChangeEntityValidation(previous, next)).toEqual(
      ok({ entityTypes: [], valueTypes: ['OneType'] }),
    );
  });
});

describe('calculateSchemaChangeEntityValidation migration deleteField', () => {
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
    expect(calculateSchemaChangeEntityValidation(previous, next)).toEqual(
      ok({ entityTypes: ['OneType'], valueTypes: [] }),
    );
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
    expect(calculateSchemaChangeEntityValidation(previous, next)).toEqual(
      ok({ entityTypes: [], valueTypes: ['OneType'] }),
    );
  });
});
