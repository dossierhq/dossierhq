import type {
  AdminEntityUpdate,
  AdminEntityUpdatePayload,
  AdminSchema,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '..';
import { PostgresQueryBuilder } from '..';
import { authVerifyAuthorizationKey } from '../Auth';
import * as Db from '../Database';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseTables';
import { encodeEntity, resolveUpdateEntity } from '../EntityCodec';
import { randomNameGenerator } from './AdminEntityMutationUtils';

export async function adminUpdateEntity(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityUpdate
): PromiseResult<
  AdminEntityUpdatePayload,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  return await context.withTransaction(async (context) => {
    const previousValues = await Db.queryNoneOrOne<
      Pick<
        EntitiesTable,
        | 'id'
        | 'type'
        | 'name'
        | 'auth_key'
        | 'resolved_auth_key'
        | 'created_at'
        | 'updated_at'
        | 'status'
      > &
        Pick<EntityVersionsTable, 'version' | 'data'>
    >(
      databaseAdapter,
      context,
      `SELECT e.id, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.data
        FROM entities e, entity_versions ev
        WHERE e.uuid = $1 AND e.latest_draft_entity_versions_id = ev.id`,
      [entity.id]
    );
    if (!previousValues) {
      return notOk.NotFound('No such entity');
    }
    const { id: entityId, type, name: previousName } = previousValues;

    const authResult = await authVerifyAuthorizationKey(
      authorizationAdapter,
      context,
      entity?.info?.authKey ? [entity.info.authKey] : undefined,
      { authKey: previousValues.auth_key, resolvedAuthKey: previousValues.resolved_auth_key }
    );
    if (authResult.isError()) {
      return authResult;
    }

    const resolvedResult = resolveUpdateEntity(schema, entity, type, previousValues);
    if (resolvedResult.isError()) {
      return resolvedResult;
    }
    const { changed, entity: updatedEntity } = resolvedResult.value;
    if (!changed) {
      const payload: AdminEntityUpdatePayload = { effect: 'none', entity: updatedEntity };
      return ok(payload);
    }

    const encodeResult = await encodeEntity(schema, databaseAdapter, context, updatedEntity);
    if (encodeResult.isError()) {
      return encodeResult;
    }
    const { data, name, referenceIds, locations, fullTextSearchText } = encodeResult.value;

    const { id: versionsId } = await Db.queryOne<Pick<EntityVersionsTable, 'id'>>(
      databaseAdapter,
      context,
      'INSERT INTO entity_versions (entities_id, created_by, version, data) VALUES ($1, $2, $3, $4) RETURNING id',
      [entityId, context.session.subjectInternalId, updatedEntity.info.version, data]
    );

    if (name !== previousName) {
      await withUniqueNameAttempt(
        databaseAdapter,
        context,
        name,
        randomNameGenerator,
        async (context, name) => {
          await Db.queryNone(
            databaseAdapter,
            context,
            'UPDATE entities SET name = $1 WHERE id = $2',
            [name, entityId]
          );
          updatedEntity.info.name = name;
        }
      );
    }

    const { updated_at: updatedAt } = await Db.queryOne(
      databaseAdapter,
      context,
      `UPDATE entities SET
        latest_draft_entity_versions_id = $1,
        latest_fts = to_tsvector($2),
        updated_at = NOW(),
        updated = nextval('entities_updated_seq'),
        status = $3
      WHERE id = $4
      RETURNING updated_at`,
      [versionsId, fullTextSearchText.join(' '), updatedEntity.info.status, entityId]
    );

    updatedEntity.info.updatedAt = updatedAt;

    if (referenceIds.length > 0) {
      const qb = new PostgresQueryBuilder(
        'INSERT INTO entity_version_references (entity_versions_id, entities_id) VALUES',
        [versionsId]
      );
      for (const referenceId of referenceIds) {
        qb.addQuery(`($1, ${qb.addValue(referenceId)})`);
      }
      await Db.queryNone(databaseAdapter, context, qb.build());
    }

    if (locations.length > 0) {
      const qb = new PostgresQueryBuilder(
        'INSERT INTO entity_version_locations (entity_versions_id, location) VALUES',
        [versionsId]
      );
      for (const location of locations) {
        qb.addQuery(
          `($1, ST_SetSRID(ST_Point(${qb.addValue(location.lng)}, ${qb.addValue(
            location.lat
          )}), 4326))`
        );
      }
      await Db.queryNone(databaseAdapter, context, qb.build());
    }

    return ok({ effect: 'updated', entity: updatedEntity });
  });
}

async function withUniqueNameAttempt<TResult>(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  name: string,
  randomNameGenerator: (name: string) => string,
  attempt: (context: SessionContext, name: string) => Promise<TResult>
) {
  let potentiallyModifiedName = name;
  let first = true;
  for (let i = 0; i < 10; i += 1) {
    // TODO Add support for savepoint to context or databasecontext?
    await Db.queryNone(
      databaseAdapter,
      context,
      first ? 'SAVEPOINT unique_name' : 'ROLLBACK TO SAVEPOINT unique_name; SAVEPOINT unique_name'
    );
    first = false;

    try {
      const result = await attempt(context, potentiallyModifiedName);
      // No exception => it's all good
      await Db.queryNone(databaseAdapter, context, 'RELEASE SAVEPOINT unique_name');

      return result;
    } catch (error) {
      if (Db.isUniqueViolationOfConstraint(databaseAdapter, error, 'entities_name_key')) {
        potentiallyModifiedName = randomNameGenerator(name);
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Failed creating a unique name for ${name}`);
}
