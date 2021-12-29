import type {
  AdminEntityUnpublishPayload,
  EntityReferenceWithAuthKeys,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import {
  AdminEntityStatus,
  assertIsDefined,
  createErrorResult,
  notOk,
  ok,
} from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import * as Db from '../Database';
import type { EntitiesTable } from '../DatabaseTables';
import { checkUUIDsAreUnique } from './AdminEntityMutationUtils';
import { resolveEntityStatus } from '../EntityCodec';
import { QueryBuilder } from '../QueryBuilder';

export async function adminUnpublishEntities(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  references: EntityReferenceWithAuthKeys[]
): PromiseResult<
  AdminEntityUnpublishPayload[],
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const uniqueIdCheck = checkUUIDsAreUnique(references);
  if (uniqueIdCheck.isError()) {
    return uniqueIdCheck;
  }

  return context.withTransaction(async (context) => {
    const result: AdminEntityUnpublishPayload[] = [];

    // Step 1: Resolve entities and check if all entities exist
    const entitiesInfo = await Db.queryMany<
      Pick<
        EntitiesTable,
        | 'id'
        | 'uuid'
        | 'auth_key'
        | 'resolved_auth_key'
        | 'status'
        | 'updated_at'
        | 'published_entity_versions_id'
      >
    >(
      databaseAdapter,
      context,
      'SELECT e.id, e.uuid, e.auth_key, e.resolved_auth_key, e.status, e.updated_at, e.published_entity_versions_id FROM entities e WHERE e.uuid = ANY($1)',
      [references.map((it) => it.id)]
    );

    const missingEntityIds = references
      .filter((reference) => !entitiesInfo.find((it) => it.uuid === reference.id))
      .map((it) => it.id);
    if (missingEntityIds.length > 0) {
      return notOk.NotFound(`No such entities: ${missingEntityIds.join(', ')}`);
    }

    for (const reference of references) {
      const entityInfo = entitiesInfo.find((it) => it.uuid === reference.id);
      assertIsDefined(entityInfo);

      const authResult = await authVerifyAuthorizationKey(
        authorizationAdapter,
        context,
        reference?.authKeys,
        { authKey: entityInfo.auth_key, resolvedAuthKey: entityInfo.resolved_auth_key }
      );
      if (authResult.isError()) {
        return createErrorResult(
          authResult.error,
          `entity(${reference.id}): ${authResult.message}`
        );
      }
    }

    const publishedEntitiesInfo = entitiesInfo.filter(
      (it) => it.published_entity_versions_id !== null
    );

    // Step 2: Unpublish entities
    const unpublishRows = await Db.queryMany<Pick<EntitiesTable, 'uuid' | 'updated_at'>>(
      databaseAdapter,
      context,
      `UPDATE entities
        SET
          published_entity_versions_id = NULL,
          published_fts = NULL,
          updated_at = NOW(),
          updated = nextval('entities_updated_seq'),
          status = 'withdrawn'
        WHERE id = ANY($1)
        RETURNING uuid, updated_at`,
      [publishedEntitiesInfo.map((it) => it.id)]
    );
    for (const reference of references) {
      const entityInfo = entitiesInfo.find((it) => it.uuid === reference.id);
      assertIsDefined(entityInfo);
      if (entityInfo.published_entity_versions_id) {
        const updatedAt = unpublishRows.find((it) => it.uuid === reference.id)?.updated_at;
        assertIsDefined(updatedAt);
        result.push({
          id: reference.id,
          status: AdminEntityStatus.withdrawn,
          effect: 'unpublished',
          updatedAt,
        });
      } else {
        result.push({
          id: reference.id,
          status: resolveEntityStatus(entityInfo.status),
          effect: 'none',
          updatedAt: entityInfo.updated_at,
        });
      }
    }

    // Step 3: Check if references are ok
    const referenceErrorMessages: string[] = [];
    for (const { id, uuid } of publishedEntitiesInfo) {
      const publishedIncomingReferences = await Db.queryMany<Pick<EntitiesTable, 'uuid'>>(
        databaseAdapter,
        context,
        `SELECT e.uuid
           FROM entity_version_references evr, entity_versions ev, entities e
           WHERE evr.entities_id = $1
             AND evr.entity_versions_id = ev.id
             AND ev.entities_id = e.id
             AND e.published_entity_versions_id = ev.id`,
        [id]
      );
      if (publishedIncomingReferences.length > 0) {
        referenceErrorMessages.push(
          `${uuid}: Published entities referencing entity: ${publishedIncomingReferences
            .map(({ uuid }) => uuid)
            .join(', ')}`
        );
      }
    }

    if (referenceErrorMessages.length > 0) {
      return notOk.BadRequest(referenceErrorMessages.join('\n'));
    }

    // Step 4: Create publish event
    if (publishedEntitiesInfo.length > 0) {
      const qb = new QueryBuilder(
        'INSERT INTO entity_publishing_events (entities_id, entity_versions_id, published_by, kind) VALUES'
      );
      const subjectValue = qb.addValue(context.session.subjectInternalId);
      for (const entityInfo of entitiesInfo) {
        qb.addQuery(`(${qb.addValue(entityInfo.id)}, NULL, ${subjectValue}, 'unpublish')`);
      }
      await Db.queryNone(databaseAdapter, context, qb.build());
    }

    //
    return ok(result);
  });
}
