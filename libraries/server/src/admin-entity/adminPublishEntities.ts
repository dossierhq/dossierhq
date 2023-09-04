import {
  AdminEntityStatus,
  ErrorType,
  EventType,
  assertIsDefined,
  contentValuePathToString,
  createErrorResult,
  getEntityNameBase,
  notOk,
  ok,
  type AdminEntityPublishPayload,
  type AdminSchemaWithMigrations,
  type EntityReference,
  type EntityVersionReference,
  type Location,
  type PromiseResult,
  type PublishEntitiesSyncEvent,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseAdminEntityCreateEntityEventArg,
  DatabaseResolvedEntityReference,
} from '@dossierhq/database-adapter';
import { authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { type UniqueIndexValueCollection } from '../EntityCollectors.js';
import {
  validatePublishedFieldValuesAndCollectInfo,
  validateReferencedEntitiesArePublishedAndCollectInfo,
} from '../EntityValidator.js';
import { migrateDecodeAndNormalizeAdminEntityFields } from '../shared-entity/migrateDecodeAndNormalizeEntityFields.js';
import { checkUUIDsAreUnique, randomNameGenerator } from './AdminEntityMutationUtils.js';
import { updateUniqueIndexesForEntity } from './updateUniqueIndexesForEntity.js';

interface VersionInfoToBePublished {
  effect: 'published';
  uuid: string;
  entityInternalId: unknown;
  entityVersionInternalId: unknown;
  name: string;
  publishedName: string | null;
  status: AdminEntityStatus;
  fullTextSearchText: string;
  references: EntityReference[];
  locations: Location[];
  valueTypes: string[];
  uniqueIndexValues: UniqueIndexValueCollection;
}

interface VersionInfoAlreadyPublished {
  effect: 'none';
  uuid: string;
  status: AdminEntityStatus;
  validPublished: boolean;
  updatedAt: Date;
}

export async function adminPublishEntities(
  adminSchema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityVersionReference[],
  createEvents = true,
): PromiseResult<
  AdminEntityPublishPayload[],
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  return doIt(
    adminSchema,
    authorizationAdapter,
    databaseAdapter,
    context,
    references,
    createEvents,
    null,
  );
}

export function adminPublishEntitiesSyncEvent(
  adminSchema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  syncEvent: PublishEntitiesSyncEvent,
) {
  return doIt(
    adminSchema,
    authorizationAdapter,
    databaseAdapter,
    context,
    syncEvent.entities,
    true,
    syncEvent,
  );
}

async function doIt(
  adminSchema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityVersionReference[],
  createEvents: boolean,
  syncEvent: PublishEntitiesSyncEvent | null,
): PromiseResult<
  AdminEntityPublishPayload[],
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotFound
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const uniqueIdCheck = checkUUIDsAreUnique(references);
  if (uniqueIdCheck.isError()) return uniqueIdCheck;

  return context.withTransaction(async (context) => {
    // Step 1: Get version info for each entity
    const versionsInfoResult = await collectVersionsInfo(
      adminSchema,
      authorizationAdapter,
      databaseAdapter,
      context,
      references,
    );
    if (versionsInfoResult.isError()) return versionsInfoResult;
    const versionsInfo = versionsInfoResult.value;
    const publishVersionsInfo = versionsInfo.filter(
      ({ effect }) => effect === 'published',
    ) as VersionInfoToBePublished[];

    // Step 2: Ensure that already published versions are valid
    const invalidAlreadyPublishedVersions = versionsInfo.filter(
      (it) => it.effect === 'none' && it.validPublished === false,
    );
    if (invalidAlreadyPublishedVersions.length > 0) {
      return notOk.BadRequest(
        `entity(${invalidAlreadyPublishedVersions
          .map((it) => it.uuid)
          .join(', ')}): Already published version is invalid`,
      );
    }

    // Step 3: Publish entities
    const publishEntityResult = await publishEntitiesAndCollectResult(
      databaseAdapter,
      context,
      versionsInfo,
      syncEvent,
    );
    if (publishEntityResult.isError()) return publishEntityResult;
    const { payload, eventReferences } = publishEntityResult.value;

    // Step 4: Check if references are ok
    const validateReferencedEntitiesResult =
      await validateReferencedEntitiesArePublishedAndCollectInfo(
        databaseAdapter,
        context,
        publishVersionsInfo.map(({ uuid, references }) => ({ entity: { id: uuid }, references })),
      );
    if (validateReferencedEntitiesResult.isError()) return validateReferencedEntitiesResult;
    if (validateReferencedEntitiesResult.value.unpublishedReferences.size > 0) {
      const [entityId, unpublishedReferences] =
        validateReferencedEntitiesResult.value.unpublishedReferences.entries().next().value as [
          string,
          EntityReference[],
        ];
      return notOk.BadRequest(
        `${entityId}: References unpublished entities: ${unpublishedReferences
          .map(({ id }) => id)
          .join(', ')}`,
      );
    }
    if (validateReferencedEntitiesResult.value.invalidReferences.size > 0) {
      const [entityId, invalidReferences] = validateReferencedEntitiesResult.value.invalidReferences
        .entries()
        .next().value as [string, EntityReference[]];
      return notOk.BadRequest(
        `${entityId}: References invalid entities: ${invalidReferences
          .map(({ id }) => id)
          .join(', ')}`,
      );
    }

    // Step 5: Create publish event
    if (createEvents && eventReferences.length > 0) {
      const publishEventResult = await databaseAdapter.adminEntityCreateEntityEvent(
        context,
        {
          session: context.session,
          type: EventType.publishEntities,
          references: eventReferences,
        },
        syncEvent,
      );
      if (publishEventResult.isError()) return publishEventResult;
    }

    // Step 6: Update entity indexes
    for (const versionInfo of publishVersionsInfo) {
      const referenceIds: DatabaseResolvedEntityReference[] | undefined =
        validateReferencedEntitiesResult.value.validReferences.get(versionInfo.uuid);
      assertIsDefined(referenceIds);
      const entityIndexes = {
        fullTextSearchText: versionInfo.fullTextSearchText,
        locations: versionInfo.locations,
        valueTypes: versionInfo.valueTypes,
        referenceIds,
      };
      const updateIndexResult = await databaseAdapter.adminEntityIndexesUpdatePublished(
        context,
        { entityInternalId: versionInfo.entityInternalId },
        entityIndexes,
      );
      if (updateIndexResult.isError()) return updateIndexResult;
    }

    // Step 7: Update unique value indexes
    for (const versionInfo of publishVersionsInfo) {
      const uniqueIndexResult = await updateUniqueIndexesForEntity(
        databaseAdapter,
        context,
        { entityInternalId: versionInfo.entityInternalId },
        false,
        null,
        versionInfo.uniqueIndexValues,
      );
      if (uniqueIndexResult.isError()) return uniqueIndexResult;
      if (uniqueIndexResult.value.conflictingValues.length > 0) {
        return notOk.BadRequest(
          uniqueIndexResult.value.conflictingValues
            .map(
              ({ index, value, path }) =>
                `${versionInfo.uuid}:${contentValuePathToString(
                  path,
                )}: Value is not unique (${index}:${value})`,
            )
            .join('\n'),
        );
      }
    }

    //
    return ok(payload);
  });
}

async function collectVersionsInfo(
  adminSchema: AdminSchemaWithMigrations,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityVersionReference[],
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
      reference,
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
      name,
      publishedName,
      authKey,
      resolvedAuthKey,
      type,
      status,
      validPublished,
      updatedAt,
      entityFields,
    } = versionInfoResult.value;

    const authResult = await authVerifyAuthorizationKey(authorizationAdapter, context, {
      authKey,
      resolvedAuthKey,
    });
    if (authResult.isError()) {
      return createErrorResult(authResult.error, `entity(${reference.id}): ${authResult.message}`);
    }

    const entitySpec = adminSchema.getEntityTypeSpecification(type);
    if (!entitySpec) return notOk.Generic(`No entity spec for type ${type}`);

    if (entitySpec.adminOnly) {
      adminOnlyEntityIds.push(reference.id);
    } else if (versionIsPublished) {
      versionsInfo.push({
        effect: 'none',
        uuid: reference.id,
        status,
        updatedAt,
        validPublished: validPublished ?? true,
      });
    } else {
      const path = [`entity(${reference.id})`];
      // In order to validate the published entity we need the admin entity fields
      const entityFieldsResult = migrateDecodeAndNormalizeAdminEntityFields(
        adminSchema,
        entitySpec,
        [...path, 'fields'],
        entityFields,
      );
      if (entityFieldsResult.isError()) return entityFieldsResult;

      const validateFields = validatePublishedFieldValuesAndCollectInfo(
        adminSchema,
        path,
        type,
        entityFieldsResult.value,
      );
      if (validateFields.validationIssues.length > 0) {
        const firstValidationIssue = validateFields.validationIssues[0];
        return notOk.BadRequest(
          `${contentValuePathToString(firstValidationIssue.path)}: ${firstValidationIssue.message}`,
        );
      }
      const { fullTextSearchText, references, locations, valueTypes, uniqueIndexValues } =
        validateFields;

      versionsInfo.push({
        effect: 'published',
        uuid: reference.id,
        entityInternalId,
        entityVersionInternalId,
        name,
        publishedName,
        fullTextSearchText,
        references,
        locations,
        valueTypes,
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

async function publishEntitiesAndCollectResult(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  versionsInfo: (VersionInfoToBePublished | VersionInfoAlreadyPublished)[],
  syncEvent: PublishEntitiesSyncEvent | null,
): PromiseResult<
  {
    payload: AdminEntityPublishPayload[];
    eventReferences: DatabaseAdminEntityCreateEntityEventArg['references'];
  },
  typeof ErrorType.Generic
> {
  const payload: AdminEntityPublishPayload[] = [];
  const eventReferences: DatabaseAdminEntityCreateEntityEventArg['references'] = [];
  for (const versionInfo of versionsInfo) {
    const { status } = versionInfo;
    let updatedAt: Date;
    if (versionInfo.effect === 'none') {
      updatedAt = versionInfo.updatedAt;
    } else {
      const {
        entityVersionInternalId,
        entityInternalId,
        name,
        publishedName: existingPublishedName,
      } = versionInfo;

      const publishedName =
        existingPublishedName &&
        getEntityNameBase(existingPublishedName) === getEntityNameBase(name)
          ? existingPublishedName
          : name;
      const changePublishedName = publishedName !== existingPublishedName;

      const updateResult = await databaseAdapter.adminEntityPublishUpdateEntity(
        context,
        randomNameGenerator,
        {
          entityVersionInternalId,
          status,
          entityInternalId,
          publishedName,
          changePublishedName,
        },
        syncEvent,
      );
      if (updateResult.isError()) return updateResult;

      eventReferences.push({
        entityVersionInternalId,
        publishedName: updateResult.value.publishedName,
      });

      updatedAt = updateResult.value.updatedAt;
    }
    payload.push({ id: versionInfo.uuid, status, effect: versionInfo.effect, updatedAt });
  }
  return ok({ payload, eventReferences });
}
