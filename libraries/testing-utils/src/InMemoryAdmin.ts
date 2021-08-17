import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityCreatePayload,
  AdminEntityUpdate,
  AdminEntityUpdatePayload,
  AdminEntityUpsert,
  AdminEntityUpsertPayload,
  AdminQuery,
  Connection,
  Edge,
  EntityHistory,
  EntityPublishPayload,
  EntityReference,
  EntityVersionReference,
  Location,
  Paging,
  PromiseResult,
  PublishingHistory,
  Result,
} from '@jonasb/datadata-core';
import {
  assertIsDefined,
  EntityPublishState,
  ErrorType,
  isLocationItemField,
  isPagingForwards,
  normalizeFieldValue,
  notOk,
  ok,
  visitItemRecursively,
} from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import { v4 as uuidv4 } from 'uuid';
import type { InMemorySessionContext } from '.';

const pagingDefaultCount = 25;

export const InMemoryAdmin = {
  getEntity: async (
    context: InMemorySessionContext,
    id: string,
    version?: number | null
  ): PromiseResult<AdminEntity, ErrorType.NotFound> => {
    const entity = context.server.getEntity(id, version);
    if (entity) {
      return ok(entity);
    }
    return notOk.NotFound('No such entity or version');
  },

  getEntities: async (
    context: InMemorySessionContext,
    ids: string[]
  ): PromiseResult<Result<AdminEntity, ErrorType.NotFound>[], ErrorType.Generic> => {
    return ok(await Promise.all(ids.map(async (id) => await InMemoryAdmin.getEntity(context, id))));
  },

  getEntityHistory: async (
    context: InMemorySessionContext,
    id: string
  ): PromiseResult<EntityHistory, ErrorType.NotFound> => {
    const history = context.server.getEntityHistory(id);
    if (!history) {
      return notOk.NotFound('No such entity');
    }
    return ok(history);
  },

  getPublishingHistory: async (
    context: InMemorySessionContext,
    id: string
  ): PromiseResult<PublishingHistory, ErrorType.NotFound> => {
    const history = context.server.getPublishingHistory(id);
    if (!history) {
      return notOk.NotFound('No such entity');
    }
    return ok(history);
  },

  searchEntities: async (
    context: InMemorySessionContext,
    query?: AdminQuery,
    paging?: Paging
  ): PromiseResult<Connection<Edge<AdminEntity, ErrorType>> | null, ErrorType.BadRequest> => {
    const entities = context.server.getLatestEntities().filter((entity) => {
      if (
        query?.entityTypes?.length &&
        query.entityTypes.length > 0 &&
        query.entityTypes.indexOf(entity.info.type) < 0
      ) {
        return false;
      }
      if (query?.boundingBox) {
        const { minLat, maxLat, minLng, maxLng } = query.boundingBox;
        const locations: Location[] = [];
        visitItemRecursively({
          schema: context.server.schema,
          item: entity,
          visitField: (_path, fieldSpec, data, _visitContext) => {
            if (isLocationItemField(fieldSpec, data) && data) {
              locations.push(data);
            }
          },
          visitRichTextBlock: (_path, _fieldSpec, _block, _visitContext) => {
            // empty
          },
          initialVisitContext: undefined,
        });

        if (
          !locations.find(
            ({ lat, lng }) => lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng
          )
        ) {
          return false;
        }
      }
      return true;
    });
    if (entities.length === 0) {
      return ok(null);
    }

    //TODO order by, also use different cursors based on order

    const isForwards = isPagingForwards(paging);
    const requestedCount = (isForwards ? paging?.first : paging?.last) ?? pagingDefaultCount;
    const startIndex = paging?.after ? entities.findIndex((it) => it.id === paging.after) + 1 : 0;
    const endIndex = paging?.before
      ? entities.findIndex((it) => it.id === paging.before)
      : entities.length;
    const resolvedCount = Math.min(requestedCount, endIndex - startIndex);
    const resolvedStartIndex = isForwards ? startIndex : endIndex - resolvedCount;
    const resolvedEndIndex = isForwards ? startIndex + resolvedCount : endIndex;

    const page = entities.slice(resolvedStartIndex, resolvedEndIndex);

    return ok({
      pageInfo: {
        hasPreviousPage: resolvedStartIndex > 0,
        hasNextPage: resolvedEndIndex < entities.length - 1,
        startCursor: page[0].id,
        endCursor: page[page.length - 1].id,
      },
      edges: page.map((entity) => ({ cursor: entity.id, node: ok(entity) })),
    });
  },

  getTotalCount: async (
    context: InMemorySessionContext,
    query?: AdminQuery
  ): PromiseResult<number, ErrorType.BadRequest> => {
    const searchResult = await InMemoryAdmin.searchEntities(context, query);
    if (searchResult.isError()) {
      return searchResult;
    }
    return ok(searchResult.value?.edges.length ?? 0);
  },

  createEntity: async (
    context: InMemorySessionContext,
    entity: AdminEntityCreate
  ): PromiseResult<AdminEntityCreatePayload, ErrorType.BadRequest> => {
    const schema = context.server.schema;
    const entitySpec = schema.getEntityTypeSpecification(entity.info.type);
    if (!entitySpec) {
      return notOk.BadRequest(`Invalid entity type ${entity.info.type}`);
    }

    const fields: Record<string, unknown> = {};
    for (const [fieldName, fieldValue] of Object.entries(entity.fields ?? {})) {
      const fieldSpec = schema.getEntityFieldSpecification(entitySpec, fieldName);
      if (!fieldSpec) {
        return notOk.BadRequest(`Invalid field name ${fieldName}`);
      }
      fields[fieldName] = normalizeFieldValue(schema, fieldSpec, fieldValue);
    }

    const now = Temporal.Now.instant();
    const newEntity: AdminEntity = {
      id: entity.id ?? uuidv4(),
      info: {
        type: entity.info.type,
        name: context.server.getUniqueName(null, entity.info.name),
        version: 0,
        publishingState: EntityPublishState.Draft,
        createdAt: now,
        updatedAt: now,
      },
      fields,
    };
    context.server.addNewEntity(newEntity, context.subjectId);
    return ok({ effect: 'created', entity: newEntity });
  },

  updateEntity: async (
    context: InMemorySessionContext,
    entity: AdminEntityUpdate
  ): PromiseResult<AdminEntityUpdatePayload, ErrorType.BadRequest | ErrorType.NotFound> => {
    const previousVersion = context.server.getEntity(entity.id);
    if (!previousVersion) {
      return notOk.NotFound('No such entity');
    }

    const schema = context.server.schema;
    const entitySpec = schema.getEntityTypeSpecification(previousVersion.info.type);
    if (!entitySpec) {
      return notOk.BadRequest(`Invalid entity type ${previousVersion.info.type}`);
    }

    const fields: Record<string, unknown> = {};
    for (const fieldSpec of entitySpec.fields) {
      const fieldName = fieldSpec.name;
      let fieldValue = previousVersion.fields[fieldName];
      if (fieldName in entity.fields) {
        fieldValue = entity.fields[fieldName];
      }
      fieldValue = normalizeFieldValue(schema, fieldSpec, fieldValue);
      fields[fieldName] = fieldValue;
    }

    let name = previousVersion.info.name;
    if (entity.info?.name && entity.info.name !== name) {
      name = context.server.getUniqueName(entity.id, entity.info.name);
    }
    const newEntity: AdminEntity = {
      ...previousVersion,
      info: {
        ...previousVersion.info,
        version: previousVersion.info.version + 1,
        name,
      },
      fields,
    };
    context.server.addUpdatedEntity(newEntity, context.subjectId);

    const afterUpdate = context.server.getEntity(entity.id);
    assertIsDefined(afterUpdate);
    return ok({ effect: 'updated', entity: afterUpdate });
  },

  upsertEntity: async (
    context: InMemorySessionContext,
    entity: AdminEntityUpsert
  ): PromiseResult<AdminEntityUpsertPayload, ErrorType.BadRequest | ErrorType.Generic> => {
    const existingEntity = context.server.getEntity(entity.id);

    if (!existingEntity) {
      const createResult = await InMemoryAdmin.createEntity(context, entity);
      return createResult;
      // TODO check effect of create. If conflict it could be created after we fetched entityInfo, so try to update
    }

    //TODO remove name if similar.
    const updateResult = await InMemoryAdmin.updateEntity(context, entity);
    if (updateResult.isOk()) {
      return ok(updateResult.value);
    }
    if (updateResult.isErrorType(ErrorType.BadRequest)) {
      return updateResult;
    }
    return notOk.Generic(`Unexpected NotFound error: ${updateResult.message}`);
  },

  publishEntities: async (
    context: InMemorySessionContext,
    entities: EntityVersionReference[]
  ): PromiseResult<EntityPublishPayload[], ErrorType.BadRequest | ErrorType.NotFound> => {
    return context.server.publishEntities(entities, context.subjectId);
  },

  unpublishEntities: async (
    context: InMemorySessionContext,
    entities: EntityReference[]
  ): PromiseResult<EntityPublishPayload[], ErrorType.BadRequest | ErrorType.NotFound> => {
    return context.server.unpublishEntities(entities, context.subjectId);
  },

  archiveEntity: async (
    context: InMemorySessionContext,
    entityId: string
  ): PromiseResult<EntityPublishPayload, ErrorType.BadRequest | ErrorType.NotFound> => {
    return context.server.archiveEntity(entityId, context.subjectId);
  },

  unarchiveEntity: async (
    context: InMemorySessionContext,
    entityId: string
  ): PromiseResult<EntityPublishPayload, ErrorType.BadRequest | ErrorType.NotFound> => {
    return context.server.unarchiveEntity(entityId, context.subjectId);
  },
};
