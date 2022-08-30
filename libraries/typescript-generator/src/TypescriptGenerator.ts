import type {
  AdminEntityTypeSpecification,
  AdminFieldSpecification,
  AdminSchema,
  AdminValueTypeSpecification,
  PublishedEntityTypeSpecification,
  PublishedFieldSpecification,
  PublishedSchema,
  PublishedValueTypeSpecification,
} from '@jonasb/datadata-core';
import { FieldType } from '@jonasb/datadata-core';

interface GeneratorContext {
  coreImports: Set<string>;
}

export function generateTypescriptForSchema({
  adminSchema,
  publishedSchema,
}: {
  adminSchema: AdminSchema | null;
  publishedSchema: PublishedSchema | null;
}) {
  const context: GeneratorContext = { coreImports: new Set<string>() };
  const paragraphs: string[] = [];

  if (adminSchema) {
    for (const entitySpec of adminSchema.spec.entityTypes) {
      paragraphs.push(...generateAdminEntityType(context, entitySpec));
    }
    for (const valueSpec of adminSchema.spec.valueTypes) {
      paragraphs.push(...generateAdminValueType(context, valueSpec));
    }
  }
  if (publishedSchema) {
    for (const entitySpec of publishedSchema.spec.entityTypes) {
      paragraphs.push(...generatePublishedEntityType(context, entitySpec));
    }
    for (const valueSpec of publishedSchema.spec.valueTypes) {
      paragraphs.push(...generatePublishedValueType(context, valueSpec));
    }
  }

  if (context.coreImports.size > 0) {
    const importStatement = `import type { ${[...context.coreImports]
      .sort()
      .join(', ')} } from '@jonasb/datadata-core';`;
    // insert
    paragraphs.splice(0, 0, importStatement);
  }
  paragraphs.push(''); // final newline
  return paragraphs.join('\n');
}

function generateAdminEntityType(
  context: GeneratorContext,
  entitySpec: AdminEntityTypeSpecification
) {
  return generateEntityType(context, entitySpec, 'Admin');
}

function generatePublishedEntityType(
  context: GeneratorContext,
  entitySpec: PublishedEntityTypeSpecification
) {
  return generateEntityType(context, entitySpec, 'Published');
}

function generateEntityType(
  context: GeneratorContext,
  entitySpec: PublishedEntityTypeSpecification,
  adminOrPublished: 'Admin' | 'Published'
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
  const entityTypeName = `${adminOrPublished}${entitySpec.name}`;
  context.coreImports.add(parentTypeName);
  paragraphs.push(
    `export type ${entityTypeName} = ${parentTypeName}<'${entitySpec.name}', ${fieldsName}>;`
  );

  // isAdminFoo() / isPublishedFoo()
  paragraphs.push('');
  paragraphs.push(
    `export function is${entityTypeName}(entity: ${parentTypeName} | ${entityTypeName}): entity is ${entityTypeName} {`
  );
  paragraphs.push(`  return entity.info.type === '${entitySpec.name}';`);
  paragraphs.push(`}`);

  // assertIsAdminFoo() / assertIsPublishedFoo()
  paragraphs.push('');
  paragraphs.push(
    `export function assertIs${entityTypeName}(entity: ${parentTypeName} | ${entityTypeName}): asserts entity is ${entityTypeName} {`
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
  const valueTypeName = `${adminOrPublished}${valueSpec.name}`;
  context.coreImports.add(parentTypeName);
  paragraphs.push(
    `export type ${valueTypeName} = ${parentTypeName}<'${valueSpec.name}', ${fieldsName}>;`
  );

  // isAdminFoo() / isPublishedFoo()
  paragraphs.push('');
  paragraphs.push(
    `export function is${valueTypeName}(valueItem: ${parentTypeName} | ${valueTypeName}): valueItem is ${valueTypeName} {`
  );
  paragraphs.push(`  return valueItem.type === '${valueSpec.name}';`);
  paragraphs.push(`}`);

  // assertIsAdminFoo() / assertIsPublishedFoo()
  paragraphs.push('');
  paragraphs.push(
    `export function assertIs${valueTypeName}(valueItem: ${parentTypeName} | ${valueTypeName}): asserts valueItem is ${valueTypeName} {`
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
    case FieldType.EntityType:
      coreImports.add('EntityReference');
      type = 'EntityReference';
      break;
    case FieldType.Location:
      coreImports.add('Location');
      type = 'Location';
      break;
    case FieldType.RichText:
      coreImports.add('RichText');
      type = 'RichText';
      break;
    case FieldType.String:
      type = 'string';
      break;
    case FieldType.ValueType:
      if (fieldSpec.valueTypes && fieldSpec.valueTypes.length > 0) {
        type = fieldSpec.valueTypes.map((it) => `${adminOrPublished}${it}`).join(' | ');
      } else {
        coreImports.add('ValueItem');
        type = 'ValueItem';
      }
      break;
  }
  return fieldSpec.list ? `Array<${type}> | null` : `${type} | null`;
}
