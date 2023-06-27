import {
  FieldType,
  RichTextNodeType,
  type AdminBooleanFieldSpecificationUpdate,
  type AdminEntityFieldSpecificationUpdate,
  type AdminEntityTypeSpecificationUpdate,
  type AdminLocationFieldSpecificationUpdate,
  type AdminNumberFieldSpecificationUpdate,
  type AdminRichTextFieldSpecificationUpdate,
  type AdminSchemaSpecificationUpdate,
  type AdminStringFieldSpecificationUpdate,
  type AdminValueItemFieldSpecificationUpdate,
} from '@dossierhq/core';

export const SCHEMA = {
  entityTypes: [
    {
      name: 'BooleansEntity',
      fields: [
        { name: 'normal', type: FieldType.Boolean },
        { name: 'required', type: FieldType.Boolean, required: true },
      ],
    },
    {
      name: 'EntitiesEntity',
      fields: [
        { name: 'normal', type: FieldType.Entity },
        { name: 'required', type: FieldType.Entity, required: true },
        { name: 'list', type: FieldType.Entity, list: true },
        { name: 'stringsEntity', type: FieldType.Entity, entityTypes: ['StringsEntity'] },
        {
          name: 'stringsEntityList',
          type: FieldType.Entity,
          list: true,
          entityTypes: ['StringsEntity'],
        },
        {
          name: 'stringsAndLocationsEntity',
          type: FieldType.Entity,
          entityTypes: ['LocationsEntity', 'StringsEntity'],
        },
        {
          name: 'stringsAndLocationsEntityList',
          type: FieldType.Entity,
          list: true,
          entityTypes: ['LocationsEntity', 'StringsEntity'],
        },
      ],
    },
    {
      name: 'LocationsEntity',
      fields: [
        { name: 'normal', type: FieldType.Location },
        { name: 'required', type: FieldType.Location, required: true },
        { name: 'list', type: FieldType.Location, list: true },
        { name: 'requiredList', type: FieldType.Location, list: true, required: true },
      ],
    },
    {
      name: 'NumbersEntity',
      fields: [
        { name: 'normal', type: FieldType.Number },
        { name: 'required', type: FieldType.Number, required: true },
        { name: 'integer', type: FieldType.Number, integer: true },
        { name: 'list', type: FieldType.Number, list: true },
        { name: 'requiredList', type: FieldType.Number, list: true, required: true },
        {
          name: 'requiredIntegerList',
          type: FieldType.Number,
          list: true,
          required: true,
          integer: true,
        },
      ],
    },
    {
      name: 'RichTextsEntity',
      fields: [
        { name: 'normal', type: FieldType.RichText },
        { name: 'required', type: FieldType.RichText, required: true },
        {
          name: 'minimal',
          type: FieldType.RichText,
          richTextNodes: [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
            RichTextNodeType.linebreak,
          ],
        },
        {
          name: 'code',
          type: FieldType.RichText,
          richTextNodes: [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
            RichTextNodeType.linebreak,
            RichTextNodeType.tab,
            RichTextNodeType.code,
            RichTextNodeType['code-highlight'],
          ],
        },
        { name: 'list', type: FieldType.RichText, list: true },
        { name: 'adminOnly', type: FieldType.RichText, adminOnly: true },
        {
          name: 'stringsEntity',
          type: FieldType.RichText,
          richTextNodes: [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
            RichTextNodeType.linebreak,
            RichTextNodeType.entity,
          ],
          entityTypes: ['StringsEntity'],
        },
        {
          name: 'numbersEntityLink',
          type: FieldType.RichText,
          richTextNodes: [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
            RichTextNodeType.linebreak,
            RichTextNodeType.entityLink,
          ],
          linkEntityTypes: ['NumbersEntity'],
        },
        {
          name: 'nestedValueItem',
          type: FieldType.RichText,
          richTextNodes: [
            RichTextNodeType.root,
            RichTextNodeType.paragraph,
            RichTextNodeType.text,
            RichTextNodeType.linebreak,
            RichTextNodeType.valueItem,
          ],
          valueTypes: ['NestedValueItem'],
        },
      ],
    },
    {
      name: 'StringsEntity',
      nameField: 'title',
      fields: [
        { name: 'title', type: FieldType.String },
        { name: 'normal', type: FieldType.String, multiline: false },
        { name: 'required', type: FieldType.String, required: true },
        { name: 'multiline', type: FieldType.String, multiline: true },
        { name: 'index', type: FieldType.String, index: 'slug' },
        { name: 'matchPattern', type: FieldType.String, matchPattern: 'fooBarBaz' },
        {
          name: 'values',
          type: FieldType.String,
          values: [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
        },
        {
          name: 'valuesList',
          type: FieldType.String,
          list: true,
          values: [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
        },
        { name: 'list', type: FieldType.String, list: true },
        { name: 'requiredList', type: FieldType.String, list: true, required: true },
        {
          name: 'requiredListMatchPattern',
          type: FieldType.String,
          list: true,
          required: true,
          matchPattern: 'fooBarBaz',
        },
      ],
    },
    {
      name: 'ValueItemsEntity',
      fields: [
        { name: 'normal', type: FieldType.ValueItem },
        { name: 'required', type: FieldType.ValueItem, required: true },
        { name: 'list', type: FieldType.ValueItem, list: true },
        { name: 'requiredList', type: FieldType.ValueItem, list: true, required: true },
        { name: 'adminOnly', type: FieldType.ValueItem, adminOnly: true },
        { name: 'cloudinaryImage', type: FieldType.ValueItem, valueTypes: ['CloudinaryImage'] },
      ],
    },
  ],
  valueTypes: [
    {
      name: 'CloudinaryImage',
      fields: [
        { name: 'publicId', type: FieldType.String, required: true },
        { name: 'width', type: FieldType.Number, integer: true, required: true },
        { name: 'height', type: FieldType.Number, integer: true, required: true },
        { name: 'alt', type: FieldType.String },
      ],
    },
    {
      name: 'NestedValueItem',
      fields: [
        { name: 'text', type: FieldType.String },
        { name: 'child', type: FieldType.ValueItem, valueTypes: ['NestedValueItem'] },
      ],
    },
    {
      name: 'StringsValueItem',
      fields: [
        { name: 'normal', type: FieldType.String },
        { name: 'required', type: FieldType.String, required: true },
        { name: 'matchPattern', type: FieldType.String, matchPattern: 'fooBarBaz' },
        { name: 'list', type: FieldType.String, list: true },
        { name: 'requiredList', type: FieldType.String, list: true, required: true },
        {
          name: 'requiredListMatchPattern',
          type: FieldType.String,
          list: true,
          required: true,
          matchPattern: 'fooBarBaz',
        },
      ],
    },
  ],
  patterns: [
    { name: 'none', pattern: '^none$' },
    { name: 'fooBarBaz', pattern: '^(foo|bar|baz)$' },
  ],
  indexes: [{ name: 'slug', type: 'unique' }],
} satisfies AdminSchemaSpecificationUpdate;

export const SCHEMA_WITHOUT_VALIDATIONS: AdminSchemaSpecificationUpdate = {
  ...SCHEMA,
  entityTypes: SCHEMA.entityTypes.map((entityType) => {
    switch (entityType.name) {
      case 'BooleansEntity':
        return copyEntityType(entityType, (entityType) => {
          booleanFieldSpec(entityType, 'required').required = false;
        });
      case 'EntitiesEntity':
        return copyEntityType(entityType, (entityType) => {
          entityFieldSpec(entityType, 'required').required = false;
          entityFieldSpec(entityType, 'stringsEntity').entityTypes = [];
          entityFieldSpec(entityType, 'stringsEntityList').entityTypes = [];
          entityFieldSpec(entityType, 'stringsAndLocationsEntity').entityTypes = [];
          entityFieldSpec(entityType, 'stringsAndLocationsEntityList').entityTypes = [];
        });
      case 'LocationsEntity':
        return copyEntityType(entityType, (entityType) => {
          locationFieldSpec(entityType, 'required').required = false;
          locationFieldSpec(entityType, 'requiredList').required = false;
        });
      case 'NumbersEntity':
        return copyEntityType(entityType, (entityType) => {
          numberFieldSpec(entityType, 'required').required = false;
          numberFieldSpec(entityType, 'integer').integer = false;
          numberFieldSpec(entityType, 'requiredList').required = false;
          numberFieldSpec(entityType, 'requiredIntegerList').required = false;
          numberFieldSpec(entityType, 'requiredIntegerList').integer = false;
        });
      case 'RichTextsEntity':
        return copyEntityType(entityType, (entityType) => {
          richTextFieldSpec(entityType, 'required').required = false;
          richTextFieldSpec(entityType, 'minimal').richTextNodes = [];
          richTextFieldSpec(entityType, 'stringsEntity').richTextNodes = [];
          richTextFieldSpec(entityType, 'stringsEntity').entityTypes = [];
          richTextFieldSpec(entityType, 'numbersEntityLink').richTextNodes = [];
          richTextFieldSpec(entityType, 'numbersEntityLink').linkEntityTypes = [];
          richTextFieldSpec(entityType, 'nestedValueItem').richTextNodes = [];
          richTextFieldSpec(entityType, 'nestedValueItem').valueTypes = [];
        });
      case 'StringsEntity':
        return copyEntityType(entityType, (entityType) => {
          stringFieldSpec(entityType, 'required').required = false;
          stringFieldSpec(entityType, 'normal').multiline = true;
          stringFieldSpec(entityType, 'matchPattern').matchPattern = null;
          stringFieldSpec(entityType, 'values').values = [];
          stringFieldSpec(entityType, 'valuesList').values = [];
          stringFieldSpec(entityType, 'requiredList').required = false;
          stringFieldSpec(entityType, 'requiredListMatchPattern').required = false;
          stringFieldSpec(entityType, 'requiredListMatchPattern').matchPattern = null;
        });
      case 'ValueItemsEntity':
        return copyEntityType(entityType, (entityType) => {
          valueItemFieldSpec(entityType, 'required').required = false;
          valueItemFieldSpec(entityType, 'requiredList').required = false;
          valueItemFieldSpec(entityType, 'cloudinaryImage').valueTypes = [];
        });
      default:
        return entityType;
    }
  }),
};

function copyEntityType(
  entityType: AdminEntityTypeSpecificationUpdate,
  modifier: (entityType: AdminEntityTypeSpecificationUpdate) => void
): AdminEntityTypeSpecificationUpdate {
  const copy = structuredClone(entityType);
  modifier(copy);
  return copy;
}

function fieldSpec(entityType: AdminEntityTypeSpecificationUpdate, name: string) {
  const field = entityType.fields.find((field) => field.name === name);
  if (!field) {
    throw new Error(`Field ${entityType.name}.${name} not found`);
  }
  return field;
}

function booleanFieldSpec(
  entityType: AdminEntityTypeSpecificationUpdate,
  name: string
): AdminBooleanFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.Boolean) {
    throw new Error(`Field ${entityType.name}.${name} is not boolean (${field.type})`);
  }
  return field;
}

function entityFieldSpec(
  entityType: AdminEntityTypeSpecificationUpdate,
  name: string
): AdminEntityFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.Entity) {
    throw new Error(`Field ${entityType.name}.${name} is not entity (${field.type})`);
  }
  return field;
}

function locationFieldSpec(
  entityType: AdminEntityTypeSpecificationUpdate,
  name: string
): AdminLocationFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.Location) {
    throw new Error(`Field ${entityType.name}.${name} is not location (${field.type})`);
  }
  return field;
}

function numberFieldSpec(
  entityType: AdminEntityTypeSpecificationUpdate,
  name: string
): AdminNumberFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.Number) {
    throw new Error(`Field ${entityType.name}.${name} is not number (${field.type})`);
  }
  return field;
}

function richTextFieldSpec(
  entityType: AdminEntityTypeSpecificationUpdate,
  name: string
): AdminRichTextFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.RichText) {
    throw new Error(`Field ${entityType.name}.${name} is not rich text (${field.type})`);
  }
  return field;
}

function stringFieldSpec(
  entityType: AdminEntityTypeSpecificationUpdate,
  name: string
): AdminStringFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.String) {
    throw new Error(`Field ${entityType.name}.${name} is not string (${field.type})`);
  }
  return field;
}

function valueItemFieldSpec(
  entityType: AdminEntityTypeSpecificationUpdate,
  name: string
): AdminValueItemFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.ValueItem) {
    throw new Error(`Field ${entityType.name}.${name} is not value item (${field.type})`);
  }
  return field;
}
