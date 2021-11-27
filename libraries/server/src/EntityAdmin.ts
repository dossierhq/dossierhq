import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityCreatePayload,
  AdminEntityUpdate,
  AdminEntityUpdatePayload,
  AdminEntityUpsert,
  AdminEntityUpsertPayload,
  AdminQuery,
  AdminSchema,
  Connection,
  Edge,
  EntityHistory,
  EntityPublishPayload,
  EntityVersionInfo,
  Paging,
  PromiseResult,
  PublishingEvent,
  PublishingEventKind,
  PublishingHistory,
  Result,
} from '@jonasb/datadata-core';
import {
  AdminItemTraverseNodeType,
  assertIsDefined,
  EntityPublishState,
  ErrorType,
  isEntityNameAsRequested,
  notOk,
  ok,
  traverseAdminItem,
  visitorPathToString,
} from '@jonasb/datadata-core';
import type { DatabaseAdapter, SessionContext } from '.';
import * as Db from './Database';
import type {
  EntitiesTable,
  EntityPublishingEventsTable,
  EntityVersionsTable,
} from './DatabaseTables';
import type { EncodeEntityResult } from './EntityCodec';
import {
  collectDataFromEntity,
  decodeAdminEntity,
  decodeAdminEntityFields,
  encodeEntity,
  resolveCreateEntity,
  resolvePublishState,
  resolveUpdateEntity,
} from './EntityCodec';
import { sharedSearchEntities } from './EntitySearcher';
import QueryBuilder from './QueryBuilder';
import type { SearchAdminEntitiesItem } from './QueryGenerator';
import { searchAdminEntitiesQuery, totalAdminEntitiesQuery } from './QueryGenerator';

export async function getEntity(
  schema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  id: string,
  version?: number | null
): PromiseResult<AdminEntity, ErrorType.NotFound> {
  let actualVersion: number;
  if (typeof version === 'number') {
    actualVersion = version;
  } else {
    const versionResult = await resolveMaxVersionForEntity(databaseAdapter, context, id);
    if (versionResult.isError()) {
      return versionResult;
    }
    actualVersion = versionResult.value.maxVersion;
  }
  const entityMain = await Db.queryNoneOrOne<
    Pick<EntitiesTable, 'uuid' | 'type' | 'name' | 'created_at' | 'updated_at' | 'status'> &
      Pick<EntityVersionsTable, 'version' | 'data'>
  >(
    databaseAdapter,
    context,
    `SELECT e.uuid, e.type, e.name, e.created_at, e.updated_at, e.status, ev.version, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = $1
      AND e.id = ev.entities_id
      AND ev.version = $2`,
    [id, actualVersion]
  );
  if (!entityMain) {
    return notOk.NotFound('No such entity or version');
  }

  const entity = decodeAdminEntity(schema, entityMain);

  return ok(entity);
}

export async function getEntities(
  schema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  ids: string[]
): PromiseResult<Result<AdminEntity, ErrorType.NotFound>[], ErrorType.Generic> {
  if (ids.length === 0) {
    return ok([]);
  }

  const entitiesMain = await Db.queryMany<
    Pick<EntitiesTable, 'uuid' | 'type' | 'name' | 'created_at' | 'updated_at' | 'status'> &
      Pick<EntityVersionsTable, 'version' | 'data'>
  >(
    databaseAdapter,
    context,
    `SELECT e.uuid, e.type, e.name, e.created_at, e.updated_at, e.status, ev.version, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = ANY($1)
      AND e.latest_draft_entity_versions_id = ev.id`,
    [ids]
  );

  const result: Result<AdminEntity, ErrorType.NotFound>[] = ids.map((id) => {
    const entityMain = entitiesMain.find((x) => x.uuid === id);
    if (!entityMain) {
      return notOk.NotFound('No such entity');
    }
    return ok(decodeAdminEntity(schema, entityMain));
  });

  return ok(result);
}

export async function searchEntities(
  schema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: AdminQuery | undefined,
  paging: Paging | undefined
): PromiseResult<Connection<Edge<AdminEntity, ErrorType>> | null, ErrorType.BadRequest> {
  const sqlQueryResult = searchAdminEntitiesQuery(schema, query, paging);
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
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: AdminQuery | undefined
): PromiseResult<number, ErrorType.BadRequest> {
  const sqlQuery = totalAdminEntitiesQuery(schema, query);
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
  attempt: (context: SessionContext, name: string) => Promise<TResult>
) {
  let potentiallyModifiedName = name;
  let first = true;
  for (let i = 0; i < 10; i += 1) {
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
        potentiallyModifiedName = `${name}#${Math.random().toFixed(8).slice(2)}`;
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Failed creating a unique name for ${name}`);
}

export async function createEntity(
  schema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityCreate
): PromiseResult<AdminEntityCreatePayload, ErrorType.BadRequest | ErrorType.Conflict> {
  const resolvedResult = resolveCreateEntity(schema, entity);
  if (resolvedResult.isError()) {
    return resolvedResult;
  }
  const createEntity = resolvedResult.value;

  const encodeResult = await encodeEntity(schema, databaseAdapter, context, createEntity);
  if (encodeResult.isError()) {
    return encodeResult;
  }
  const encodeEntityResult = encodeResult.value;

  return await context.withTransaction(async (context) => {
    const createEntityRowResult = await createEntityRow(
      databaseAdapter,
      context,
      entity.id,
      encodeEntityResult
    );
    if (createEntityRowResult.isError()) {
      return createEntityRowResult;
    }
    const { uuid, actualName, entityId, createdAt, updatedAt } = createEntityRowResult.value;

    const { id: versionsId } = await Db.queryOne<{ id: number }>(
      databaseAdapter,
      context,
      'INSERT INTO entity_versions (entities_id, version, created_by, data) VALUES ($1, 0, $2, $3) RETURNING id',
      [entityId, context.session.subjectInternalId, encodeEntityResult.data]
    );
    await Db.queryNone(
      databaseAdapter,
      context,
      'UPDATE entities SET latest_draft_entity_versions_id = $1 WHERE id = $2',
      [versionsId, entityId]
    );
    if (encodeEntityResult.referenceIds.length > 0) {
      const qb = new QueryBuilder(
        'INSERT INTO entity_version_references (entity_versions_id, entities_id) VALUES',
        [versionsId]
      );
      for (const referenceId of encodeEntityResult.referenceIds) {
        qb.addQuery(`($1, ${qb.addValue(referenceId)})`);
      }
      await Db.queryNone(databaseAdapter, context, qb.build());
    }
    if (encodeEntityResult.locations.length > 0) {
      const qb = new QueryBuilder(
        'INSERT INTO entity_version_locations (entity_versions_id, location) VALUES',
        [versionsId]
      );
      for (const location of encodeEntityResult.locations) {
        qb.addQuery(
          `($1, ST_SetSRID(ST_Point(${qb.addValue(location.lng)}, ${qb.addValue(
            location.lat
          )}), 4326))`
        );
      }
      await Db.queryNone(databaseAdapter, context, qb.build());
    }

    const result: AdminEntity = {
      id: uuid,
      info: {
        ...createEntity.info,
        name: actualName,
        publishingState: EntityPublishState.Draft,
        version: 0,
        createdAt,
        updatedAt,
      },
      fields: createEntity.fields ?? {},
    };
    return ok({ effect: 'created', entity: result });
  });
}

async function createEntityRow(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  id: string | undefined,
  encodeEntityResult: EncodeEntityResult
) {
  const { name, type, fullTextSearchText } = encodeEntityResult;

  try {
    const { uuid, actualName, entityId, createdAt, updatedAt } = await withUniqueNameAttempt(
      databaseAdapter,
      context,
      name,
      async (context, name) => {
        const qb = new QueryBuilder('INSERT INTO entities (uuid, name, type, latest_fts, status)');
        qb.addQuery(
          `VALUES (${qb.addValueOrDefault(id)}, ${qb.addValue(name)}, ${qb.addValue(
            type
          )}, to_tsvector(${qb.addValue(fullTextSearchText.join(' '))}), 'draft')`
        );
        qb.addQuery('RETURNING id, uuid, created_at, updated_at');
        const {
          id: entityId,
          uuid,
          created_at: createdAt,
          updated_at: updatedAt,
        } = await Db.queryOne<Pick<EntitiesTable, 'id' | 'uuid' | 'created_at' | 'updated_at'>>(
          databaseAdapter,
          context,
          qb.build()
        );
        return { uuid, actualName: name, entityId, createdAt, updatedAt };
      }
    );
    return ok({ uuid, actualName, entityId, createdAt, updatedAt });
  } catch (error) {
    if (Db.isUniqueViolationOfConstraint(databaseAdapter, error, 'entities_uuid_key')) {
      return notOk.Conflict(`Entity with id (${id}) already exist`);
    }
    throw error;
  }
}

export async function updateEntity(
  schema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityUpdate
): PromiseResult<AdminEntityUpdatePayload, ErrorType.BadRequest | ErrorType.NotFound> {
  return await context.withTransaction(async (context) => {
    const previousValues = await Db.queryNoneOrOne<
      Pick<
        EntitiesTable,
        | 'id'
        | 'type'
        | 'name'
        | 'created_at'
        | 'updated_at'
        | 'archived'
        | 'never_published'
        | 'published_entity_versions_id'
        | 'latest_draft_entity_versions_id'
      > &
        Pick<EntityVersionsTable, 'version' | 'data'>
    >(
      databaseAdapter,
      context,
      `SELECT e.id, e.type, e.name, e.created_at, e.updated_at, e.archived, e.never_published, e.published_entity_versions_id, e.latest_draft_entity_versions_id, ev.version, ev.data
        FROM entities e, entity_versions ev
        WHERE e.uuid = $1 AND e.latest_draft_entity_versions_id = ev.id`,
      [entity.id]
    );
    if (!previousValues) {
      return notOk.NotFound('No such entity');
    }
    const { id: entityId, type, name: previousName } = previousValues;

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
      await withUniqueNameAttempt(databaseAdapter, context, name, async (context, name) => {
        await Db.queryNone(
          databaseAdapter,
          context,
          'UPDATE entities SET name = $1 WHERE id = $2',
          [name, entityId]
        );
        updatedEntity.info.name = name;
      });
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
      [versionsId, fullTextSearchText.join(' '), updatedEntity.info.publishingState, entityId]
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
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entity: AdminEntityUpsert
): PromiseResult<AdminEntityUpsertPayload, ErrorType.BadRequest | ErrorType.Generic> {
  const entityInfo = await Db.queryNoneOrOne<Pick<EntitiesTable, 'name'>>(
    databaseAdapter,
    context,
    'SELECT e.name FROM entities e WHERE e.uuid = $1',
    [entity.id]
  );

  if (!entityInfo) {
    const createResult = await createEntity(schema, databaseAdapter, context, entity);
    if (createResult.isOk()) {
      return createResult.map((value) => value);
    } else if (createResult.isErrorType(ErrorType.Conflict)) {
      return upsertEntity(schema, databaseAdapter, context, entity);
    } else if (createResult.isErrorType(ErrorType.BadRequest)) {
      return createResult;
    }
    return notOk.GenericUnexpectedError(createResult);
  }

  let entityUpdate: AdminEntityUpdate = entity;
  if (isEntityNameAsRequested(entityInfo.name, entity.info.name)) {
    // Remove name since we don't to change it the current name is the same but with a #number
    entityUpdate = { ...entity, info: { ...entity.info, name: undefined } };
  }

  const updateResult = await updateEntity(schema, databaseAdapter, context, entityUpdate);
  if (updateResult.isOk()) {
    return ok(updateResult.value);
  } else if (updateResult.isErrorType(ErrorType.BadRequest)) {
    return updateResult;
  }
  return notOk.GenericUnexpectedError(updateResult);
}

export async function publishEntities(
  schema: AdminSchema,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entities: {
    id: string;
    version: number;
  }[]
): PromiseResult<
  EntityPublishPayload[],
  ErrorType.BadRequest | ErrorType.NotFound | ErrorType.Generic
> {
  const uniqueIdCheck = checkUUIDsAreUnique(entities.map((it) => it.id));
  if (uniqueIdCheck.isError()) {
    return uniqueIdCheck;
  }

  return context.withTransaction(async (context) => {
    const result: EntityPublishPayload[] = [];
    // Step 1: Get version info for each entity
    const missingEntities: { id: string; version: number }[] = [];
    const alreadyPublishedEntityIds: string[] = [];
    const adminOnlyEntityIds: string[] = [];
    const versionsInfo: {
      uuid: string;
      versionsId: number;
      entityId: number;
      fullTextSearchText: string;
    }[] = [];
    for (const { id, version } of entities) {
      const versionInfo = await Db.queryNoneOrOne<
        Pick<EntityVersionsTable, 'id' | 'entities_id' | 'data'> &
          Pick<EntitiesTable, 'type' | 'name' | 'published_entity_versions_id'>
      >(
        databaseAdapter,
        context,
        `SELECT ev.id, ev.entities_id, ev.data, e.type, e.name, e.published_entity_versions_id
         FROM entity_versions ev, entities e
         WHERE e.uuid = $1 AND e.id = ev.entities_id
           AND ev.version = $2`,
        [id, version]
      );

      if (!versionInfo) {
        missingEntities.push({ id, version });
        continue;
      }

      const entitySpec = schema.getEntityTypeSpecification(versionInfo.type);
      if (!entitySpec) {
        return notOk.Generic(`No entity spec for type ${versionInfo.type}`);
      }

      if (versionInfo.published_entity_versions_id === versionInfo.id) {
        alreadyPublishedEntityIds.push(id);
      } else if (entitySpec.adminOnly) {
        adminOnlyEntityIds.push(id);
      } else {
        const entityFields = decodeAdminEntityFields(schema, entitySpec, versionInfo);
        // Not entirely the correct type but close enough
        const entity: AdminEntityCreate = {
          info: { type: versionInfo.type, name: versionInfo.name },
          fields: entityFields,
        };
        const { fullTextSearchText } = collectDataFromEntity(schema, entity);

        for (const node of traverseAdminItem(schema, [`entity(${id})`], entity as AdminEntity)) {
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

        versionsInfo.push({
          uuid: id,
          versionsId: versionInfo.id,
          entityId: versionInfo.entities_id,
          fullTextSearchText: fullTextSearchText.join(' '),
        });
      }
    }
    if (missingEntities.length > 0) {
      return notOk.NotFound(`No such entities: ${missingEntities.map(({ id }) => id).join(', ')}`);
    }
    if (alreadyPublishedEntityIds.length > 0) {
      return notOk.BadRequest(
        `Entity versions are already published: ${alreadyPublishedEntityIds.join(', ')}`
      );
    }
    if (adminOnlyEntityIds.length > 0) {
      return notOk.BadRequest(`Entity type is adminOnly: ${adminOnlyEntityIds.join(', ')}`);
    }

    // Step 2: Publish entities
    for (const { uuid, versionsId, entityId, fullTextSearchText } of versionsInfo) {
      const { updated_at: updatedAt } = await Db.queryOne<Pick<EntitiesTable, 'updated_at'>>(
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
            status = 'published'
          WHERE id = $3
          RETURNING updated_at`,
        //TODO can be modified if not publishing the latest version
        [versionsId, fullTextSearchText, entityId]
      );
      //TODO can be modified if not publishing the latest version
      result.push({ id: uuid, publishState: EntityPublishState.Published, updatedAt });
    }

    // Step 3: Check if references are ok
    const referenceErrorMessages: string[] = [];
    for (const { uuid, versionsId } of versionsInfo) {
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
    const qb = new QueryBuilder(
      'INSERT INTO entity_publishing_events (entities_id, entity_versions_id, published_by, kind) VALUES'
    );
    const subjectValue = qb.addValue(context.session.subjectInternalId);
    for (const versionInfo of versionsInfo) {
      qb.addQuery(
        `(${qb.addValue(versionInfo.entityId)}, ${qb.addValue(
          versionInfo.versionsId
        )}, ${subjectValue}, 'publish')`
      );
    }
    await Db.queryNone(databaseAdapter, context, qb.build());

    //
    return ok(result);
  });
}

export async function unpublishEntities(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  entityIds: string[]
): PromiseResult<EntityPublishPayload[], ErrorType.BadRequest | ErrorType.NotFound> {
  const uniqueIdCheck = checkUUIDsAreUnique(entityIds);
  if (uniqueIdCheck.isError()) {
    return uniqueIdCheck;
  }

  return context.withTransaction(async (context) => {
    const result: EntityPublishPayload[] = [];

    // Step 1: Resolve entities and check if all entities exist
    const entitiesInfo = await Db.queryMany<
      Pick<EntitiesTable, 'id' | 'uuid' | 'published_entity_versions_id'>
    >(
      databaseAdapter,
      context,
      'SELECT e.id, e.uuid, e.published_entity_versions_id FROM entities e WHERE e.uuid = ANY($1)',
      [entityIds]
    );

    const missingEntityIds = entityIds.filter(
      (entityId) => !entitiesInfo.find((it) => it.uuid === entityId)
    );
    if (missingEntityIds.length > 0) {
      return notOk.NotFound(`No such entities: ${missingEntityIds.join(', ')}`);
    }

    const unpublishedEntities = entitiesInfo
      .filter((it) => it.published_entity_versions_id === null)
      .map((it) => it.uuid);
    if (unpublishedEntities.length > 0) {
      return notOk.BadRequest(`Entities are not published: ${unpublishedEntities.join(', ')}`);
    }

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
      [entitiesInfo.map((it) => it.id)]
    );
    for (const uuid of entityIds) {
      const updatedAt = unpublishRows.find((it) => it.uuid === uuid)?.updated_at;
      assertIsDefined(updatedAt);
      result.push({ id: uuid, publishState: EntityPublishState.Withdrawn, updatedAt });
    }

    // Step 3: Check if references are ok
    const referenceErrorMessages: string[] = [];
    for (const { id, uuid } of entitiesInfo) {
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
    const qb = new QueryBuilder(
      'INSERT INTO entity_publishing_events (entities_id, entity_versions_id, published_by, kind) VALUES'
    );
    const subjectValue = qb.addValue(context.session.subjectInternalId);
    for (const entityInfo of entitiesInfo) {
      qb.addQuery(`(${qb.addValue(entityInfo.id)}, NULL, ${subjectValue}, 'unpublish')`);
    }
    await Db.queryNone(databaseAdapter, context, qb.build());

    //
    return ok(result);
  });
}

export async function archiveEntity(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  id: string
): PromiseResult<EntityPublishPayload, ErrorType.BadRequest | ErrorType.NotFound> {
  return context.withTransaction(async (context) => {
    const entityInfo = await Db.queryNoneOrOne<
      Pick<EntitiesTable, 'id' | 'published_entity_versions_id' | 'archived' | 'updated_at'>
    >(
      databaseAdapter,
      context,
      'SELECT e.id, e.published_entity_versions_id, e.archived, e.updated_at FROM entities e WHERE e.uuid = $1',
      [id]
    );

    if (!entityInfo) {
      return notOk.NotFound('No such entity');
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
      return ok({ id, publishState: EntityPublishState.Archived, updatedAt: previousUpdatedAt }); // no change
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

    return ok({ id, publishState: EntityPublishState.Archived, updatedAt });
  });
}

export async function unarchiveEntity(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  id: string
): PromiseResult<EntityPublishPayload, ErrorType.BadRequest | ErrorType.NotFound> {
  return context.withTransaction(async (context) => {
    const entityInfo = await Db.queryNoneOrOne<
      Pick<
        EntitiesTable,
        | 'id'
        | 'archived'
        | 'latest_draft_entity_versions_id'
        | 'never_published'
        | 'published_entity_versions_id'
        | 'updated_at'
      >
    >(
      databaseAdapter,
      context,
      `SELECT id, archived, latest_draft_entity_versions_id, never_published, published_entity_versions_id, updated_at
       FROM entities WHERE uuid = $1`,
      [id]
    );

    if (!entityInfo) {
      return notOk.NotFound('No such entity');
    }
    const { id: entityId, archived, updated_at: previousUpdatedAt } = entityInfo;
    const result: EntityPublishPayload = {
      id,
      publishState: resolvePublishState({ ...entityInfo, archived: false }, entityInfo),
      updatedAt: previousUpdatedAt,
    };

    if (archived) {
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
          [result.publishState, entityId]
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

async function resolveMaxVersionForEntity(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  id: string
): PromiseResult<{ entityId: number; maxVersion: number }, ErrorType.NotFound> {
  const result = await Db.queryNoneOrOne<Pick<EntityVersionsTable, 'entities_id' | 'version'>>(
    databaseAdapter,
    context,
    `SELECT ev.entities_id, ev.version
      FROM entity_versions ev, entities e
      WHERE e.uuid = $1 AND e.latest_draft_entity_versions_id = ev.id`,
    [id]
  );
  if (!result) {
    return notOk.NotFound('No such entity');
  }
  return ok({ entityId: result.entities_id, maxVersion: result.version });
}

function checkUUIDsAreUnique(uuids: string[]): Result<void, ErrorType.BadRequest> {
  const unique = new Set<string>();
  for (const uuid of uuids) {
    if (unique.has(uuid)) {
      return notOk.BadRequest(`Duplicate ids: ${uuid}`);
    }
    unique.add(uuid);
  }
  return ok(undefined);
}

export async function getEntityHistory(
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  id: string
): PromiseResult<EntityHistory, ErrorType.NotFound> {
  const entityMain = await Db.queryNoneOrOne<
    Pick<EntitiesTable, 'id' | 'uuid' | 'published_entity_versions_id'>
  >(
    databaseAdapter,
    context,
    `SELECT id, uuid, published_entity_versions_id
      FROM entities e
      WHERE uuid = $1`,
    [id]
  );
  if (!entityMain) {
    return notOk.NotFound('No such entity');
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
  context: SessionContext,
  id: string
): PromiseResult<PublishingHistory, ErrorType.NotFound> {
  const entityInfo = await Db.queryNoneOrOne<Pick<EntitiesTable, 'id'>>(
    databaseAdapter,
    context,
    'SELECT id FROM entities WHERE uuid = $1',
    [id]
  );
  if (!entityInfo) {
    return notOk.NotFound('No such entity');
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
    id,
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
