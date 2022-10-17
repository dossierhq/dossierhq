//@ts-check

/** @type {import("@jonasb/datadata-core").AdminSchemaSpecificationUpdate} */
const schemaSpecification = {
  entityTypes: [
    {
      name: 'Foo',
      adminOnly: false,
      authKeyPattern: 'none',
      fields: [
        { name: 'title', type: 'String', isName: true, required: true },
        { name: 'tags', type: 'String', list: true, matchPattern: 'tag' },
        { name: 'stringMatchPattern', type: 'String', matchPattern: 'foo-bar-baz' },
        { name: 'location', type: 'Location' },
        { name: 'locations', type: 'Location', list: true },
        { name: 'bar', type: 'EntityType', entityTypes: ['Bar'] },
        { name: 'bars', type: 'EntityType', entityTypes: ['Bar'], list: true },
        { name: 'body', type: 'RichText' },
        { name: 'active', type: 'Boolean' },
        { name: 'annotatedBar', type: 'ValueType', valueTypes: ['AnnotatedBar'] },
        {
          name: 'annotatedBars',
          type: 'ValueType',
          valueTypes: ['AnnotatedBar'],
          list: true,
        },
        { name: 'nested', type: 'ValueType', valueTypes: ['NestedValueItem'] },
      ],
    },
    {
      name: 'Bar',
      adminOnly: false,
      fields: [{ name: 'title', type: 'String', isName: true }],
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
      fields: [{ name: 'title', type: 'String', isName: true }],
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
          type: 'EntityType',
          entityTypes: ['Bar'],
        },
      ],
    },
    {
      name: 'NestedValueItem',
      adminOnly: false,
      fields: [
        { name: 'text', type: 'String' },
        { name: 'child', type: 'ValueType', valueTypes: ['NestedValueItem'] },
      ],
    },
  ],
  patterns: [
    { name: 'foo-bar-baz', pattern: '^(foo|bar|baz)$' },
    { name: 'none', pattern: '^none$' },
    { name: 'subject', pattern: '^subject$' },
    { name: 'tag', pattern: '^[a-z]+$' },
  ],
};

// eslint-disable-next-line no-undef
module.exports = schemaSpecification;
