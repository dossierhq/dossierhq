import {
  AdminEntityStatus,
  ok,
  traverseEntity,
  validateTraverseNodeForPublish,
  validateTraverseNodeForSave,
  type AdminEntity,
  type AdminEntityCreate,
  type AdminSchema,
  type EntityLike,
  type EntityReference,
  type ErrorType,
  type ContentValuePath,
  type Location,
  type PromiseResult,
  type PublishValidationIssue,
  type PublishedSchema,
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
  createRequestedReferencesCollector,
  createUniqueIndexCollector,
  createValueTypesCollector,
  type RequestedReference,
  type UniqueIndexValueCollection,
} from './EntityCollectors.js';

export function validateAdminFieldValuesAndCollectInfo(
  adminSchema: AdminSchema,
  path: ContentValuePath,
  entity: AdminEntity | AdminEntityCreate,
): {
  validationIssues: SaveValidationIssue[];
  fullTextSearchText: string;
  references: RequestedReference[];
  locations: Location[];
  valueTypes: string[];
  uniqueIndexValues: UniqueIndexValueCollection;
} {
  const validationIssues: SaveValidationIssue[] = [];
  const ftsCollector = createFullTextSearchCollector();
  const referencesCollector = createRequestedReferencesCollector();
  const locationsCollector = createLocationsCollector();
  const valueTypesCollector = createValueTypesCollector();
  const uniqueIndexCollector = createUniqueIndexCollector(adminSchema);

  // TODO move all validation to this setup from the encoding
  for (const node of traverseEntity(adminSchema, path, entity)) {
    const validationIssue = validateTraverseNodeForSave(adminSchema, node);
    if (validationIssue) {
      validationIssues.push(validationIssue);
    }
    ftsCollector.collect(node);
    referencesCollector.collect(node);
    locationsCollector.collect(node);
    valueTypesCollector.collect(node);
    uniqueIndexCollector.collect(node);
  }

  return {
    validationIssues,
    fullTextSearchText: ftsCollector.result,
    references: referencesCollector.result,
    locations: locationsCollector.result,
    valueTypes: valueTypesCollector.result,
    uniqueIndexValues: uniqueIndexCollector.result,
  };
}

export async function validateReferencedEntitiesForSaveAndCollectInfo(
  databaseAdapter: DatabaseAdapter,
  context: TransactionContext,
  requestedReferences: RequestedReference[],
): PromiseResult<
  { references: DatabaseResolvedEntityReference[]; validationIssues: SaveValidationIssue[] },
  typeof ErrorType.Generic
> {
  const validationIssues: SaveValidationIssue[] = [];

  const uniqueIds = new Set<string>();
  requestedReferences.forEach(({ uuids }) => uuids.forEach((uuid) => uniqueIds.add(uuid)));
  if (uniqueIds.size === 0) {
    return ok({ references: [], validationIssues });
  }

  const result = await databaseAdapter.adminEntityGetReferenceEntitiesInfo(
    context,
    [...uniqueIds].map((id) => ({ id })),
  );
  if (result.isError()) return result;
  const items = result.value;

  for (const request of requestedReferences) {
    for (const id of request.uuids) {
      const item = items.find((it) => it.id === id);
      if (!item) {
        validationIssues.push({
          type: 'save',
          path: request.path,
          message: `Referenced entity (${id}) doesn’t exist`,
        });
        continue;
      }

      if (request.isRichTextLink && request.linkEntityTypes && request.linkEntityTypes.length > 0) {
        if (request.linkEntityTypes.indexOf(item.type) < 0) {
          validationIssues.push({
            type: 'save',
            path: request.path,
            message: `Linked entity (${id}) has an invalid type ${item.type}`,
          });
        }
      }

      if (request.entityTypes && request.entityTypes.length > 0) {
        if (request.entityTypes.indexOf(item.type) < 0) {
          validationIssues.push({
            type: 'save',
            path: request.path,
            message: `Referenced entity (${id}) has an invalid type ${item.type}`,
          });
        }
      }
    }
  }

  const references = items.map(({ entityInternalId }) => ({ entityInternalId }));

  return ok({ references, validationIssues });
}

export function validatePublishedFieldValuesAndCollectInfo(
  adminSchema: AdminSchema,
  publishedSchema: PublishedSchema,
  path: ContentValuePath,
  type: string,
  entityFields: Record<string, unknown>,
): {
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
  fullTextSearchText: string;
  references: EntityReference[];
  locations: Location[];
  valueTypes: string[];
  uniqueIndexValues: UniqueIndexValueCollection;
} {
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

  return {
    validationIssues,
    fullTextSearchText: ftsCollector.result,
    references: referencesCollector.result,
    locations: locationsCollector.result,
    valueTypes: valueTypesCollector.result,
    uniqueIndexValues: uniqueIndexCollector.result,
  };
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
