import { describe, expect, test } from 'vitest';
import { AdminSchema } from '../schema/AdminSchema.js';
import type { PublishedSchema } from '../schema/PublishedSchema.js';
import { FieldType } from '../schema/SchemaSpecification.js';
import { contentValuePathToString } from './ContentPath.js';
import type { ContentTraverseNode } from './ContentTraverser.js';
import { ContentTraverseNodeType, traverseEntity, traverseValueItem } from './ContentTraverser.js';
import {
  createRichText,
  createRichTextParagraphNode,
  createRichTextTextNode,
  createRichTextValueItemNode,
} from './RichTextUtils.js';

const adminSchema = AdminSchema.createAndValidate({
  entityTypes: [
    {
      name: 'Foo',
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'stringList', type: FieldType.String, list: true },
        { name: 'twoStrings', type: FieldType.ValueItem, valueTypes: ['TwoStrings'] },
        { name: 'richText', type: FieldType.RichText },
        { name: 'adminOnlyString', type: FieldType.String, adminOnly: true },
      ],
    },
  ],
  valueTypes: [
    {
      name: 'TwoStrings',
      fields: [
        { name: 'string1', type: FieldType.String },
        { name: 'string2', type: FieldType.String },
      ],
    },
  ],
}).valueOrThrow();

const publishedSchema = adminSchema.toPublishedSchema();

type CollectedNode = { type: ContentTraverseNodeType } & Record<string, unknown>;

function collectTraverseNodes<TSchema extends AdminSchema | PublishedSchema>(
  generator: Generator<ContentTraverseNode<TSchema>>,
) {
  const payload: CollectedNode[] = [];
  for (const node of generator) {
    const path = contentValuePathToString(node.path);
    switch (node.type) {
      case ContentTraverseNodeType.error:
        payload.push({ type: node.type, path, message: node.message });
        break;
      case ContentTraverseNodeType.field:
        payload.push({ type: node.type, path, value: node.value });
        break;
      case ContentTraverseNodeType.valueItem:
        payload.push({ type: node.type, path, valueItem: node.valueItem });
        break;
      default: {
        payload.push(node as unknown as CollectedNode);
      }
    }
  }
  return payload;
}

function filterErrorTraverseNodes(nodes: CollectedNode[]) {
  return nodes.filter((node) => node.type === ContentTraverseNodeType.error);
}

describe('traverseEntity', () => {
  test('Empty Foo entity', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], { info: { type: 'Foo' }, fields: {} }),
    );
    expect(nodes).toMatchSnapshot();
  });

  test('Foo with two strings in list', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'Foo' },
        fields: { stringList: ['string1', 'string2'] },
      }),
    );
    expect(nodes).toMatchSnapshot();
  });

  test('Foo entity with TwoStrings value item', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'Foo' },
        fields: {
          string: 'string1',
          stringList: ['string2.1', 'string2.2'],
          twoStrings: { type: 'TwoStrings', string1: 'two-1', string2: 'two-2' },
        },
      }),
    );
    expect(nodes).toMatchSnapshot();
  });

  test('Foo entity with rich text with TwoStrings value item', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'Foo' },
        fields: {
          richText: createRichText([
            createRichTextValueItemNode({ type: 'TwoStrings', string1: 'two-1', string2: 'two-2' }),
          ]),
        },
      }),
    );
    expect(nodes).toMatchSnapshot();
  });

  test('Foo with adminOnly field (published)', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(publishedSchema, ['entity'], {
        info: { type: 'Foo' },
        fields: { adminOnlyString: 'Hello admin only' },
      }),
    );
    expect(nodes).toMatchSnapshot();
  });

  test('Foo entity string[] where string is expected', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'Foo' },
        fields: {
          string: ['string1', 'string2'],
        },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected single String, got a list",
          "path": "entity.fields.string",
          "type": "error",
        },
      ]
    `);
  });

  test('Foo entity richText[] where richText is expected', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'Foo' },
        fields: {
          richText: [
            createRichText([createRichTextParagraphNode([createRichTextTextNode('hello')])]),
          ],
        },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected single RichText, got a list",
          "path": "entity.fields.richText",
          "type": "error",
        },
      ]
    `);
  });

  test('Foo entity string where string[] is expected', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'Foo' },
        fields: {
          stringList: 'one string',
        },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected a list of String, got string",
          "path": "entity.fields.stringList",
          "type": "error",
        },
      ]
    `);
  });
});

describe('traverseValueItem', () => {
  test('Empty TwoStrings value item', () => {
    const nodes = collectTraverseNodes(
      traverseValueItem(adminSchema, ['valueItem'], { type: 'TwoStrings' }),
    );
    expect(nodes).toMatchSnapshot();
  });
});
