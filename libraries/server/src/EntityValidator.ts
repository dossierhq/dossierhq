import {
  AdminEntityStatus,
  ok,
  traverseEntity,
  validateTraverseNodeForPublish,
  validateTraverseNodeForSave,
  type AdminSchema,
  type EntityLike,
  type EntityReference,
  type ErrorType,
  type ItemValuePath,
  type Location,
  type PromiseResult,
  type PublishValidationIssue,
  type PublishedSchema,
  type Result,
  type SaveValidationIssue,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseResolvedEntityReference,
  TransactionContext,
} from '@dossierhq/database-adapter';
import {
  createFullTextSearchCollector,
  createLocationsCollector,
  createReferencesCollector,
  createUniqueIndexCollector,
  createValueTypesCollector,
  type UniqueIndexValueCollection,
} from './EntityCollectors.js';

export function validatePublishedFieldValuesAndCollectInfo(
  adminSchema: AdminSchema,
  publishedSchema: PublishedSchema,
  path: ItemValuePath,
  type: string,
  entityFields: Record<string, unknown>,
): Result<
  {
    validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
    fullTextSearchText: string;
    references: EntityReference[];
    locations: Location[];
    valueTypes: string[];
    uniqueIndexValues: UniqueIndexValueCollection;
  },
  typeof ErrorType.Generic
> {
  const entity: EntityLike = {
    info: { type },
    fields: entityFields,
  };

  const validationIssues: (SaveValidationIssue | PublishValidationIssue)[] = [];
  const ftsCollector = createFullTextSearchCollector();
  const referencesCollector = createReferencesCollector();
  const locationsCollector = createLocationsCollector();
  const valueTypesCollector = createValueTypesCollector();
  const uniqueIndexCollector = createUniqueIndexCollector(publishedSchema);

  for (const node of traverseEntity(publishedSchema, path, entity)) {
    // validate for publish uses admin schema since it provides better error messages for adminOnly
    const publishIssue = validateTraverseNodeForPublish(adminSchema, node);
    if (publishIssue) {
      validationIssues.push(publishIssue);
    }

    const saveIssue = validateTraverseNodeForSave(publishedSchema, node);
    if (saveIssue) {
      validationIssues.push(saveIssue);
    }

    ftsCollector.collect(node);
    referencesCollector.collect(node);
    locationsCollector.collect(node);
    valueTypesCollector.collect(node);
    uniqueIndexCollector.collect(node);
  }

  return ok({
    validationIssues,
    fullTextSearchText: ftsCollector.result,
    references: referencesCollector.result,
    locations: locationsCollector.result,
    valueTypes: valueTypesCollector.result,
    uniqueIndexValues: uniqueIndexCollector.result,
  });
}

export async function validateReferencedEntitiesArePublishedAndCollectInfo(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  entitiesWithReferences: { entity: EntityReference; references: EntityReference[] }[],
): PromiseResult<
  {
    validReferences: Map<string, DatabaseResolvedEntityReference[]>;
    unpublishedReferences: Map<string, EntityReference[]>;
    invalidReferences: Map<string, EntityReference[]>;
  },
  typeof ErrorType.Generic
> {
  const entitiesReferences = new Map<string, DatabaseResolvedEntityReference[]>();
  const entitiesUnpublishedReferences = new Map<string, EntityReference[]>();
  const entitiesInvalidReferences = new Map<string, EntityReference[]>();
  for (const { entity, references } of entitiesWithReferences) {
    const referencesResult = await databaseAdapter.adminEntityGetReferenceEntitiesInfo(
      context,
      references,
    );
    if (referencesResult.isError()) return referencesResult;

    const unpublishedReferences: EntityReference[] = [];
    const invalidReferences: EntityReference[] = [];
    const entityReferences: DatabaseResolvedEntityReference[] = [];
    entitiesReferences.set(entity.id, entityReferences);

    for (const requestedReference of references) {
      const referenceInfo = referencesResult.value.find(
        (reference) => reference.id === requestedReference.id,
      );
      if (!referenceInfo) {
        // Shouldn't happen since you can't create an entity with invalid references
        invalidReferences.push(requestedReference);
      } else if (
        referenceInfo.status !== AdminEntityStatus.published &&
        referenceInfo.status !== AdminEntityStatus.modified
      ) {
        unpublishedReferences.push(requestedReference);
      } else {
        entityReferences.push({ entityInternalId: referenceInfo.entityInternalId });
      }
    }

    if (unpublishedReferences.length > 0) {
      entitiesUnpublishedReferences.set(entity.id, unpublishedReferences);
    }
    if (invalidReferences.length > 0) {
      entitiesInvalidReferences.set(entity.id, invalidReferences);
    }
  }

  return ok({
    validReferences: entitiesReferences,
    unpublishedReferences: entitiesUnpublishedReferences,
    invalidReferences: entitiesInvalidReferences,
  });
}
