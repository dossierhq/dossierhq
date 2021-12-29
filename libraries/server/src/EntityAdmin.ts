import type {
  AdminEntity,
  AdminEntityArchivePayload,
  AdminEntityCreate,
  AdminEntityCreatePayload,
  AdminEntityPublishPayload,
  AdminEntityUnarchivePayload,
  AdminEntityUnpublishPayload,
  AdminEntityUpdate,
  AdminEntityUpdatePayload,
  AdminEntityUpsert,
  AdminEntityUpsertPayload,
  AdminQuery,
  AdminSchema,
  Connection,
  Edge,
  EntityHistory,
  EntityLike,
  EntityReference,
  EntityReferenceWithAuthKeys,
  EntityVersionInfo,
  EntityVersionReference,
  EntityVersionReferenceWithAuthKeys,
  Paging,
  PromiseResult,
  PublishingEvent,
  PublishingEventKind,
  PublishingHistory,
  Result,
} from '@jonasb/datadata-core';
import {
  AdminEntityStatus,
  AdminItemTraverseNodeType,
  assertIsDefined,
  createErrorResult,
  ErrorType,
  isEntityNameAsRequested,
  notOk,
  ok,
  traverseAdminItem,
  visitorPathToString,
} from '@jonasb/datadata-core';
import type { Temporal } from '@js-temporal/polyfill';
import type { AuthorizationAdapter, DatabaseAdapter, SessionContext } from '.';
import {
  authResolveAuthorizationKey,
  authResolveAuthorizationKeys,
  authVerifyAuthorizationKey,
} from './Auth';
import * as Db from './Database';
import type {
  EntitiesTable,
  EntityPublishingEventsTable,
  EntityVersionsTable,
} from './DatabaseTables';
import {
  collectDataFromEntity,
  decodeAdminEntity,
  decodeAdminEntityFields,
  encodeEntity,
  resolveCreateEntity,
  resolveEntityStatus,
  resolveUpdateEntity,
} from './EntityCodec';
import { sharedSearchEntities } from './EntitySearcher';
import { QueryBuilder } from './QueryBuilder';
import type { SearchAdminEntitiesItem } from './QueryGenerator';
import { searchAdminEntitiesQuery, totalAdminEntitiesQuery } from './QueryGenerator';

export async function getEntities(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  references: EntityReferenceWithAuthKeys[]
): PromiseResult<
  Result<
    AdminEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >[],
  ErrorType.Generic
> {
  if (references.length === 0) {
    return ok([]);
  }

  const entitiesMain = await Db.queryMany<
    Pick<
      EntitiesTable,
      | 'uuid'
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
    `SELECT e.uuid, e.type, e.name, e.auth_key, e.resolved_auth_key, e.created_at, e.updated_at, e.status, ev.version, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = ANY($1)
      AND e.latest_draft_entity_versions_id = ev.id`,
    [references.map((it) => it.id)]
  );

  async function mapItem(
    reference: EntityReferenceWithAuthKeys,
    entityMain: typeof entitiesMain[0] | undefined
  ): PromiseResult<
    AdminEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  > {
    if (!entityMain) {
      return notOk.NotFound('No such entity');
    }

    const authResult = await authVerifyAuthorizationKey(
      authorizationAdapter,
      context,
      reference.authKeys,
      { authKey: entityMain.auth_key, resolvedAuthKey: entityMain.resolved_auth_key }
    );
    if (authResult.isError()) {
      return authResult;
    }

    return ok(decodeAdminEntity(schema, entityMain));
  }

  const result: Result<
    AdminEntity,
    ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
  >[] = [];
  for (const reference of references) {
    const entityMain = entitiesMain.find((it) => it.uuid === reference.id);
    result.push(await mapItem(reference, entityMain));
  }

  return ok(result);
}

export async function searchEntities(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: AdminQuery | undefined,
  paging: Paging | undefined
): PromiseResult<
  Connection<Edge<AdminEntity, ErrorType>> | null,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const authKeysResult = await authResolveAuthorizationKeys(
    authorizationAdapter,
    context,
    query?.authKeys
  );
  if (authKeysResult.isError()) {
    return authKeysResult;
  }

  const sqlQueryResult = searchAdminEntitiesQuery(schema, query, paging, authKeysResult.value);
  if (sqlQueryResult.isError()) {
    return sqlQueryResult;
  }

  return await sharedSearchEntities<AdminSchema, AdminEntity, SearchAdminEntitiesItem>(
    schema,
    databaseAdapter,
    context,
    sqlQueryResult.value,
    decodeAdminEntity
  );
}

export async function getTotalCount(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: AdminQuery | undefined
): PromiseResult<number, ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic> {
  const authKeysResult = await authResolveAuthorizationKeys(
    authorizationAdapter,
    context,
    query?.authKeys
  );
  if (authKeysResult.isError()) {
    return authKeysResult;
  }

  const sqlQuery = totalAdminEntitiesQuery(schema, authKeysResult.value, query);
  if (sqlQuery.isError()) {
    return sqlQuery;
  }
  const { count } = await Db.queryOne<{ count: number }>(databaseAdapter, context, sqlQuery.value);
  return ok(count);
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

function randomNameGenerator(name: string) {
  return `${name}#${Math.random().toFixed(8).slice(2)}`;
}

export async function adminCreateEntity(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityCreate
): PromiseResult<
  AdminEntityCreatePayload,
  ErrorType.BadRequest | ErrorType.Conflict | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const resolvedResult = resolveCreateEntity(schema, entity);
  if (resolvedResult.isError()) {
    return resolvedResult;
  }
  const createEntity = resolvedResult.value;

  const resolvedAuthKeyResult = await authResolveAuthorizationKey(
    authorizationAdapter,
    context,
    entity.info.authKey
  );
  if (resolvedAuthKeyResult.isError()) {
    return resolvedAuthKeyResult;
  }

  const encodeResult = await encodeEntity(schema, databaseAdapter, context, createEntity);
  if (encodeResult.isError()) {
    return encodeResult;
  }
  const encodeEntityResult = encodeResult.value;

  return await context.withTransaction(async (context) => {
    const createResult = await databaseAdapter.adminEntityCreate(context, randomNameGenerator, {
      id: entity.id ?? null,
      type: encodeEntityResult.type,
      name: encodeEntityResult.name,
      creator: context.session,
      resolvedAuthKey: resolvedAuthKeyResult.value,
      fullTextSearchText: encodeEntityResult.fullTextSearchText.join(' '),
      referenceIds: encodeEntityResult.referenceIds,
      locations: encodeEntityResult.locations,
      fieldsData: encodeEntityResult.data,
    });
    if (createResult.isError()) {
      return createResult;
    }

    const { id, name, createdAt, updatedAt } = createResult.value;

    const result: AdminEntity = {
      id,
      info: {
        ...createEntity.info,
        name,
        status: AdminEntityStatus.draft,
        version: 0,
        createdAt,
        updatedAt,
      },
      fields: createEntity.fields ?? {},
    };
    return ok({ effect: 'created', entity: result });
  });
}

export async function updateEntity(
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
      const qb = new QueryBuilder(
        'INSERT INTO entity_version_references (entity_versions_id, entities_id) VALUES',
        [versionsId]
      );
      for (const referenceId of referenceIds) {
        qb.addQuery(`($1, ${qb.addValue(referenceId)})`);
      }
      await Db.queryNone(databaseAdapter, context, qb.build());
    }

    if (locations.length > 0) {
      const qb = new QueryBuilder(
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

export async function upsertEntity(
  schema: AdminSchema,
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityUpsert
): PromiseResult<
  AdminEntityUpsertPayload,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const entityInfo = await Db.queryNoneOrOne<Pick<EntitiesTable, 'name'>>(
    databaseAdapter,
    context,
    'SELECT e.name FROM entities e WHERE e.uuid = $1',
    [entity.id]
  );

  if (!entityInfo) {
    const createResult = await adminCreateEntity(
      schema,
      authorizationAdapter,
      databaseAdapter,
      context,
      entity
    );
    if (createResult.isOk()) {
      return createResult.map((value) => value);
    } else if (createResult.isErrorType(ErrorType.Conflict)) {
      return upsertEntity(schema, authorizationAdapter, databaseAdapter, context, entity);
    } else if (
      createResult.isErrorType(ErrorType.BadRequest) ||
      createResult.isErrorType(ErrorType.NotAuthorized) ||
      createResult.isErrorType(ErrorType.Generic)
    ) {
      return createResult;
    }
    return notOk.GenericUnexpectedError(createResult);
  }

  let entityUpdate: AdminEntityUpdate = entity;
  if (isEntityNameAsRequested(entityInfo.name, entity.info.name)) {
    // Remove name since we don't to change it the current name is the same but with a #number
    entityUpdate = { ...entity, info: { ...entity.info, name: undefined } };
  }

  const updateResult = await updateEntity(
    schema,
    authorizationAdapter,
    databaseAdapter,
    context,
    entityUpdate
  );
  if (updateResult.isOk()) {
    return ok(updateResult.value);
  } else if (
    updateResult.isErrorType(ErrorType.BadRequest) ||
    updateResult.isErrorType(ErrorType.NotAuthorized) ||
    updateResult.isErrorType(ErrorType.Generic)
  ) {
    return updateResult;
  }
  return notOk.GenericUnexpectedError(updateResult);
}

export async function publishEntities(
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

export async function unpublishEntities(
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

export async function archiveEntity(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys
): PromiseResult<
  AdminEntityArchivePayload,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  return context.withTransaction(async (context) => {
    const entityInfo = await Db.queryNoneOrOne<
      Pick<
        EntitiesTable,
        | 'id'
        | 'published_entity_versions_id'
        | 'archived'
        | 'updated_at'
        | 'auth_key'
        | 'resolved_auth_key'
      >
    >(
      databaseAdapter,
      context,
      'SELECT e.id, e.published_entity_versions_id, e.archived, e.updated_at, e.auth_key, e.resolved_auth_key FROM entities e WHERE e.uuid = $1',
      [reference.id]
    );

    if (!entityInfo) {
      return notOk.NotFound('No such entity');
    }

    const authResult = await authVerifyAuthorizationKey(
      authorizationAdapter,
      context,
      reference?.authKeys,
      { authKey: entityInfo.auth_key, resolvedAuthKey: entityInfo.resolved_auth_key }
    );
    if (authResult.isError()) {
      return authResult;
    }

    const {
      id: entityId,
      published_entity_versions_id: publishedVersionId,
      archived,
      updated_at: previousUpdatedAt,
    } = entityInfo;

    if (publishedVersionId) {
      return notOk.BadRequest('Entity is published');
    }
    if (archived) {
      return ok({
        id: reference.id,
        status: AdminEntityStatus.archived,
        effect: 'none',
        updatedAt: previousUpdatedAt,
      }); // no change
    }

    const [{ updated_at: updatedAt }, _] = await Promise.all([
      Db.queryOne<Pick<EntitiesTable, 'updated_at'>>(
        databaseAdapter,
        context,
        `UPDATE entities SET
            archived = TRUE,
            updated_at = NOW(),
            updated = nextval('entities_updated_seq'),
            status = 'archived'
          WHERE id = $1
          RETURNING updated_at`,
        [entityId]
      ),
      Db.queryNone(
        databaseAdapter,
        context,
        "INSERT INTO entity_publishing_events (entities_id, kind, published_by) VALUES ($1, 'archive', $2)",
        [entityId, context.session.subjectInternalId]
      ),
    ]);

    const value: AdminEntityArchivePayload = {
      id: reference.id,
      status: AdminEntityStatus.archived,
      effect: 'archived',
      updatedAt,
    };
    return ok(value);
  });
}

export async function unarchiveEntity(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys
): PromiseResult<
  AdminEntityUnarchivePayload,
  ErrorType.BadRequest | ErrorType.NotAuthorized | ErrorType.NotFound | ErrorType.Generic
> {
  return context.withTransaction(async (context) => {
    const entityInfo = await Db.queryNoneOrOne<
      Pick<
        EntitiesTable,
        'id' | 'never_published' | 'updated_at' | 'status' | 'auth_key' | 'resolved_auth_key'
      >
    >(
      databaseAdapter,
      context,
      `SELECT id, never_published, updated_at, status, auth_key, resolved_auth_key
       FROM entities WHERE uuid = $1`,
      [reference.id]
    );

    if (!entityInfo) {
      return notOk.NotFound('No such entity');
    }

    const authResult = await authVerifyAuthorizationKey(
      authorizationAdapter,
      context,
      reference?.authKeys,
      { authKey: entityInfo.auth_key, resolvedAuthKey: entityInfo.resolved_auth_key }
    );
    if (authResult.isError()) {
      return authResult;
    }

    const {
      id: entityId,
      never_published: neverPublished,
      updated_at: previousUpdatedAt,
    } = entityInfo;
    const result: AdminEntityUnarchivePayload = {
      id: reference.id,
      status: resolveEntityStatus(entityInfo.status),
      effect: 'none',
      updatedAt: previousUpdatedAt,
    };

    if (result.status === AdminEntityStatus.archived) {
      result.status = neverPublished ? AdminEntityStatus.draft : AdminEntityStatus.withdrawn;
      result.effect = 'unarchived';

      const [{ updated_at: updatedAt }, _] = await Promise.all([
        Db.queryOne<Pick<EntitiesTable, 'updated_at'>>(
          databaseAdapter,
          context,
          `UPDATE entities SET
            archived = FALSE,
            updated_at = NOW(),
            updated = nextval('entities_updated_seq'),
            status = $1
          WHERE id = $2
          RETURNING updated_at`,
          [result.status, entityId]
        ),
        Db.queryNone(
          databaseAdapter,
          context,
          "INSERT INTO entity_publishing_events (entities_id, kind, published_by) VALUES ($1, 'unarchive', $2)",
          [entityId, context.session.subjectInternalId]
        ),
      ]);
      result.updatedAt = updatedAt;
    }

    return ok(result);
  });
}

function checkUUIDsAreUnique(references: EntityReference[]): Result<void, ErrorType.BadRequest> {
  const unique = new Set<string>();
  for (const { id } of references) {
    if (unique.has(id)) {
      return notOk.BadRequest(`Duplicate ids: ${id}`);
    }
    unique.add(id);
  }
  return ok(undefined);
}

export async function getEntityHistory(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys
): PromiseResult<
  EntityHistory,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const entityMain = await Db.queryNoneOrOne<
    Pick<
      EntitiesTable,
      'id' | 'uuid' | 'published_entity_versions_id' | 'auth_key' | 'resolved_auth_key'
    >
  >(
    databaseAdapter,
    context,
    `SELECT id, uuid, published_entity_versions_id, auth_key, resolved_auth_key
      FROM entities e
      WHERE uuid = $1`,
    [reference.id]
  );
  if (!entityMain) {
    return notOk.NotFound('No such entity');
  }

  const authResult = await authVerifyAuthorizationKey(
    authorizationAdapter,
    context,
    reference?.authKeys,
    { authKey: entityMain.auth_key, resolvedAuthKey: entityMain.resolved_auth_key }
  );
  if (authResult.isError()) {
    return authResult;
  }

  const versions = await Db.queryMany<
    Pick<EntityVersionsTable, 'id' | 'version' | 'created_at'> & {
      created_by_uuid: string;
    }
  >(
    databaseAdapter,
    context,
    `SELECT
      ev.id,
      ev.version,
      ev.created_at,
      s.uuid AS created_by_uuid
     FROM entity_versions ev, subjects s
     WHERE ev.entities_id = $1 AND ev.created_by = s.id
     ORDER BY ev.version`,
    [entityMain.id]
  );

  const result: EntityHistory = {
    id: entityMain.uuid,
    versions: versions.map<EntityVersionInfo>((v) => ({
      version: v.version,
      published: v.id === entityMain.published_entity_versions_id,
      createdBy: v.created_by_uuid,
      createdAt: v.created_at,
    })),
  };
  return ok(result);
}

export async function getPublishingHistory(
  databaseAdapter: DatabaseAdapter,
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  reference: EntityReferenceWithAuthKeys
): PromiseResult<
  PublishingHistory,
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.NotAuthorized | ErrorType.Generic
> {
  const entityInfo = await Db.queryNoneOrOne<
    Pick<EntitiesTable, 'id' | 'auth_key' | 'resolved_auth_key'>
  >(
    databaseAdapter,
    context,
    'SELECT id, auth_key, resolved_auth_key FROM entities WHERE uuid = $1',
    [reference.id]
  );
  if (!entityInfo) {
    return notOk.NotFound('No such entity');
  }

  const authResult = await authVerifyAuthorizationKey(
    authorizationAdapter,
    context,
    reference?.authKeys,
    { authKey: entityInfo.auth_key, resolvedAuthKey: entityInfo.resolved_auth_key }
  );
  if (authResult.isError()) {
    return authResult;
  }

  const publishEvents = await Db.queryMany<
    Pick<EntityVersionsTable, 'version'> &
      Pick<EntityPublishingEventsTable, 'published_at' | 'kind'> & {
        published_by: string;
      }
  >(
    databaseAdapter,
    context,
    `SELECT ev.version, s.uuid AS published_by, epe.published_at, epe.kind
      FROM entity_publishing_events epe
        LEFT OUTER JOIN entity_versions ev ON (epe.entity_versions_id = ev.id)
        INNER JOIN subjects s ON (epe.published_by = s.id)
      WHERE epe.entities_id = $1
      ORDER BY epe.published_at`,
    [entityInfo.id]
  );
  return ok({
    id: reference.id,
    events: publishEvents.map((it) => {
      const event: PublishingEvent = {
        version: it.version,
        kind: it.kind as PublishingEventKind,
        publishedAt: it.published_at,
        publishedBy: it.published_by,
      };
      return event;
    }),
  });
}
