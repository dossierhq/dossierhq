import type {
  AdminEntityPublishPayload,
  AdminSchema,
  EntityLike,
  EntityReference,
  EntityVersionReference,
  Location,
  PromiseResult,
  PublishedSchema,
  Result,
} from '@dossierhq/core';
import {
  AdminEntityStatus,
  createErrorResult,
  ErrorType,
  notOk,
  ok,
  traverseEntity,
  validateTraverseNodeForPublish,
  visitorPathToString,
} from '@dossierhq/core';
import type { DatabaseAdapter } from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import type { UniqueIndexValue } from '../EntityCodec.js';
import {
  createFullTextSearchCollector,
  createLocationsCollector,
  createReferencesCollector,
  createUniqueIndexCollector,
  decodeAdminEntityFields,
} from '../EntityCodec.js';
import { checkUUIDsAreUnique } from './AdminEntityMutationUtils.js';
import { updateUniqueIndexesForEntity } from './updateUniqueIndexesForEntity.js';

interface VersionInfoToBePublished {
  effect: 'published';
  uuid: string;
  entityInternalId: unknown;
  entityVersionInternalId: unknown;
  status: AdminEntityStatus;
  fullTextSearchText: string;
  references: EntityReference[];
  locations: Location[];
  uniqueIndexValues: Map<string, UniqueIndexValue[]>;
}

interface VersionInfoAlreadyPublished {
  effect: 'none';
  uuid: string;
  status: AdminEntityStatus;
  updatedAt: Date;
}

export async function adminPublishEntities(
  adminSchema: AdminSchema,
  publishedSchema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityVersionReference[]
): PromiseResult<
  AdminEntityPublishPayload[],
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const uniqueIdCheck = checkUUIDsAreUnique(references);
  if (uniqueIdCheck.isError()) {
    return uniqueIdCheck;
  }

  return context.withTransaction(async (context) => {
    // Step 1: Get version info for each entity
    const versionsInfoResult = await collectVersionsInfo(
      adminSchema,
      publishedSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      references
    );
    if (versionsInfoResult.isError()) {
      return versionsInfoResult;
    }
    const versionsInfo = versionsInfoResult.value;

    const publishVersionsInfo = versionsInfo.filter(
      ({ effect }) => effect === 'published'
    ) as VersionInfoToBePublished[];

    // Step 2: Publish entities
    const publishEntityResult = await publishEntitiesAndCollectResult(
      databaseAdapter,
      context,
      versionsInfo
    );
    if (publishEntityResult.isError()) {
      return publishEntityResult;
    }

    // Step 3: Check if references are ok
    const ensureReferencePublishedResult =
      await ensureReferencedEntitiesArePublishedAndUpdatePublishedReferencesIndex(
        databaseAdapter,
        context,
        publishVersionsInfo
      );
    if (ensureReferencePublishedResult.isError()) {
      return ensureReferencePublishedResult;
    }

    // Step 4: Create publish event
    const publishEventResult = await createPublishEvents(
      databaseAdapter,
      context,
      publishVersionsInfo
    );
    if (publishEventResult.isError()) {
      return publishEventResult;
    }

    // Step 5: Update unique value indexes
    for (const versionInfo of publishVersionsInfo) {
      const updateUniqueValueIndexResult = await updateUniqueIndexesForEntity(
        databaseAdapter,
        context,
        { entityInternalId: versionInfo.entityInternalId },
        false,
        null,
        versionInfo.uniqueIndexValues
      );
      if (updateUniqueValueIndexResult.isError()) return updateUniqueValueIndexResult;
    }

    //
    return publishEntityResult;
  });
}

async function collectVersionsInfo(
  adminSchema: AdminSchema,
  publishedSchema: PublishedSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityVersionReference[]
): PromiseResult<
  (VersionInfoToBePublished | VersionInfoAlreadyPublished)[],
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const missingReferences: EntityVersionReference[] = [];
  const adminOnlyEntityIds: string[] = [];

  const versionsInfo: (VersionInfoToBePublished | VersionInfoAlreadyPublished)[] = [];
  for (const reference of references) {
    const versionInfoResult = await databaseAdapter.adminEntityPublishGetVersionInfo(
      context,
      reference
    );

    if (versionInfoResult.isError()) {
      if (versionInfoResult.isErrorType(ErrorType.NotFound)) {
        missingReferences.push(reference);
        continue;
      }
      return versionInfoResult;
    }

    const {
      entityInternalId,
      entityVersionInternalId,
      versionIsPublished,
      versionIsLatest,
      authKey,
      resolvedAuthKey,
      type,
      status,
      updatedAt,
      fieldValues,
    } = versionInfoResult.value;

    const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
      authKey,
      resolvedAuthKey,
    });
    if (authResult.isError()) {
      return createErrorResult(authResult.error, `entity(${reference.id}): ${authResult.message}`);
    }

    const entitySpec = adminSchema.getEntityTypeSpecification(type);
    if (!entitySpec) {
      return notOk.Generic(`No entity spec for type ${type}`);
    }

    if (entitySpec.adminOnly) {
      adminOnlyEntityIds.push(reference.id);
    } else if (versionIsPublished) {
      versionsInfo.push({ effect: 'none', uuid: reference.id, status, updatedAt });
    } else {
      const entityFields = decodeAdminEntityFields(adminSchema, entitySpec, fieldValues);
      const verifyFieldsResult = verifyFieldValuesAndCollectInformation(
        adminSchema,
        publishedSchema,
        reference,
        type,
        entityFields
      );
      if (verifyFieldsResult.isError()) {
        return verifyFieldsResult;
      }
      const { fullTextSearchText, references, locations, uniqueIndexValues } =
        verifyFieldsResult.value;

      versionsInfo.push({
        effect: 'published',
        uuid: reference.id,
        entityInternalId,
        entityVersionInternalId,
        fullTextSearchText,
        references,
        locations,
        uniqueIndexValues,
        status: versionIsLatest ? AdminEntityStatus.published : AdminEntityStatus.modified,
      });
    }
  }
  if (missingReferences.length > 0) {
    return notOk.NotFound(`No such entities: ${missingReferences.map(({ id }) => id).join(', ')}`);
  }
  if (adminOnlyEntityIds.length > 0) {
    return notOk.BadRequest(`Entity type is adminOnly: ${adminOnlyEntityIds.join(', ')}`);
  }
  return ok(versionsInfo);
}

function verifyFieldValuesAndCollectInformation(
  adminSchema: AdminSchema,
  publishedSchema: PublishedSchema,
  reference: EntityReference,
  type: string,
  entityFields: Record<string, unknown>
): Result<
  {
    fullTextSearchText: string;
    references: EntityReference[];
    locations: Location[];
    uniqueIndexValues: Map<string, UniqueIndexValue[]>;
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
  const uniqueIndexCollector = createUniqueIndexCollector(publishedSchema);

  for (const node of traverseEntity(publishedSchema, [`entity(${reference.id})`], entity)) {
    const validationIssue = validateTraverseNodeForPublish(adminSchema, node);
    if (validationIssue) {
      return notOk.BadRequest(
        `${visitorPathToString(validationIssue.path)}: ${validationIssue.message}`
      );
    }

    ftsCollector.collect(node);
    referencesCollector.collect(node);
    locationsCollector.collect(node);
    uniqueIndexCollector.collect(node);
  }
  return ok({
    fullTextSearchText: ftsCollector.result,
    references: referencesCollector.result,
    locations: locationsCollector.result,
    uniqueIndexValues: uniqueIndexCollector.result,
  });
}

async function publishEntitiesAndCollectResult(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  versionsInfo: (VersionInfoToBePublished | VersionInfoAlreadyPublished)[]
): PromiseResult<AdminEntityPublishPayload[], typeof ErrorType.Generic> {
  const result: AdminEntityPublishPayload[] = [];
  for (const versionInfo of versionsInfo) {
    const { status } = versionInfo;
    let updatedAt: Date;
    if (versionInfo.effect === 'none') {
      updatedAt = versionInfo.updatedAt;
    } else {
      const { entityVersionInternalId, fullTextSearchText, locations, entityInternalId } =
        versionInfo;
      const updateResult = await databaseAdapter.adminEntityPublishUpdateEntity(context, {
        entityVersionInternalId,
        fullTextSearchText,
        locations,
        status,
        entityInternalId,
      });
      if (updateResult.isError()) {
        return updateResult;
      }
      updatedAt = updateResult.value.updatedAt;
    }
    result.push({ id: versionInfo.uuid, status, effect: versionInfo.effect, updatedAt });
  }
  return ok(result);
}

async function ensureReferencedEntitiesArePublishedAndUpdatePublishedReferencesIndex(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  publishVersionsInfo: VersionInfoToBePublished[]
): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const referenceErrorMessages: string[] = [];
  for (const { uuid, entityInternalId, references } of publishVersionsInfo) {
    // Step 1: Check that referenced entities are published
    const referencesResult = await databaseAdapter.adminEntityGetReferenceEntitiesInfo(
      context,
      references
    );
    if (referencesResult.isError()) return referencesResult;

    const unpublishedReferences: EntityReference[] = [];

    for (const requestedReference of references) {
      const referenceInfo = referencesResult.value.find(
        (reference) => reference.id === requestedReference.id
      );
      if (!referenceInfo) {
        // Shouldn't happen since you can't create an entity with invalid references
        return notOk.Generic(`${uuid}: Referenced entity ${requestedReference.id} not found`);
      }
      if (
        referenceInfo.status !== AdminEntityStatus.published &&
        referenceInfo.status !== AdminEntityStatus.modified
      ) {
        unpublishedReferences.push(requestedReference);
      }
    }

    if (unpublishedReferences.length > 0) {
      referenceErrorMessages.push(
        `${uuid}: References unpublished entities: ${unpublishedReferences
          .map(({ id }) => id)
          .join(', ')}`
      );
    }

    // Step 2: Update published references index
    const updateResult = await databaseAdapter.adminEntityPublishUpdatePublishedReferencesIndex(
      context,
      { entityInternalId },
      referencesResult.value
    );
    if (updateResult.isError()) return updateResult;
  }

  if (referenceErrorMessages.length > 0) {
    return notOk.BadRequest(referenceErrorMessages.join('\n'));
  }
  return ok(undefined);
}

async function createPublishEvents(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  publishVersionsInfo: VersionInfoToBePublished[]
): PromiseResult<void, typeof ErrorType.Generic> {
  if (publishVersionsInfo.length === 0) {
    return ok(undefined);
  }
  return await databaseAdapter.adminEntityPublishingCreateEvents(context, {
    session: context.session,
    kind: 'publish',
    references: publishVersionsInfo.map(({ entityInternalId, entityVersionInternalId }) => ({
      entityInternalId,
      entityVersionInternalId,
    })),
  });
}
