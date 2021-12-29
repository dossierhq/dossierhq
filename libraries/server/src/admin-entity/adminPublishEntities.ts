import type {
  AdminEntityPublishPayload,
  AdminSchema,
  EntityLike,
  EntityVersionReference,
  EntityVersionReferenceWithAuthKeys,
  PromiseResult,
} from '@jonasb/datadata-core';
import {
  AdminEntityStatus,
  AdminItemTraverseNodeType,
  createErrorResult,
  ErrorType,
  notOk,
  ok,
  traverseAdminItem,
  visitorPathToString,
} from '@jonasb/datadata-core';
import type { Temporal } from '@js-temporal/polyfill';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import { collectDataFromEntity, decodeAdminEntityFields2 } from '../EntityCodec';
import { checkUUIDsAreUnique } from './AdminEntityMutationUtils';

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
  references: EntityVersionReferenceWithAuthKeys[]
): PromiseResult<
  AdminEntityPublishPayload[],
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const uniqueIdCheck = checkUUIDsAreUnique(references);
  if (uniqueIdCheck.isError()) {
    return uniqueIdCheck;
  }

  return context.withTransaction(async (context) => {
    const result: AdminEntityPublishPayload[] = [];
    // Step 1: Get version info for each entity
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

      const authResult = await authVerifyAuthorizationKey(
        authorizationAdapter,
        context,
        reference?.authKeys,
        { authKey, resolvedAuthKey }
      );
      if (authResult.isError()) {
        return createErrorResult(
          authResult.error,
          `entity(${reference.id}): ${authResult.message}`
        );
      }

      const entitySpec = schema.getEntityTypeSpecification(type);
      if (!entitySpec) {
        return notOk.Generic(`No entity spec for type ${type}`);
      }

      if (versionIsPublished) {
        versionsInfo.push({
          effect: 'none',
          uuid: reference.id,
          status,
          updatedAt,
        });
      } else if (entitySpec.adminOnly) {
        adminOnlyEntityIds.push(reference.id);
      } else {
        const entityFields = decodeAdminEntityFields2(schema, entitySpec, fieldValues);
        const entity: EntityLike = {
          info: { type },
          fields: entityFields,
        };
        const { fullTextSearchText } = collectDataFromEntity(schema, entity);

        for (const node of traverseAdminItem(schema, [`entity(${reference.id})`], entity)) {
          switch (node.type) {
            case AdminItemTraverseNodeType.error:
              return notOk.Generic(`${visitorPathToString(node.path)}: ${node.message}`);
            case AdminItemTraverseNodeType.field:
              if ((node.fieldSpec.required && node.value === null) || node.value === undefined) {
                return notOk.BadRequest(
                  `${visitorPathToString(node.path)}: Required field is empty`
                );
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

        const status = versionIsLatest ? AdminEntityStatus.published : AdminEntityStatus.modified;

        versionsInfo.push({
          effect: 'published',
          uuid: reference.id,
          entityInternalId: entityInternalId,
          entityVersionInternalId: entityVersionInternalId,
          fullTextSearchText: fullTextSearchText.join(' '),
          status,
        });
      }
    }
    if (missingReferences.length > 0) {
      return notOk.NotFound(
        `No such entities: ${missingReferences.map(({ id }) => id).join(', ')}`
      );
    }
    if (adminOnlyEntityIds.length > 0) {
      return notOk.BadRequest(`Entity type is adminOnly: ${adminOnlyEntityIds.join(', ')}`);
    }

    // Step 2: Publish entities
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

    const publishVersionsInfo = versionsInfo.filter(
      ({ effect }) => effect === 'published'
    ) as VersionInfoToBePublished[];

    // Step 3: Check if references are ok
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

    // Step 4: Create publish event
    if (publishVersionsInfo.length > 0) {
      const eventsResult = await databaseAdapter.adminEntityPublishingCreateEvents(context, {
        session: context.session,
        kind: 'publish',
        references: publishVersionsInfo.map(({ entityInternalId, entityVersionInternalId }) => ({
          entityInternalId,
          entityVersionInternalId,
        })),
      });
      if (eventsResult.isError()) {
        return eventsResult;
      }
    }

    //
    return ok(result);
  });
}
