import { AdminSchema, ok, type AdminSchemaSpecificationUpdate, FieldType } from '@dossierhq/core';
import { describe, expect, test } from 'vitest';
import { calculateSchemaChangeRevalidation } from './calculateSchemaChangeRevalidation.js';

function build(
  previousUpdate: AdminSchemaSpecificationUpdate,
  nextUpdate: AdminSchemaSpecificationUpdate
) {
  const previous = AdminSchema.createAndValidate(previousUpdate).valueOrThrow();
  const next = previous.mergeWith(nextUpdate).valueOrThrow();
  return { previous, next };
}

describe('calculateSchemaChangeRevalidation unchanged', () => {
  test('no change: empty -> empty', () => {
    const { previous, next } = build({}, {});
    expect(calculateSchemaChangeRevalidation(previous, next)).toEqual(
      ok({ entityTypes: [], valueTypes: [] })
    );
  });

  test('no change: one entity type unchanged', () => {
    const { previous, next } = build({ entityTypes: [{ name: 'OneType', fields: [] }] }, {});
    expect(calculateSchemaChangeRevalidation(previous, next)).toEqual(
      ok({ entityTypes: [], valueTypes: [] })
    );
  });

  test('no change: one value type, unchanged', () => {
    const { previous, next } = build({ valueTypes: [{ name: 'OneType', fields: [] }] }, {});
    expect(calculateSchemaChangeRevalidation(previous, next)).toEqual(
      ok({ entityTypes: [], valueTypes: [] })
    );
  });
});

describe('calculateSchemaChangeRevalidation authKeyPattern', () => {
  test('change: authKeyPattern added', () => {
    const { previous, next } = build(
      { entityTypes: [{ name: 'OneType', fields: [] }] },
      {
        entityTypes: [{ name: 'OneType', authKeyPattern: 'pattern', fields: [] }],
        patterns: [{ name: 'pattern', pattern: 'added-pattern' }],
      }
    );
    expect(calculateSchemaChangeRevalidation(previous, next)).toEqual(
      ok({ entityTypes: ['OneType'], valueTypes: [] })
    );
  });

  test('change: authKeyPattern modified', () => {
    const { previous, next } = build(
      {
        entityTypes: [{ name: 'OneType', authKeyPattern: 'pattern', fields: [] }],
        patterns: [{ name: 'pattern', pattern: 'old-pattern' }],
      },
      { patterns: [{ name: 'pattern', pattern: 'new-pattern' }] }
    );
    expect(calculateSchemaChangeRevalidation(previous, next)).toEqual(
      ok({ entityTypes: ['OneType'], valueTypes: [] })
    );
  });

  test('no change: authKeyPattern removed', () => {
    const { previous, next } = build(
      {
        entityTypes: [{ name: 'OneType', authKeyPattern: 'pattern', fields: [] }],
        patterns: [{ name: 'pattern', pattern: 'added-pattern' }],
      },
      { entityTypes: [{ name: 'OneType', fields: [] }] }
    );
    expect(calculateSchemaChangeRevalidation(previous, next)).toEqual(
      ok({ entityTypes: [], valueTypes: [] })
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
      }
    );
    expect(calculateSchemaChangeRevalidation(previous, next)).toEqual(
      ok({ entityTypes: [], valueTypes: [] })
    );
  });
});

describe('calculateSchemaChangeRevalidation field.matchPattern', () => {
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
      { patterns: [{ name: 'aPattern', pattern: 'modified-pattern' }] }
    );
    expect(calculateSchemaChangeRevalidation(previous, next)).toEqual(
      ok({ entityTypes: ['OneType'], valueTypes: [] })
    );
  });

  test('change: matchPattern pattern change entity type', () => {
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
      { patterns: [{ name: 'aPattern', pattern: 'modified-pattern' }] }
    );
    expect(calculateSchemaChangeRevalidation(previous, next)).toEqual(
      ok({ entityTypes: [], valueTypes: ['OneType'] })
    );
  });
});
