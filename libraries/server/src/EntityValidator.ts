import {
  AdminEntityStatus,
  notOk,
  ok,
  traverseEntity,
  validateTraverseNodeForPublish,
  visitorPathToString,
  type AdminSchema,
  type EntityLike,
  type EntityReference,
  type ErrorType,
  type ItemValuePath,
  type Location,
  type PromiseResult,
  type PublishedSchema,
  type Result,
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
  entityFields: Record<string, unknown>
): Result<
  {
    fullTextSearchText: string;
    references: EntityReference[];
    locations: Location[];
    valueTypes: string[];
    uniqueIndexValues: UniqueIndexValueCollection;
  },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const entity: EntityLike = {
    info: { type },
    fields: entityFields,
  };

  const ftsCollector = createFullTextSearchCollector();
  const referencesCollector = createReferencesCollector();
  const locationsCollector = createLocationsCollector();
  const valueTypesCollector = createValueTypesCollector();
  const uniqueIndexCollector = createUniqueIndexCollector(publishedSchema);

  for (const node of traverseEntity(publishedSchema, path, entity)) {
    const validationIssue = validateTraverseNodeForPublish(adminSchema, node);
    if (validationIssue) {
      return notOk.BadRequest(
        `${visitorPathToString(validationIssue.path)}: ${validationIssue.message}`
      );
    }

    ftsCollector.collect(node);
    referencesCollector.collect(node);
    locationsCollector.collect(node);
    valueTypesCollector.collect(node);
    uniqueIndexCollector.collect(node);
  }
  return ok({
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
  entitiesWithReferences: { entity: EntityReference; references: EntityReference[] }[]
): PromiseResult<
  Map<string, DatabaseResolvedEntityReference[]>,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const referenceErrorMessages: string[] = [];
  const entitiesReferences = new Map<string, DatabaseResolvedEntityReference[]>();
  for (const { entity, references } of entitiesWithReferences) {
    // Step 1: Check that referenced entities are published
    const referencesResult = await databaseAdapter.adminEntityGetReferenceEntitiesInfo(
      context,
      references
    );
    if (referencesResult.isError()) return referencesResult;

    const unpublishedReferences: EntityReference[] = [];
    const entityReferences: DatabaseResolvedEntityReference[] = [];
    entitiesReferences.set(entity.id, entityReferences);

    for (const requestedReference of references) {
      const referenceInfo = referencesResult.value.find(
        (reference) => reference.id === requestedReference.id
      );
      if (!referenceInfo) {
        // Shouldn't happen since you can't create an entity with invalid references
        return notOk.Generic(`${entity.id}: Referenced entity ${requestedReference.id} not found`);
      }
      if (
        referenceInfo.status !== AdminEntityStatus.published &&
        referenceInfo.status !== AdminEntityStatus.modified
      ) {
        unpublishedReferences.push(requestedReference);
      }
      entityReferences.push({ entityInternalId: referenceInfo.entityInternalId });
    }

    if (unpublishedReferences.length > 0) {
      referenceErrorMessages.push(
        `${entity.id}: References unpublished entities: ${unpublishedReferences
          .map(({ id }) => id)
          .join(', ')}`
      );
    }
  }

  if (referenceErrorMessages.length > 0) {
    return notOk.BadRequest(referenceErrorMessages.join('\n'));
  }
  return ok(entitiesReferences);
}
