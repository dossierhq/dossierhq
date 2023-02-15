//@ts-check

/** @type {import("@dossierhq/core").AdminSchemaSpecificationUpdate} */
const schemaSpecification = {
  entityTypes: [
    {
      name: 'Foo',
      adminOnly: false,
      authKeyPattern: 'none',
      nameField: 'title',
      fields: [
        { name: 'title', type: 'String', required: true },
        { name: 'slug', type: 'String', index: 'fooSlug' },
        { name: 'tags', type: 'String', list: true, matchPattern: 'tag' },
        { name: 'stringMatchPattern', type: 'String', matchPattern: 'foo-bar-baz' },
        { name: 'location', type: 'Location' },
        { name: 'locations', type: 'Location', list: true },
        { name: 'bar', type: 'Entity', entityTypes: ['Bar'] },
        { name: 'bars', type: 'Entity', entityTypes: ['Bar'], list: true },
        { name: 'body', type: 'RichText' },
        { name: 'active', type: 'Boolean' },
        { name: 'annotatedBar', type: 'ValueItem', valueTypes: ['AnnotatedBar'] },
        {
          name: 'annotatedBars',
          type: 'ValueItem',
          valueTypes: ['AnnotatedBar'],
          list: true,
        },
        { name: 'nested', type: 'ValueItem', valueTypes: ['NestedValueItem'] },
      ],
    },
    {
      name: 'Bar',
      adminOnly: false,
      nameField: 'title',
      fields: [{ name: 'title', type: 'String' }],
    },
    {
      name: 'Baz',
      adminOnly: false,
      fields: [
        { name: 'body', type: 'RichText' },
        {
          name: 'bodyBar',
          type: 'RichText',
          entityTypes: ['Bar'],
          richTextNodes: ['root', 'paragraph', 'text', 'entity'],
        },
        {
          name: 'bodyNested',
          type: 'RichText',
          valueTypes: ['NestedValueItem'],
          richTextNodes: ['root', 'paragraph', 'text', 'valueItem'],
        },
        {
          name: 'bodyItalicOnly',
          type: 'RichText',
          //TODO support limiting formatting
        },
        {
          name: 'bodyNoInline',
          type: 'RichText',
          richTextNodes: ['root', 'paragraph', 'text'],
        },
      ],
    },
    {
      name: 'Qux',
      adminOnly: true,
      authKeyPattern: 'subject',
      nameField: 'title',
      fields: [{ name: 'title', type: 'String' }],
    },
  ],
  valueTypes: [
    {
      name: 'AnnotatedBar',
      adminOnly: false,
      fields: [
        {
          name: 'annotation',
          type: 'String',
        },
        {
          name: 'bar',
          type: 'Entity',
          entityTypes: ['Bar'],
        },
      ],
    },
    {
      name: 'NestedValueItem',
      adminOnly: false,
      fields: [
        { name: 'text', type: 'String', matchPattern: 'foo-bar-baz' },
        { name: 'child', type: 'ValueItem', valueTypes: ['NestedValueItem'] },
      ],
    },
  ],
  indexes: [{ name: 'fooSlug', type: 'unique' }],
  patterns: [
    { name: 'foo-bar-baz', pattern: '^(foo|bar|baz)$' },
    { name: 'none', pattern: '^none$' },
    { name: 'subject', pattern: '^subject$' },
    { name: 'tag', pattern: '^[a-z]+$' },
  ],
};

// eslint-disable-next-line no-undef
module.exports = schemaSpecification;
