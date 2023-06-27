import {
  AdminSchema,
  FieldType,
  RichTextNodeType,
  isFieldValueEqual,
  ok,
  type AdminSchemaSpecification,
  type AdminSchemaSpecificationUpdate,
  type ErrorType,
  type PromiseResult,
  type SchemaSpecificationUpdatePayload,
} from '@dossierhq/core';
import type { DatabaseAdapter, TransactionContext } from '@dossierhq/database-adapter';
import { calculateSchemaChangeEntityValidation } from './schema/calculateSchemaChangeEntityValidation.js';

export async function getSchemaSpecification(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  initialLoad: boolean
): PromiseResult<AdminSchemaSpecification, typeof ErrorType.Generic> {
  const { logger } = context;
  if (initialLoad) logger.info('Loading schema');
  const result = await databaseAdapter.schemaGetSpecification(context);
  if (result.isError()) return result;

  const specification = result.value;
  if (!specification) {
    if (initialLoad) logger.info('No schema set, defaulting to empty');
    return ok({ entityTypes: [], valueTypes: [], patterns: [], indexes: [] });
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
      specification.indexes.length
    );
  }
  return ok(specification);
}

export async function updateSchemaSpecification(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  schemaSpec: AdminSchemaSpecificationUpdate
): PromiseResult<
  SchemaSpecificationUpdatePayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  return await context.withTransaction<
    SchemaSpecificationUpdatePayload,
    typeof ErrorType.BadRequest | typeof ErrorType.Generic
  >(async (context) => {
    const { logger } = context;
    const previousSpecificationResult = await getSchemaSpecification(
      databaseAdapter,
      context,
      false
    );
    if (previousSpecificationResult.isError()) return previousSpecificationResult;

    const oldSchema = new AdminSchema(previousSpecificationResult.value);
    const mergeResult = oldSchema.updateAndValidate(schemaSpec);
    if (mergeResult.isError()) return mergeResult;
    const newSchema = mergeResult.value;

    if (isFieldValueEqual(oldSchema.spec, newSchema.spec)) {
      return ok({ effect: 'none', schemaSpecification: newSchema.spec });
    }

    const validationCalculationResult = calculateSchemaChangeEntityValidation(oldSchema, newSchema);
    if (validationCalculationResult.isError()) return validationCalculationResult;

    const updateResult = await databaseAdapter.schemaUpdateSpecification(context, newSchema.spec);
    if (updateResult.isError()) return updateResult;

    if (
      validationCalculationResult.value.entityTypes.length > 0 ||
      validationCalculationResult.value.valueTypes.length > 0
    ) {
      logger.info(
        'Marking entities with for validation (entity types=%s, value types=%s)',
        validationCalculationResult.value.entityTypes.join(','),
        validationCalculationResult.value.valueTypes.join(',')
      );
      const markDirtyResult = await databaseAdapter.managementDirtyMarkEntities(
        context,
        validationCalculationResult.value.entityTypes,
        validationCalculationResult.value.valueTypes
      );
      if (markDirtyResult.isError()) return markDirtyResult;

      logger.info('Marked %d entities for validation', markDirtyResult.value.count);
    }

    logger.info(
      'Updated schema, new schema has %d entity types, %d value types, %d patterns, %d indexes',
      newSchema.spec.entityTypes.length,
      newSchema.spec.valueTypes.length,
      newSchema.spec.patterns.length,
      newSchema.spec.indexes.length
    );

    return ok({ effect: 'updated', schemaSpecification: newSchema.spec });
  });
}
