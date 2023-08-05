import { describe, expect, test } from 'vitest';
import type { ItemTraverseNode } from './ItemTraverser.js';
import { ItemTraverseNodeType, traverseEntity, traverseValueItem } from './ItemTraverser.js';
import { contentValuePathToString } from './content/ContentPath.js';
import { createRichText, createRichTextValueItemNode } from './content/RichTextUtils.js';
import { AdminSchema } from './schema/AdminSchema.js';
import type { PublishedSchema } from './schema/PublishedSchema.js';
import { FieldType } from './schema/SchemaSpecification.js';

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

function collectTraverseNodes<TSchema extends AdminSchema | PublishedSchema>(
  generator: Generator<ItemTraverseNode<TSchema>>,
) {
  const result = [];
  for (const node of generator) {
    const path = contentValuePathToString(node.path);
    switch (node.type) {
      case ItemTraverseNodeType.error:
        result.push({ type: node.type, path, message: node.message });
        break;
      case ItemTraverseNodeType.field:
        result.push({ type: node.type, path, value: node.value });
        break;
      case ItemTraverseNodeType.valueItem:
        result.push({ type: node.type, path, valueItem: node.valueItem });
        break;
      default: {
        result.push(node);
      }
    }
  }
  return result;
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
});

describe('traverseValueItem', () => {
  test('Empty TwoStrings value item', () => {
    const nodes = collectTraverseNodes(
      traverseValueItem(adminSchema, ['valueItem'], { type: 'TwoStrings' }),
    );
    expect(nodes).toMatchSnapshot();
  });
});
