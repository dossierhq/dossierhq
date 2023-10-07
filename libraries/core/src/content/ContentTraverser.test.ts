import { describe, expect, test } from 'vitest';
import { AdminEntityStatus, type AdminEntity, type Component } from '../Types.js';
import { AdminSchema } from '../schema/AdminSchema.js';
import type { PublishedSchema } from '../schema/PublishedSchema.js';
import { FieldType } from '../schema/SchemaSpecification.js';
import { contentValuePathToString } from './ContentPath.js';
import type { ContentTraverseNode } from './ContentTraverser.js';
import { ContentTraverseNodeType, traverseComponent, traverseEntity } from './ContentTraverser.js';
import {
  createRichText,
  createRichTextParagraphNode,
  createRichTextTextNode,
  createRichTextValueItemNode,
} from './RichTextUtils.js';

const adminSchema = AdminSchema.createAndValidate({
  entityTypes: [
    {
      name: 'BooleansEntity',
      fields: [
        { name: 'boolean', type: FieldType.Boolean },
        { name: 'booleanList', type: FieldType.Boolean, list: true },
      ],
    },
    {
      name: 'ComponentsEntity',
      fields: [
        { name: 'component', type: FieldType.Component },
        { name: 'componentList', type: FieldType.Component, list: true },
      ],
    },
    {
      name: 'EntitiesEntity',
      fields: [
        { name: 'entity', type: FieldType.Entity },
        { name: 'entityList', type: FieldType.Entity, list: true },
      ],
    },
    {
      name: 'LocationsEntity',
      fields: [
        { name: 'location', type: FieldType.Location },
        { name: 'locationList', type: FieldType.Location, list: true },
      ],
    },
    {
      name: 'NumbersEntity',
      fields: [
        { name: 'number', type: FieldType.Number },
        { name: 'numberList', type: FieldType.Number, list: true },
      ],
    },
    {
      name: 'RichTextsEntity',
      fields: [
        { name: 'richText', type: FieldType.RichText },
        { name: 'richTextList', type: FieldType.RichText, list: true },
      ],
    },
    {
      name: 'StringsEntity',
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'stringList', type: FieldType.String, list: true },
      ],
    },
    {
      name: 'Foo',
      fields: [
        { name: 'string', type: FieldType.String },
        { name: 'stringList', type: FieldType.String, list: true },
        { name: 'twoStrings', type: FieldType.Component, componentTypes: ['TwoStrings'] },
        { name: 'richText', type: FieldType.RichText },
        { name: 'adminOnlyString', type: FieldType.String, adminOnly: true },
      ],
    },
  ],
  componentTypes: [
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
      case ContentTraverseNodeType.entity:
        payload.push({ type: node.type, path, entity: node.entity });
        break;
      case ContentTraverseNodeType.error:
        payload.push({ type: node.type, path, message: node.message });
        break;
      case ContentTraverseNodeType.field:
        payload.push({ type: node.type, path, value: node.value });
        break;
      case ContentTraverseNodeType.component:
        payload.push({ type: node.type, path, component: node.component });
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

  test('Generated schema type', () => {
    type AdminStringsEntity = AdminEntity<'StringsEntity', AdminStringsEntityFields>;

    interface AdminStringsEntityFields {
      string: string | null;
      stringList: string[] | null;
    }

    const entity: AdminStringsEntity = {
      id: '123',
      info: {
        type: 'StringsEntity',
        name: 'Name',
        version: 1,
        status: AdminEntityStatus.draft,
        valid: true,
        validPublished: true,
        createdAt: new Date('2023-09-11T22:10:56.334Z'),
        updatedAt: new Date('2023-09-11T22:10:56.334Z'),
        authKey: 'none',
      },
      fields: { string: 'hello', stringList: ['1', '2'] },
    };

    const nodes = collectTraverseNodes(traverseEntity(adminSchema, ['entity'], entity));
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

  test('Foo entity with TwoStrings components', () => {
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

  test('Foo entity with rich text with TwoStrings component', () => {
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

  test('traversable: expect boolean, get boolean[]', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'BooleansEntity' },
        fields: {
          boolean: [true, false],
        },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected single Boolean, got a list",
          "path": "entity.fields.boolean",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect boolean[], get boolean', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'BooleansEntity' },
        fields: {
          booleanList: true,
        },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected a list of Boolean, got boolean",
          "path": "entity.fields.booleanList",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect boolean, get string', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'BooleansEntity' },
        fields: {
          boolean: 'string value',
        },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected a boolean, got string",
          "path": "entity.fields.boolean",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect entity, get entity[]', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'EntitiesEntity' },
        fields: { entity: [{ id: 'id1' }, { id: 'id2' }] },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected single Entity, got a list",
          "path": "entity.fields.entity",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect entity[], get entity', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'EntitiesEntity' },
        fields: { entitiesList: { id: '123' } },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot('[]');
  });

  test('traversable: expect entity, get string', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'EntitiesEntity' },
        fields: {
          entity: 'string value',
        },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected an entity reference, got string",
          "path": "entity.fields.entity",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect location, get location[]', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'LocationsEntity' },
        fields: { location: [{ lat: 1, lng: 2 }] },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected single Location, got a list",
          "path": "entity.fields.location",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect location[], get location', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'LocationsEntity' },
        fields: { locationList: { lat: 1, lng: 2 } },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected a list of Location, got object",
          "path": "entity.fields.locationList",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect location, get other', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'LocationsEntity' },
        fields: { location: 'string value', locationList: [{}, { lat: '123', lng: 123 }] },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected a Location object, got string",
          "path": "entity.fields.location",
          "type": "error",
        },
        {
          "message": "Expected {lat: number, lng: number}, got {lat: undefined, lng: undefined}",
          "path": "entity.fields.locationList[0]",
          "type": "error",
        },
        {
          "message": "Expected {lat: number, lng: number}, got {lat: string, lng: number}",
          "path": "entity.fields.locationList[1]",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect number, get number[]', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'NumbersEntity' },
        fields: { number: [1, 2, 3] },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected single Number, got a list",
          "path": "entity.fields.number",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect number[], get number', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'NumbersEntity' },
        fields: { numberList: 123 },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected a list of Number, got number",
          "path": "entity.fields.numberList",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect number, get other', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'NumbersEntity' },
        fields: { number: 'string value' },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected a number, got string",
          "path": "entity.fields.number",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect richText, get richText[]', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'RichTextsEntity' },
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

  test('traversable: expect richText[], get richText', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'RichTextsEntity' },
        fields: {
          richTextList: createRichText([
            createRichTextParagraphNode([createRichTextTextNode('hello')]),
          ]),
        },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected a list of RichText, got object",
          "path": "entity.fields.richTextList",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect richText, get other', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'RichTextsEntity' },
        fields: { richText: 'string value' },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected a RichText object, got string",
          "path": "entity.fields.richText",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect string, get string[]', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'StringsEntity' },
        fields: { string: ['string1', 'string2'] },
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

  test('traversable: expect string[], get string', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'StringsEntity' },
        fields: { stringList: 'one string' },
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

  test('traversable: expect string, get other', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'StringsEntity' },
        fields: { string: 1 },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected a string, got number",
          "path": "entity.fields.string",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect component, get component[]', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'ComponentsEntity' },
        fields: { component: [{ type: 'TwoStrings' }] },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected single Component, got a list",
          "path": "entity.fields.component",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect component[], get component', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'ComponentsEntity' },
        fields: { componentList: { type: 'TwoStrings' } },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected a list of Component, got object",
          "path": "entity.fields.componentList",
          "type": "error",
        },
      ]
    `);
  });

  test('traversable: expect component, get other', () => {
    const nodes = collectTraverseNodes(
      traverseEntity(adminSchema, ['entity'], {
        info: { type: 'ComponentsEntity' },
        fields: { component: 'string value', componentList: [{ lat: 1, lng: 2 }] },
      }),
    );
    expect(nodes).toMatchSnapshot();
    expect(filterErrorTraverseNodes(nodes)).toMatchInlineSnapshot(`
      [
        {
          "message": "Expected a Component object, got string",
          "path": "entity.fields.component",
          "type": "error",
        },
        {
          "message": "Missing a Component type",
          "path": "entity.fields.componentList[0].type",
          "type": "error",
        },
      ]
    `);
  });
});

describe('traverseComponent', () => {
  test('Empty TwoStrings component', () => {
    const nodes = collectTraverseNodes(
      traverseComponent(adminSchema, ['component'], { type: 'TwoStrings' }),
    );
    expect(nodes).toMatchSnapshot();
  });

  test('No type', () => {
    const nodes = collectTraverseNodes(
      traverseComponent(adminSchema, ['component'], {} as Component),
    );
    expect(nodes).toMatchSnapshot();
  });
});
