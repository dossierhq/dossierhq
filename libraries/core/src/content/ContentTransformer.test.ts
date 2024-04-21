import { describe, expect, test } from 'vitest';
import { ErrorType, ok } from '../ErrorResult.js';
import type { Component } from '../Types.js';
import { createRichText, createRichTextComponentNode } from '../content/RichTextUtils.js';
import { SchemaWithMigrations } from '../schema/Schema.js';
import { FieldType } from '../schema/SchemaSpecification.js';
import { expectErrorResult } from '../test/CoreTestUtils.js';
import { contentValuePathToString } from './ContentPath.js';
import {
  IDENTITY_TRANSFORMER,
  transformEntityFields,
  transformComponent,
} from './ContentTransformer.js';
import { isRichTextComponentNode, isComponentItemField } from './ContentTypeUtils.js';
import { copyEntity } from './ContentUtils.js';

const SCHEMA = SchemaWithMigrations.createAndValidate({
  entityTypes: [
    {
      name: 'StringsEntity',
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'stringList', type: FieldType.String, list: true },
      ],
    },
    {
      name: 'ComponentsEntity',
      fields: [
        { name: 'richText', type: FieldType.RichText },
        { name: 'component', type: FieldType.Component },
        { name: 'componentList', type: FieldType.Component, list: true },
      ],
    },
  ],
  componentTypes: [
    {
      name: 'NestedComponent',
      fields: [
        { name: 'child', type: FieldType.Component },
        { name: 'string', type: FieldType.String },
      ],
    },
  ],
}).valueOrThrow();

const STRINGS_ENTITY_1 = Object.freeze({
  info: { type: 'StringsEntity' },
  fields: {
    string: '1',
    stringList: ['1', '2'],
  },
});

const COMPONENTS_ENTITY_1 = Object.freeze({
  info: { type: 'ComponentsEntity' },
  fields: {
    richText: createRichText([
      createRichTextComponentNode({ type: 'NestedComponent', child: null, string: null }),
    ]),
    component: {
      type: 'NestedComponent',
      string: '1',
      child: { type: 'NestedComponent', string: '1.1', child: null },
    },
    componentList: [
      { type: 'NestedComponent', string: '1', child: null },
      { type: 'NestedComponent', string: '2', child: null },
    ],
  },
});

describe('transformEntity', () => {
  test('identity', () => {
    const calls: unknown[][] = [];
    const transformed = transformEntityFields(SCHEMA, [], COMPONENTS_ENTITY_1, {
      transformField: (_schema, path, _fieldSpec, value) => {
        calls.push(['transformField', contentValuePathToString(path)]);
        return ok(value);
      },
      transformFieldItem: (_schema, path, _fieldSpec, value) => {
        calls.push(['transformFieldItem', contentValuePathToString(path)]);
        return ok(value);
      },
      transformRichTextNode: (_schema, path, _fieldSpec, node) => {
        calls.push(['transformRichTextNode', contentValuePathToString(path)]);
        return ok(node);
      },
    }).valueOrThrow();
    expect(transformed).toBe(COMPONENTS_ENTITY_1.fields);
    expect(calls).toMatchSnapshot();
  });

  test('delete all components', () => {
    const transformed = transformEntityFields(SCHEMA, [], COMPONENTS_ENTITY_1, {
      transformField: (_schema, _path, _fieldSpec, value) => ok(value),
      transformFieldItem: (_schema, _path, fieldSpec, value) => {
        if (isComponentItemField(fieldSpec, value)) return ok(null);
        return ok(value);
      },
      transformRichTextNode: (_schema, _path, _fieldSpec, node) =>
        ok(isRichTextComponentNode(node) ? null : node),
    }).valueOrThrow();
    expect(transformed).toMatchSnapshot();
  });

  test('normalize entity fields: extra', () => {
    const transformed = transformEntityFields(
      SCHEMA,
      ['entity'],
      copyEntity(STRINGS_ENTITY_1, {
        fields: { extra: 'hello' } as unknown as typeof STRINGS_ENTITY_1.fields,
      }),
      IDENTITY_TRANSFORMER,
    ).valueOrThrow();
    expect(transformed).toEqual({ string: '1', stringList: ['1', '2'] });
  });

  test('normalize entity fields: extra with keepExtraFields', () => {
    const transformed = transformEntityFields(
      SCHEMA,
      ['entity'],
      copyEntity(STRINGS_ENTITY_1, {
        fields: { extra: 'hello' } as unknown as typeof STRINGS_ENTITY_1.fields,
      }),
      IDENTITY_TRANSFORMER,
      { keepExtraFields: true },
    ).valueOrThrow();
    expect(transformed).toEqual({ extra: 'hello', string: '1', stringList: ['1', '2'] });
  });

  test('normalize list: empty', () => {
    const transformed = transformEntityFields(
      SCHEMA,
      ['entity'],
      copyEntity(STRINGS_ENTITY_1, { fields: { stringList: [] } }),
      IDENTITY_TRANSFORMER,
    ).valueOrThrow();
    expect(transformed.stringList).toBe(null);
  });

  test('normalize string: empty', () => {
    const transformed = transformEntityFields(
      SCHEMA,
      ['entity'],
      copyEntity(STRINGS_ENTITY_1, { fields: { string: '' } }),
      IDENTITY_TRANSFORMER,
    ).valueOrThrow();
    expect(transformed.string).toBe(null);
  });

  test('normalize component: extra fields', () => {
    const copy = copyEntity(COMPONENTS_ENTITY_1, {
      fields: {
        component: {
          type: 'NestedComponent',
          unsupported: 'hello',
        } as unknown as typeof COMPONENTS_ENTITY_1.fields.component,
      },
    });
    const transformed = transformEntityFields(
      SCHEMA,
      ['entity'],
      copy,
      IDENTITY_TRANSFORMER,
    ).valueOrThrow();
    expect(transformed.component).toEqual({ type: 'NestedComponent', child: null, string: null });
  });

  test('normalize component: extra fields with keepExtraFields', () => {
    const copy = copyEntity(COMPONENTS_ENTITY_1, {
      fields: {
        component: {
          type: 'NestedComponent',
          unsupported: 'hello',
        } as unknown as typeof COMPONENTS_ENTITY_1.fields.component,
      },
    });
    const transformed = transformEntityFields(SCHEMA, ['entity'], copy, IDENTITY_TRANSFORMER, {
      keepExtraFields: true,
    }).valueOrThrow();
    expect(transformed.component).toEqual({
      type: 'NestedComponent',
      child: null,
      string: null,
      unsupported: 'hello',
    });
  });

  test('error: invalid entity type name', () => {
    const result = transformEntityFields(
      SCHEMA,
      ['entity'],
      copyEntity(STRINGS_ENTITY_1, { info: { type: 'Invalid' } }),
      IDENTITY_TRANSFORMER,
    );
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity: Couldn’t find spec for entity type Invalid',
    );
  });

  test('error: missing type in component', () => {
    const copy = copyEntity(COMPONENTS_ENTITY_1, {
      fields: {
        component: {} as unknown as typeof COMPONENTS_ENTITY_1.fields.component,
      },
    });
    const result = transformEntityFields(SCHEMA, ['entity'], copy, IDENTITY_TRANSFORMER);
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.component.type: Missing a Component type',
    );
  });

  test('error: string[] where string is expected', () => {
    const copy = copyEntity(STRINGS_ENTITY_1, {
      fields: {
        string: ['one', 'two'] as unknown as typeof STRINGS_ENTITY_1.fields.string,
      },
    });
    const result = transformEntityFields(SCHEMA, ['entity'], copy, IDENTITY_TRANSFORMER);
    expectErrorResult(
      result,
      ErrorType.BadRequest,
      'entity.string: Expected single String, got a list',
    );
  });
});

describe('transformComponent', () => {
  test('normalize component: extra field', () => {
    const transformed = transformComponent(
      SCHEMA,
      ['component'],
      { type: 'NestedComponent', child: null, string: null, extra: 'hello' },
      IDENTITY_TRANSFORMER,
    ).valueOrThrow();
    expect(transformed).toEqual({ type: 'NestedComponent', child: null, string: null });
  });

  test('normalize component: extra field with keepExtraFields', () => {
    const transformed = transformComponent(
      SCHEMA,
      ['component'],
      { type: 'NestedComponent', child: null, string: null, extra: 'hello' },
      IDENTITY_TRANSFORMER,
      { keepExtraFields: true },
    ).valueOrThrow();
    expect(transformed).toEqual({
      type: 'NestedComponent',
      child: null,
      string: null,
      extra: 'hello',
    });
  });

  test('error: invalid type name', () => {
    const transformed = transformComponent(
      SCHEMA,
      ['component'],
      { type: 'Invalid' },
      IDENTITY_TRANSFORMER,
    );
    expectErrorResult(
      transformed,
      ErrorType.BadRequest,
      'component: Couldn’t find spec for component type Invalid',
    );
  });

  test('error: missing type', () => {
    const transformed = transformComponent(
      SCHEMA,
      ['component'],
      {} as Component,
      IDENTITY_TRANSFORMER,
    );
    expectErrorResult(
      transformed,
      ErrorType.BadRequest,
      'component.type: Missing a component type',
    );
  });
});
