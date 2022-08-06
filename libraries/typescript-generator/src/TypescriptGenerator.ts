import type {
  AdminEntityTypeSpecification,
  AdminSchema,
  FieldSpecification,
  PublishedEntityTypeSpecification,
  PublishedSchema,
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
  }
  if (publishedSchema) {
    for (const entitySpec of publishedSchema.spec.entityTypes) {
      paragraphs.push(...generatePublishedEntityType(context, entitySpec));
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
  paragraphs.push(`export interface ${fieldsName} {`);
  for (const fieldSpec of entitySpec.fields) {
    paragraphs.push(`  ${fieldSpec.name}: ${fieldType(context, fieldSpec)};`);
  }
  paragraphs.push(`}`);
  paragraphs.push('');

  // entity type
  const parentTypeName = `${adminOrPublished}Entity`;
  const entityTypeName = `${adminOrPublished}${entitySpec.name}`;
  context.coreImports.add(parentTypeName);
  paragraphs.push(
    `export type ${entityTypeName} = ${parentTypeName}<'${entitySpec.name}', ${fieldsName}>;`
  );

  paragraphs.push('');
  paragraphs.push(
    `export function is${entityTypeName}(entity: ${parentTypeName} | ${entityTypeName}): entity is ${entityTypeName} {`
  );
  paragraphs.push(`  return entity.info.type === '${entitySpec.name}';`);
  paragraphs.push(`}`);

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

function fieldType({ coreImports }: GeneratorContext, fieldSpec: FieldSpecification) {
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
      coreImports.add('ValueItem');
      type = 'ValueItem';
      //TODO support specific value types
      break;
  }
  return fieldSpec.list ? `Array<${type}> | null` : `${type} | null`;
}
