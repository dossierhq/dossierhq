import type {
  AdminEntityTypeSpecification,
  AdminFieldSpecification,
  AdminSchema,
  AdminValueTypeSpecification,
  PublishedEntityTypeSpecification,
  PublishedFieldSpecification,
  PublishedSchema,
  PublishedValueTypeSpecification,
} from '@dossierhq/core';
import { FieldType } from '@dossierhq/core';

interface GeneratorContext {
  coreImports: Set<string>;
}

export function generateTypescriptForSchema({
  adminSchema,
  publishedSchema,
  authKeyType = 'string',
}: {
  adminSchema: AdminSchema | null;
  publishedSchema: PublishedSchema | null;
  authKeyType?: string;
}) {
  const context: GeneratorContext = { coreImports: new Set<string>() };
  const paragraphs: string[] = [];

  if (adminSchema) {
    paragraphs.push(...generateAdminClientTypes(context));
    paragraphs.push(...generateAllTypesUnion(adminSchema.spec.entityTypes, 'Admin', 'Entities'));
    for (const entitySpec of adminSchema.spec.entityTypes) {
      paragraphs.push(...generateAdminEntityType(context, entitySpec, authKeyType));
    }
    paragraphs.push(...generateAllTypesUnion(adminSchema.spec.valueTypes, 'Admin', 'ValueItems'));
    for (const valueSpec of adminSchema.spec.valueTypes) {
      paragraphs.push(...generateAdminValueType(context, valueSpec));
    }
  }
  if (publishedSchema) {
    paragraphs.push(...generatePublishedClientTypes(context));
    paragraphs.push(
      ...generateAllTypesUnion(publishedSchema.spec.entityTypes, 'Published', 'Entities')
    );
    for (const entitySpec of publishedSchema.spec.entityTypes) {
      paragraphs.push(...generatePublishedEntityType(context, entitySpec, authKeyType));
    }
    paragraphs.push(
      ...generateAllTypesUnion(publishedSchema.spec.valueTypes, 'Published', 'ValueItems')
    );
    for (const valueSpec of publishedSchema.spec.valueTypes) {
      paragraphs.push(...generatePublishedValueType(context, valueSpec));
    }
  }

  if (context.coreImports.size > 0) {
    const importStatement = `import type { ${[...context.coreImports]
      .sort()
      .join(', ')} } from '@dossierhq/core';`;
    // insert
    paragraphs.splice(0, 0, importStatement);
  }
  paragraphs.push(''); // final newline
  return paragraphs.join('\n');
}

function generateAdminClientTypes(context: GeneratorContext) {
  context.coreImports.add('AdminClient');
  return ['', 'export type AppAdminClient = AdminClient<AllAdminEntities>;'];
}

function generatePublishedClientTypes(context: GeneratorContext) {
  context.coreImports.add('PublishedClient');
  return ['', 'export type AppPublishedClient = PublishedClient<AllPublishedEntities>;'];
}

function generateAllTypesUnion(
  types:
    | AdminEntityTypeSpecification[]
    | PublishedEntityTypeSpecification[]
    | AdminValueTypeSpecification[]
    | PublishedValueTypeSpecification[],
  adminOrPublished: 'Admin' | 'Published',
  entitiesOrValueItems: 'Entities' | 'ValueItems'
) {
  const typeDefinition =
    types.length === 0 ? 'never' : types.map((it) => `${adminOrPublished}${it.name}`).join(' | ');
  return ['', `export type All${adminOrPublished}${entitiesOrValueItems} = ${typeDefinition};`];
}

function generateAdminEntityType(
  context: GeneratorContext,
  entitySpec: AdminEntityTypeSpecification,
  authKeyType: string
) {
  return generateEntityType(context, entitySpec, 'Admin', authKeyType);
}

function generatePublishedEntityType(
  context: GeneratorContext,
  entitySpec: PublishedEntityTypeSpecification,
  authKeyType: string
) {
  return generateEntityType(context, entitySpec, 'Published', authKeyType);
}

function generateEntityType(
  context: GeneratorContext,
  entitySpec: PublishedEntityTypeSpecification,
  adminOrPublished: 'Admin' | 'Published',
  authKeyType: string
) {
  const paragraphs: string[] = [''];

  // fields type
  const fieldsName = `${adminOrPublished}${entitySpec.name}Fields`;
  if (entitySpec.fields.length === 0) {
    paragraphs.push(`export type ${fieldsName} = Record<never, never>;`);
  } else {
    paragraphs.push(`export interface ${fieldsName} {`);
    for (const fieldSpec of entitySpec.fields) {
      paragraphs.push(`  ${fieldSpec.name}: ${fieldType(context, fieldSpec, adminOrPublished)};`);
    }
    paragraphs.push(`}`);
  }
  paragraphs.push('');

  // entity type
  const parentTypeName = `${adminOrPublished}Entity`;
  const genericEntityType = `${parentTypeName}<string, object>`;
  const entityTypeName = `${adminOrPublished}${entitySpec.name}`;
  context.coreImports.add(parentTypeName);
  paragraphs.push(
    `export type ${entityTypeName} = ${parentTypeName}<'${entitySpec.name}', ${fieldsName}, ${authKeyType}>;`
  );

  // isAdminFoo() / isPublishedFoo()
  paragraphs.push('');
  paragraphs.push(
    `export function is${entityTypeName}(entity: ${genericEntityType}): entity is ${entityTypeName} {`
  );
  paragraphs.push(`  return entity.info.type === '${entitySpec.name}';`);
  paragraphs.push(`}`);

  // assertIsAdminFoo() / assertIsPublishedFoo()
  paragraphs.push('');
  paragraphs.push(
    `export function assertIs${entityTypeName}(entity: ${genericEntityType}): asserts entity is ${entityTypeName} {`
  );
  paragraphs.push(`  if (entity.info.type !== '${entitySpec.name}') {`);
  paragraphs.push(
    `    throw new Error('Expected info.type = ${entitySpec.name} (but was ' + entity.info.type + ')');`
  );
  paragraphs.push(`  }`);
  paragraphs.push(`}`);

  return paragraphs;
}

function generateAdminValueType(context: GeneratorContext, valueSpec: AdminValueTypeSpecification) {
  return generateValueType(context, valueSpec, 'Admin');
}

function generatePublishedValueType(
  context: GeneratorContext,
  valueSpec: PublishedValueTypeSpecification
) {
  return generateValueType(context, valueSpec, 'Published');
}

function generateValueType(
  context: GeneratorContext,
  valueSpec: PublishedValueTypeSpecification,
  adminOrPublished: 'Admin' | 'Published'
) {
  const paragraphs: string[] = [''];

  // fields type
  const fieldsName = `${adminOrPublished}${valueSpec.name}Fields`;
  if (valueSpec.fields.length === 0) {
    paragraphs.push(`export type ${fieldsName} = Record<never, never>;`);
  } else {
    paragraphs.push(`export interface ${fieldsName} {`);
    for (const fieldSpec of valueSpec.fields) {
      paragraphs.push(`  ${fieldSpec.name}: ${fieldType(context, fieldSpec, adminOrPublished)};`);
    }
    paragraphs.push(`}`);
  }
  paragraphs.push('');

  // value type
  const parentTypeName = 'ValueItem';
  const parentTypeInName = 'ValueItem<string, object>';
  const valueTypeName = `${adminOrPublished}${valueSpec.name}`;
  context.coreImports.add(parentTypeName);
  paragraphs.push(
    `export type ${valueTypeName} = ${parentTypeName}<'${valueSpec.name}', ${fieldsName}>;`
  );

  // isAdminFoo() / isPublishedFoo()
  paragraphs.push('');
  paragraphs.push(
    `export function is${valueTypeName}(valueItem: ${parentTypeInName} | ${valueTypeName}): valueItem is ${valueTypeName} {`
  );
  paragraphs.push(`  return valueItem.type === '${valueSpec.name}';`);
  paragraphs.push(`}`);

  // assertIsAdminFoo() / assertIsPublishedFoo()
  paragraphs.push('');
  paragraphs.push(
    `export function assertIs${valueTypeName}(valueItem: ${parentTypeInName} | ${valueTypeName}): asserts valueItem is ${valueTypeName} {`
  );
  paragraphs.push(`  if (valueItem.type !== '${valueSpec.name}') {`);
  paragraphs.push(
    `    throw new Error('Expected type = ${valueSpec.name} (but was ' + valueItem.type + ')');`
  );
  paragraphs.push(`  }`);
  paragraphs.push(`}`);

  return paragraphs;
}

function fieldType(
  { coreImports }: GeneratorContext,
  fieldSpec: AdminFieldSpecification | PublishedFieldSpecification,
  adminOrPublished: 'Admin' | 'Published'
) {
  let type: string;
  switch (fieldSpec.type) {
    case FieldType.Boolean:
      type = 'boolean';
      break;
    case FieldType.Entity:
      coreImports.add('EntityReference');
      type = 'EntityReference';
      break;
    case FieldType.Location:
      coreImports.add('Location');
      type = 'Location';
      break;
    case FieldType.Number:
      type = 'number';
      break;
    case FieldType.RichText:
      coreImports.add('RichText');
      type = 'RichText';
      break;
    case FieldType.String:
      type = 'string';
      break;
    case FieldType.ValueItem:
      if (fieldSpec.valueTypes && fieldSpec.valueTypes.length > 0) {
        type = fieldSpec.valueTypes.map((it) => `${adminOrPublished}${it}`).join(' | ');
      } else {
        type = `All${adminOrPublished}ValueItems`;
      }
      break;
  }
  const nullable = adminOrPublished === 'Admin' || !fieldSpec.required;
  const nullableSuffix = nullable ? ' | null' : '';
  if (!fieldSpec.list) {
    return type + nullableSuffix;
  }
  return (type.includes('|') ? `Array<${type}>` : `${type}[]`) + nullableSuffix;
}
