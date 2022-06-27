import type {
  AdminEntityPublishPayload,
  AdminSchema,
  EntityLike,
  EntityReference,
  EntityVersionReference,
  PromiseResult,
  Result,
} from '@jonasb/datadata-core';
import {
  AdminEntityStatus,
  AdminItemTraverseNodeType,
  createErrorResult,
  ErrorType,
  notOk,
  ok,
  traverseAdminEntity,
  visitorPathToString,
} from '@jonasb/datadata-core';
import type { DatabaseAdapter } from '@jonasb/datadata-database-adapter';
import type { Temporal } from '@js-temporal/polyfill';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { authVerifyAuthorizationKey } from '../Auth.js';
import { collectDataFromEntity, decodeAdminEntityFields } from '../EntityCodec.js';
import { checkUUIDsAreUnique } from './AdminEntityMutationUtils.js';

interface VersionInfoToBePublished {
  effect: 'published';
  uuid: string;
  entityInternalId: unknown;
  entityVersionInternalId: unknown;
  status: AdminEntityStatus;
  fullTextSearchText: string;
}

interface VersionInfoAlreadyPublished {
  effect: 'none';
  uuid: string;
  status: AdminEntityStatus;
  updatedAt: Temporal.Instant;
}

export async function adminPublishEntities(
  schema: AdminSchema,
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
      schema,
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
    const ensureReferencePublishedResult = await ensureReferencedEntitiesArePublished(
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

    //
    return publishEntityResult;
  });
}

async function collectVersionsInfo(
  schema: AdminSchema,
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

    const entitySpec = schema.getEntityTypeSpecification(type);
    if (!entitySpec) {
      return notOk.Generic(`No entity spec for type ${type}`);
    }

    if (entitySpec.adminOnly) {
      adminOnlyEntityIds.push(reference.id);
    } else if (versionIsPublished) {
      versionsInfo.push({ effect: 'none', uuid: reference.id, status, updatedAt });
    } else {
      const entityFields = decodeAdminEntityFields(schema, entitySpec, fieldValues);
      const verifyFieldsResult = verifyFieldValuesAndCollectInformation(
        schema,
        reference,
        type,
        entityFields
      );
      if (verifyFieldsResult.isError()) {
        return verifyFieldsResult;
      }
      const { fullTextSearchText } = verifyFieldsResult.value;

      versionsInfo.push({
        effect: 'published',
        uuid: reference.id,
        entityInternalId,
        entityVersionInternalId,
        fullTextSearchText,
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
  schema: AdminSchema,
  reference: EntityReference,
  type: string,
  entityFields: Record<string, unknown>
): Result<{ fullTextSearchText: string }, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const entity: EntityLike = {
    info: { type },
    fields: entityFields,
  };
  //TODO create a FTS collector that works with traverseAdminItem
  const { fullTextSearchText } = collectDataFromEntity(schema, entity);

  for (const node of traverseAdminEntity(schema, [`entity(${reference.id})`], entity)) {
    switch (node.type) {
      case AdminItemTraverseNodeType.error:
        return notOk.Generic(`${visitorPathToString(node.path)}: ${node.message}`);
      case AdminItemTraverseNodeType.field:
        if ((node.fieldSpec.required && node.value === null) || node.value === undefined) {
          return notOk.BadRequest(`${visitorPathToString(node.path)}: Required field is empty`);
        }
        break;
      case AdminItemTraverseNodeType.valueItem:
        if (node.valueSpec.adminOnly) {
          return notOk.BadRequest(
            `${visitorPathToString(node.path)}: Value item of type ${
              node.valueSpec.name
            } is adminOnly`
          );
        }
        break;
    }
  }
  return ok({ fullTextSearchText: fullTextSearchText.join(' ') });
}

async function publishEntitiesAndCollectResult(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  versionsInfo: (VersionInfoToBePublished | VersionInfoAlreadyPublished)[]
): PromiseResult<AdminEntityPublishPayload[], typeof ErrorType.Generic> {
  const result: AdminEntityPublishPayload[] = [];
  for (const versionInfo of versionsInfo) {
    const { status } = versionInfo;
    let updatedAt: Temporal.Instant;
    if (versionInfo.effect === 'none') {
      updatedAt = versionInfo.updatedAt;
    } else {
      const { entityVersionInternalId, fullTextSearchText, entityInternalId } = versionInfo;
      const updateResult = await databaseAdapter.adminEntityPublishUpdateEntity(context, {
        entityVersionInternalId,
        fullTextSearchText,
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

async function ensureReferencedEntitiesArePublished(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  publishVersionsInfo: VersionInfoToBePublished[]
): PromiseResult<void, typeof ErrorType.BadRequest | typeof ErrorType.Generic> {
  const referenceErrorMessages: string[] = [];
  for (const { uuid, entityInternalId, entityVersionInternalId } of publishVersionsInfo) {
    const unpublishedReferencesResult =
      await databaseAdapter.adminEntityPublishGetUnpublishedReferencedEntities(context, {
        entityInternalId,
        entityVersionInternalId,
      });
    if (unpublishedReferencesResult.isError()) {
      return unpublishedReferencesResult;
    }
    const unpublishedReferences = unpublishedReferencesResult.value;
    if (unpublishedReferences.length > 0) {
      referenceErrorMessages.push(
        `${uuid}: References unpublished entities: ${unpublishedReferences
          .map(({ id }) => id)
          .join(', ')}`
      );
    }
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
