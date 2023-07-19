import {
  FieldType,
  RichTextNodeType,
  ok,
  type AdminSchemaSpecificationWithMigrations,
  type ErrorType,
  type PromiseResult,
} from '@dossierhq/core';
import type { DatabaseAdapter, TransactionContext } from '@dossierhq/database-adapter';

export async function schemaGetSpecification(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  initialLoad: boolean,
): PromiseResult<AdminSchemaSpecificationWithMigrations, typeof ErrorType.Generic> {
  const { logger } = context;
  if (initialLoad) logger.info('Loading schema');
  const result = await databaseAdapter.schemaGetSpecification(context);
  if (result.isError()) return result;

  const specification = result.value;
  if (!specification) {
    if (initialLoad) logger.info('No schema set, defaulting to empty');
    return ok({
      schemaKind: 'admin',
      version: 0,
      entityTypes: [],
      valueTypes: [],
      patterns: [],
      indexes: [],
      migrations: [],
    });
  }

  // Handle old schema format which lacked patterns/indexes
  if (!specification.patterns) specification.patterns = [];
  if (!specification.indexes) specification.indexes = [];

  // Handle old schemas with renaming of field types
  for (const typeSpec of [...specification.entityTypes, ...specification.valueTypes]) {
    for (const fieldSpec of typeSpec.fields) {
      if ((fieldSpec.type as string) === 'EntityType') fieldSpec.type = 'Entity';
      if ((fieldSpec.type as string) === 'ValueType') fieldSpec.type = 'ValueItem';
    }
  }

  // Version 0.2.3: moved isName from field to nameField on entity types, isName is deprecated
  for (const typeSpec of specification.entityTypes) {
    if (typeSpec.nameField === undefined) {
      typeSpec.nameField =
        typeSpec.fields.find((it) => (it as { isName?: boolean }).isName)?.name ?? null;
      for (const fieldSpec of typeSpec.fields) {
        delete (fieldSpec as { isName?: boolean }).isName;
      }
    }
  }

  // Version 0.3.2: added schemaKind and migrations to schema
  if (!specification.schemaKind) specification.schemaKind = 'admin';
  if (!specification.migrations) specification.migrations = [];

  for (const typeSpec of [...specification.entityTypes, ...specification.valueTypes]) {
    for (const fieldSpec of typeSpec.fields) {
      if (fieldSpec.type === FieldType.String) {
        // Version 0.2.15: added values to string fields
        if (fieldSpec.values === undefined) fieldSpec.values = [];
      } else if (fieldSpec.type === FieldType.RichText) {
        // Version 0.3.2: added tab as required node
        if (
          fieldSpec.richTextNodes.length > 0 &&
          !fieldSpec.richTextNodes.includes(RichTextNodeType.tab)
        ) {
          fieldSpec.richTextNodes.push('tab');
          fieldSpec.richTextNodes.sort();
        }
      }
    }
  }

  if (initialLoad) {
    logger.info(
      'Loaded schema with %d entity types, %d value types, %d patterns, %d indexes',
      specification.entityTypes.length,
      specification.valueTypes.length,
      specification.patterns.length,
      specification.indexes.length,
    );
  }
  return ok(specification);
}
