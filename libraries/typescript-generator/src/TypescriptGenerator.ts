import {
  FieldType,
  type AdminComponentTypeSpecification,
  type AdminEntityTypeSpecification,
  type AdminFieldSpecification,
  type Schema,
  type PublishedComponentTypeSpecification,
  type PublishedEntityTypeSpecification,
  type PublishedFieldSpecification,
  type PublishedSchema,
  type SchemaIndexSpecification,
} from '@dossierhq/core';

interface GeneratorContext {
  coreImports: Set<string>;
}

export function generateTypescriptForSchema({
  adminSchema,
  publishedSchema,
  authKeyPatternTypeMap,
}: {
  adminSchema: Schema | null;
  publishedSchema: PublishedSchema | null;
  authKeyPatternTypeMap?: Record<string, string>;
}) {
  const context: GeneratorContext = { coreImports: new Set<string>() };
  const paragraphs: string[] = [];

  if (adminSchema) {
    paragraphs.push(...generateAdminClientTypes(context));
    paragraphs.push(...generateUniqueIndexesType('Admin', adminSchema.spec.indexes));
    paragraphs.push(...generateAllTypesUnion(adminSchema.spec.entityTypes, 'Admin', 'Entity'));
    for (const entitySpec of adminSchema.spec.entityTypes) {
      paragraphs.push(...generateAdminEntityType(context, entitySpec, authKeyPatternTypeMap ?? {}));
    }
    paragraphs.push(
      ...generateAllTypesUnion(adminSchema.spec.componentTypes, 'Admin', 'Component'),
    );
    for (const componentSpec of adminSchema.spec.componentTypes) {
      paragraphs.push(...generateAdminComponentType(context, componentSpec));
    }
  }
  if (publishedSchema) {
    paragraphs.push(...generatePublishedClientTypes(context));
    paragraphs.push(...generateUniqueIndexesType('Published', publishedSchema.spec.indexes));
    paragraphs.push(
      ...generateAllTypesUnion(publishedSchema.spec.entityTypes, 'Published', 'Entity'),
    );
    for (const entitySpec of publishedSchema.spec.entityTypes) {
      paragraphs.push(
        ...generatePublishedEntityType(context, entitySpec, authKeyPatternTypeMap ?? {}),
      );
    }
    paragraphs.push(
      ...generateAllTypesUnion(publishedSchema.spec.componentTypes, 'Published', 'Component'),
    );
    for (const componentSpec of publishedSchema.spec.componentTypes) {
      paragraphs.push(...generatePublishedComponentType(context, componentSpec));
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
  context.coreImports.add('AdminExceptionClient');
  return [
    '',
    'export type AppAdminClient = AdminClient<AppAdminEntity, AppAdminComponent, AppAdminUniqueIndexes, AppAdminExceptionClient>;',
    '',
    'export type AppAdminExceptionClient = AdminExceptionClient<AppAdminEntity, AppAdminComponent, AppAdminUniqueIndexes>;',
  ];
}

function generatePublishedClientTypes(context: GeneratorContext) {
  context.coreImports.add('PublishedClient');
  context.coreImports.add('PublishedExceptionClient');
  return [
    '',
    'export type AppPublishedClient = PublishedClient<AppPublishedEntity, AppPublishedComponent, AppPublishedUniqueIndexes, AppPublishedExceptionClient>;',
    '',
    'export type AppPublishedExceptionClient = PublishedExceptionClient<AppPublishedEntity, AppPublishedComponent, AppPublishedUniqueIndexes>;',
  ];
}

function generateUniqueIndexesType(
  adminOrPublished: 'Admin' | 'Published',
  indexes: SchemaIndexSpecification[],
) {
  const uniqueIndexNames = indexes.filter((it) => it.type === 'unique').map((it) => it.name);
  const uniqueIndexTypeDefinition = stringLiteralsUnionOrNever(uniqueIndexNames);
  return ['', `export type App${adminOrPublished}UniqueIndexes = ${uniqueIndexTypeDefinition};`];
}

function generateAllTypesUnion(
  types:
    | AdminEntityTypeSpecification[]
    | PublishedEntityTypeSpecification[]
    | AdminComponentTypeSpecification[]
    | PublishedComponentTypeSpecification[],
  adminOrPublished: 'Admin' | 'Published',
  entityOrComponent: 'Entity' | 'Component',
) {
  const typeDefinition = typeUnionOrNever(types.map((it) => `${adminOrPublished}${it.name}`));
  return ['', `export type App${adminOrPublished}${entityOrComponent} = ${typeDefinition};`];
}

function generateAdminEntityType(
  context: GeneratorContext,
  entitySpec: AdminEntityTypeSpecification,
  authKeyPatternTypeMap: Record<string, string>,
) {
  return generateEntityType(context, entitySpec, 'Admin', authKeyPatternTypeMap);
}

function generatePublishedEntityType(
  context: GeneratorContext,
  entitySpec: PublishedEntityTypeSpecification,
  authKeyPatternTypeMap: Record<string, string>,
) {
  return generateEntityType(context, entitySpec, 'Published', authKeyPatternTypeMap);
}

function generateEntityType(
  context: GeneratorContext,
  entitySpec: PublishedEntityTypeSpecification,
  adminOrPublished: 'Admin' | 'Published',
  authKeyPatternTypeMap: Record<string, string>,
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

  // auth key
  let authKeyType = "''";
  if (entitySpec.authKeyPattern) {
    const authKeyPatternType = authKeyPatternTypeMap[entitySpec.authKeyPattern];
    if (authKeyPatternType) {
      authKeyType = authKeyPatternType;
    } else {
      throw new Error(`No type found for auth key pattern ${entitySpec.authKeyPattern}`);
    }
  }

  // entity type
  const parentTypeName = `${adminOrPublished}Entity`;
  const genericEntityType = `${parentTypeName}<string, object>`;
  const entityTypeName = `${adminOrPublished}${entitySpec.name}`;
  context.coreImports.add(parentTypeName);
  paragraphs.push(
    `export type ${entityTypeName} = ${parentTypeName}<'${entitySpec.name}', ${fieldsName}, ${authKeyType}>;`,
  );

  // isAdminFoo() / isPublishedFoo()
  paragraphs.push('');
  paragraphs.push(
    `export function is${entityTypeName}(entity: ${genericEntityType}): entity is ${entityTypeName} {`,
  );
  paragraphs.push(`  return entity.info.type === '${entitySpec.name}';`);
  paragraphs.push(`}`);

  // assertIsAdminFoo() / assertIsPublishedFoo()
  paragraphs.push('');
  paragraphs.push(
    `export function assertIs${entityTypeName}(entity: ${genericEntityType}): asserts entity is ${entityTypeName} {`,
  );
  paragraphs.push(`  if (entity.info.type !== '${entitySpec.name}') {`);
  paragraphs.push(
    `    throw new Error('Expected info.type = ${entitySpec.name} (but was ' + entity.info.type + ')');`,
  );
  paragraphs.push(`  }`);
  paragraphs.push(`}`);

  return paragraphs;
}

function generateAdminComponentType(
  context: GeneratorContext,
  componentSpec: AdminComponentTypeSpecification,
) {
  return generateComponentType(context, componentSpec, 'Admin');
}

function generatePublishedComponentType(
  context: GeneratorContext,
  componentSpec: PublishedComponentTypeSpecification,
) {
  return generateComponentType(context, componentSpec, 'Published');
}

function generateComponentType(
  context: GeneratorContext,
  componentSpec: PublishedComponentTypeSpecification,
  adminOrPublished: 'Admin' | 'Published',
) {
  const paragraphs: string[] = [''];

  // fields type
  const fieldsName = `${adminOrPublished}${componentSpec.name}Fields`;
  if (componentSpec.fields.length === 0) {
    paragraphs.push(`export type ${fieldsName} = Record<never, never>;`);
  } else {
    paragraphs.push(`export interface ${fieldsName} {`);
    for (const fieldSpec of componentSpec.fields) {
      paragraphs.push(`  ${fieldSpec.name}: ${fieldType(context, fieldSpec, adminOrPublished)};`);
    }
    paragraphs.push(`}`);
  }
  paragraphs.push('');

  // component type
  const parentTypeName = 'Component';
  const parentTypeInName = 'Component<string, object>';
  const componentTypeName = `${adminOrPublished}${componentSpec.name}`;
  context.coreImports.add(parentTypeName);
  paragraphs.push(
    `export type ${componentTypeName} = ${parentTypeName}<'${componentSpec.name}', ${fieldsName}>;`,
  );

  // isAdminFoo() / isPublishedFoo()
  paragraphs.push('');
  paragraphs.push(
    `export function is${componentTypeName}(component: ${parentTypeInName} | ${componentTypeName}): component is ${componentTypeName} {`,
  );
  paragraphs.push(`  return component.type === '${componentSpec.name}';`);
  paragraphs.push(`}`);

  // assertIsAdminFoo() / assertIsPublishedFoo()
  paragraphs.push('');
  paragraphs.push(
    `export function assertIs${componentTypeName}(component: ${parentTypeInName} | ${componentTypeName}): asserts component is ${componentTypeName} {`,
  );
  paragraphs.push(`  if (component.type !== '${componentSpec.name}') {`);
  paragraphs.push(
    `    throw new Error('Expected type = ${componentSpec.name} (but was ' + component.type + ')');`,
  );
  paragraphs.push(`  }`);
  paragraphs.push(`}`);

  return paragraphs;
}

function fieldType(
  { coreImports }: GeneratorContext,
  fieldSpec: AdminFieldSpecification | PublishedFieldSpecification,
  adminOrPublished: 'Admin' | 'Published',
) {
  let type: string;
  switch (fieldSpec.type) {
    case FieldType.Boolean:
      type = 'boolean';
      break;
    case FieldType.Component:
      if (fieldSpec.componentTypes && fieldSpec.componentTypes.length > 0) {
        type = fieldSpec.componentTypes.map((it) => `${adminOrPublished}${it}`).join(' | ');
      } else {
        type = `App${adminOrPublished}Component`;
      }
      break;
    case FieldType.Reference:
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
      if (fieldSpec.values.length > 0) {
        type = fieldSpec.values.map((it) => `'${it.value}'`).join(' | ');
      } else {
        type = 'string';
      }
      break;
  }
  const nullable = adminOrPublished === 'Admin' || !fieldSpec.required;
  const nullableSuffix = nullable ? ' | null' : '';
  if (!fieldSpec.list) {
    return type + nullableSuffix;
  }
  return (type.includes('|') ? `(${type})[]` : `${type}[]`) + nullableSuffix;
}

function stringLiteralsUnionOrNever(stringValues: string[]) {
  return typeUnionOrNever(stringValues.map((it) => `'${it}'`));
}

function typeUnionOrNever(types: string[]) {
  return types.length === 0 ? 'never' : types.join(' | ');
}
