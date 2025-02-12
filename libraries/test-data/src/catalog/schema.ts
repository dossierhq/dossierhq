import {
  FieldType,
  REQUIRED_RICH_TEXT_NODES,
  RichTextNodeType,
  type BooleanFieldSpecificationUpdate,
  type ComponentFieldSpecificationUpdate,
  type EntityTypeSpecificationUpdate,
  type LocationFieldSpecificationUpdate,
  type NumberFieldSpecificationUpdate,
  type ReferenceFieldSpecificationUpdate,
  type RichTextFieldSpecificationUpdate,
  type SchemaSpecificationUpdate,
  type StringFieldSpecificationUpdate,
} from '@dossierhq/core';

export const SCHEMA: SchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'BooleansEntity',
      fields: [
        { name: 'normal', type: FieldType.Boolean },
        { name: 'required', type: FieldType.Boolean, required: true },
        { name: 'list', type: FieldType.Boolean, list: true },
      ],
    },
    {
      name: 'ReferencesEntity',
      fields: [
        { name: 'normal', type: FieldType.Reference },
        { name: 'required', type: FieldType.Reference, required: true },
        { name: 'list', type: FieldType.Reference, list: true },
        { name: 'stringsEntity', type: FieldType.Reference, entityTypes: ['StringsEntity'] },
        {
          name: 'stringsEntityList',
          type: FieldType.Reference,
          list: true,
          entityTypes: ['StringsEntity'],
        },
        {
          name: 'stringsAndLocationsEntity',
          type: FieldType.Reference,
          entityTypes: ['LocationsEntity', 'StringsEntity'],
        },
        {
          name: 'stringsAndLocationsEntityList',
          type: FieldType.Reference,
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
          richTextNodes: REQUIRED_RICH_TEXT_NODES,
        },
        {
          name: 'code',
          type: FieldType.RichText,
          richTextNodes: [
            ...REQUIRED_RICH_TEXT_NODES,
            RichTextNodeType.code,
            RichTextNodeType['code-highlight'],
          ],
        },
        { name: 'list', type: FieldType.RichText, list: true },
        { name: 'adminOnly', type: FieldType.RichText, adminOnly: true },
        {
          name: 'stringsEntity',
          type: FieldType.RichText,
          richTextNodes: [...REQUIRED_RICH_TEXT_NODES, RichTextNodeType.entity],
          entityTypes: ['StringsEntity'],
        },
        {
          name: 'numbersEntityLink',
          type: FieldType.RichText,
          richTextNodes: [...REQUIRED_RICH_TEXT_NODES, RichTextNodeType.entityLink],
          linkEntityTypes: ['NumbersEntity'],
        },
        {
          name: 'nestedComponent',
          type: FieldType.RichText,
          richTextNodes: [...REQUIRED_RICH_TEXT_NODES, RichTextNodeType.component],
          componentTypes: ['NestedComponent'],
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
        { name: 'multilineList', type: FieldType.String, multiline: true, list: true },
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
      name: 'ComponentsEntity',
      fields: [
        { name: 'normal', type: FieldType.Component, adminOnly: false },
        { name: 'required', type: FieldType.Component, required: true },
        { name: 'list', type: FieldType.Component, list: true },
        { name: 'requiredList', type: FieldType.Component, list: true, required: true },
        { name: 'adminOnly', type: FieldType.Component, adminOnly: true },
        { name: 'cloudinaryImage', type: FieldType.Component, componentTypes: ['CloudinaryImage'] },
      ],
    },
  ],
  componentTypes: [
    {
      name: 'AdminOnlyComponent',
      adminOnly: true,
      fields: [{ name: 'text', type: FieldType.String }],
    },
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
      name: 'NestedComponent',
      fields: [
        { name: 'text', type: FieldType.String },
        { name: 'child', type: FieldType.Component, componentTypes: ['NestedComponent'] },
      ],
    },
    {
      name: 'StringsComponent',
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
  patterns: [{ name: 'fooBarBaz', pattern: '^(foo|bar|baz)$' }],
  indexes: [{ name: 'slug', type: 'unique' }],
} satisfies SchemaSpecificationUpdate;

export const SCHEMA_WITHOUT_VALIDATIONS: SchemaSpecificationUpdate = {
  ...SCHEMA,
  entityTypes: SCHEMA.entityTypes?.map((entityType) => {
    switch (entityType.name) {
      case 'BooleansEntity':
        return copyEntityType(entityType, (entityType) => {
          booleanFieldSpec(entityType, 'required').required = false;
        });
      case 'ReferencesEntity':
        return copyEntityType(entityType, (entityType) => {
          referenceFieldSpec(entityType, 'required').required = false;
          referenceFieldSpec(entityType, 'stringsEntity').entityTypes = [];
          referenceFieldSpec(entityType, 'stringsEntityList').entityTypes = [];
          referenceFieldSpec(entityType, 'stringsAndLocationsEntity').entityTypes = [];
          referenceFieldSpec(entityType, 'stringsAndLocationsEntityList').entityTypes = [];
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
          richTextFieldSpec(entityType, 'adminOnly').adminOnly = false;
          richTextFieldSpec(entityType, 'stringsEntity').richTextNodes = [];
          richTextFieldSpec(entityType, 'stringsEntity').entityTypes = [];
          richTextFieldSpec(entityType, 'numbersEntityLink').richTextNodes = [];
          richTextFieldSpec(entityType, 'numbersEntityLink').linkEntityTypes = [];
          richTextFieldSpec(entityType, 'nestedComponent').richTextNodes = [];
          richTextFieldSpec(entityType, 'nestedComponent').componentTypes = [];
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
      case 'ComponentsEntity':
        return copyEntityType(entityType, (entityType) => {
          componentFieldSpec(entityType, 'normal').adminOnly = true; // to allow adding admin only components
          componentFieldSpec(entityType, 'required').required = false;
          componentFieldSpec(entityType, 'requiredList').required = false;
          componentFieldSpec(entityType, 'adminOnly').adminOnly = false;
          componentFieldSpec(entityType, 'cloudinaryImage').componentTypes = [];
        });
      default:
        return entityType;
    }
  }),
};

function copyEntityType(
  entityType: EntityTypeSpecificationUpdate,
  modifier: (entityType: EntityTypeSpecificationUpdate) => void,
): EntityTypeSpecificationUpdate {
  const copy = structuredClone(entityType);
  modifier(copy);
  return copy;
}

function fieldSpec(entityType: EntityTypeSpecificationUpdate, name: string) {
  const field = entityType.fields.find((field) => field.name === name);
  if (!field) {
    throw new Error(`Field ${entityType.name}.${name} not found`);
  }
  return field;
}

function booleanFieldSpec(
  entityType: EntityTypeSpecificationUpdate,
  name: string,
): BooleanFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.Boolean) {
    throw new Error(`Field ${entityType.name}.${name} is not boolean (${field.type})`);
  }
  return field;
}

function componentFieldSpec(
  entityType: EntityTypeSpecificationUpdate,
  name: string,
): ComponentFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.Component) {
    throw new Error(`Field ${entityType.name}.${name} is not component (${field.type})`);
  }
  return field;
}

function referenceFieldSpec(
  entityType: EntityTypeSpecificationUpdate,
  name: string,
): ReferenceFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.Reference) {
    throw new Error(`Field ${entityType.name}.${name} is not entity (${field.type})`);
  }
  return field;
}

function locationFieldSpec(
  entityType: EntityTypeSpecificationUpdate,
  name: string,
): LocationFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.Location) {
    throw new Error(`Field ${entityType.name}.${name} is not location (${field.type})`);
  }
  return field;
}

function numberFieldSpec(
  entityType: EntityTypeSpecificationUpdate,
  name: string,
): NumberFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.Number) {
    throw new Error(`Field ${entityType.name}.${name} is not number (${field.type})`);
  }
  return field;
}

function richTextFieldSpec(
  entityType: EntityTypeSpecificationUpdate,
  name: string,
): RichTextFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.RichText) {
    throw new Error(`Field ${entityType.name}.${name} is not rich text (${field.type})`);
  }
  return field;
}

function stringFieldSpec(
  entityType: EntityTypeSpecificationUpdate,
  name: string,
): StringFieldSpecificationUpdate {
  const field = fieldSpec(entityType, name);
  if (field.type !== FieldType.String) {
    throw new Error(`Field ${entityType.name}.${name} is not string (${field.type})`);
  }
  return field;
}
