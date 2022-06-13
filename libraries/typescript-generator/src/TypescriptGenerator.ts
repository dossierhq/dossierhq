import type {
  AdminEntityTypeSpecification,
  AdminSchema,
  FieldSpecification,
} from '@jonasb/datadata-core';
import { FieldType } from '@jonasb/datadata-core';

interface GeneratorContext {
  coreImports: Set<string>;
}

export function generateTypescriptForSchema(adminSchema: AdminSchema) {
  const context: GeneratorContext = { coreImports: new Set<string>() };
  const paragraphs: string[] = [];
  for (const entitySpec of adminSchema.spec.entityTypes) {
    paragraphs.push(...generateAdminEntityType(context, entitySpec));
  }
  if (context.coreImports.size > 0) {
    paragraphs.splice(
      0,
      0,
      `import type { ${[...context.coreImports].sort().join(', ')} } from '@jonasb/datadata-core';`
    );
  }
  paragraphs.push('');
  return paragraphs.join('\n');
}

function generateAdminEntityType(
  context: GeneratorContext,
  entitySpec: AdminEntityTypeSpecification
) {
  const paragraphs: string[] = [''];
  const fieldsName = `Admin${entitySpec.name}Fields`;
  paragraphs.push(`export interface ${fieldsName} {`);
  for (const fieldSpec of entitySpec.fields) {
    paragraphs.push(`  ${fieldSpec.name}: ${fieldType(context, fieldSpec)};`);
  }
  paragraphs.push(`}`);
  paragraphs.push('');

  context.coreImports.add('AdminEntity');
  paragraphs.push(
    `export type Admin${entitySpec.name} = AdminEntity<'${entitySpec.name}', ${fieldsName}>;`
  );

  paragraphs.push('');
  paragraphs.push(
    `export function isAdmin${entitySpec.name}(entity: AdminEntity | Admin${entitySpec.name}): entity is Admin${entitySpec.name} {`
  );
  paragraphs.push(`  return entity.info.type === '${entitySpec.name}';`);
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
