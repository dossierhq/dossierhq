import type {
  AdminEntityPublishPayload,
  AdminSchema,
  EntityLike,
  EntityVersionReference,
  EntityVersionReferenceWithAuthKeys,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import {
  AdminEntityStatus,
  AdminItemTraverseNodeType,
  createErrorResult,
  notOk,
  ok,
  traverseAdminItem,
  visitorPathToString,
} from '@jonasb/datadata-core';
import type { Temporal } from '@js-temporal/polyfill';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import * as Db from '../Database';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseTables';
import { checkUUIDsAreUnique } from './AdminEntityMutationUtils';
import {
  collectDataFromEntity,
  decodeAdminEntityFields,
  resolveEntityStatus,
} from '../EntityCodec';
import { QueryBuilder } from '../QueryBuilder';

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
    const versionsInfo: (
      | {
          effect: 'published';
          uuid: string;
          versionsId: number;
          entityId: number;
          status: AdminEntityStatus;
          fullTextSearchText: string;
        }
      | {
          effect: 'none';
          uuid: string;
          status: AdminEntityStatus;
          updatedAt: Temporal.Instant;
        }
    )[] = [];
    for (const reference of references) {
      const versionInfo = await Db.queryNoneOrOne<
        Pick<EntityVersionsTable, 'id' | 'entities_id' | 'data'> &
          Pick<
            EntitiesTable,
            | 'type'
            | 'name'
            | 'auth_key'
            | 'resolved_auth_key'
            | 'status'
            | 'updated_at'
            | 'published_entity_versions_id'
            | 'latest_draft_entity_versions_id'
          >
      >(
        databaseAdapter,
        context,
        `SELECT ev.id, ev.entities_id, ev.data, e.type, e.name, e.auth_key, e.resolved_auth_key, e.status, e.updated_at, e.published_entity_versions_id, e.latest_draft_entity_versions_id
         FROM entity_versions ev, entities e
         WHERE e.uuid = $1 AND e.id = ev.entities_id
           AND ev.version = $2`,
        [reference.id, reference.version]
      );

      if (!versionInfo) {
        missingReferences.push(reference);
        continue;
      }

      const authResult = await authVerifyAuthorizationKey(
        authorizationAdapter,
        context,
        reference?.authKeys,
        { authKey: versionInfo.auth_key, resolvedAuthKey: versionInfo.resolved_auth_key }
      );
      if (authResult.isError()) {
        return createErrorResult(
          authResult.error,
          `entity(${reference.id}): ${authResult.message}`
        );
      }

      const entitySpec = schema.getEntityTypeSpecification(versionInfo.type);
      if (!entitySpec) {
        return notOk.Generic(`No entity spec for type ${versionInfo.type}`);
      }

      if (versionInfo.published_entity_versions_id === versionInfo.id) {
        versionsInfo.push({
          effect: 'none',
          uuid: reference.id,
          status: resolveEntityStatus(versionInfo.status),
          updatedAt: versionInfo.updated_at,
        });
      } else if (entitySpec.adminOnly) {
        adminOnlyEntityIds.push(reference.id);
      } else {
        const entityFields = decodeAdminEntityFields(schema, entitySpec, versionInfo);
        const entity: EntityLike = {
          info: { type: versionInfo.type },
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

        const status =
          versionInfo.latest_draft_entity_versions_id === versionInfo.id
            ? AdminEntityStatus.published
            : AdminEntityStatus.modified;

        versionsInfo.push({
          effect: 'published',
          uuid: reference.id,
          versionsId: versionInfo.id,
          entityId: versionInfo.entities_id,
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
      let updatedAt;
      if (versionInfo.effect === 'none') {
        updatedAt = versionInfo.updatedAt;
      } else {
        const { versionsId, fullTextSearchText, entityId } = versionInfo;
        const updateResult = await Db.queryOne<Pick<EntitiesTable, 'updated_at'>>(
          databaseAdapter,
          context,
          `UPDATE entities
          SET
            never_published = FALSE,
            archived = FALSE,
            published_entity_versions_id = $1,
            published_fts = to_tsvector($2),
            updated_at = NOW(),
            updated = nextval('entities_updated_seq'),
            status = $3
          WHERE id = $4
          RETURNING updated_at`,
          [versionsId, fullTextSearchText, status, entityId]
        );
        updatedAt = updateResult.updated_at;
      }
      result.push({ id: versionInfo.uuid, status, effect: versionInfo.effect, updatedAt });
    }

    const publishVersionsInfo = versionsInfo.filter(({ effect }) => effect === 'published') as {
      effect: 'published';
      uuid: string;
      versionsId: number;
      entityId: number;
      status: AdminEntityStatus;
      fullTextSearchText: string;
    }[];

    // Step 3: Check if references are ok
    const referenceErrorMessages: string[] = [];
    for (const { uuid, versionsId } of publishVersionsInfo) {
      const unpublishedReferences = await Db.queryMany<Pick<EntitiesTable, 'uuid'>>(
        databaseAdapter,
        context,
        `SELECT e.uuid
           FROM entity_version_references evr, entities e
           WHERE evr.entity_versions_id = $1
             AND evr.entities_id = e.id
             AND e.published_entity_versions_id IS NULL`,
        [versionsId]
      );
      if (unpublishedReferences.length > 0) {
        referenceErrorMessages.push(
          `${uuid}: References unpublished entities: ${unpublishedReferences
            .map(({ uuid }) => uuid)
            .join(', ')}`
        );
      }
    }

    if (referenceErrorMessages.length > 0) {
      return notOk.BadRequest(referenceErrorMessages.join('\n'));
    }

    // Step 4: Create publish event
    if (publishVersionsInfo.length > 0) {
      const qb = new QueryBuilder(
        'INSERT INTO entity_publishing_events (entities_id, entity_versions_id, published_by, kind) VALUES'
      );
      const subjectValue = qb.addValue(context.session.subjectInternalId);
      for (const versionInfo of publishVersionsInfo) {
        qb.addQuery(
          `(${qb.addValue(versionInfo.entityId)}, ${qb.addValue(
            versionInfo.versionsId
          )}, ${subjectValue}, 'publish')`
        );
      }
      await Db.queryNone(databaseAdapter, context, qb.build());
    }

    //
    return ok(result);
  });
}
