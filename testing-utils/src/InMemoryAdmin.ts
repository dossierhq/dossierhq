import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  AdminEntityUpsert,
  AdminEntityUpsertPayload,
  AdminQuery,
  Connection,
  Edge,
  EntityHistory,
  Location,
  Paging,
  PromiseResult,
  PublishingHistory,
  PublishingResult,
  Result,
} from '@jonasb/datadata-core';
import {
  assertIsDefined,
  EntityPublishState,
  ErrorType,
  isLocationItemField,
  isPagingForwards,
  notOk,
  ok,
  visitItemRecursively,
} from '@jonasb/datadata-core';
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
    const resolvedEndIndex = startIndex + resolvedCount;

    const page = entities.slice(startIndex, resolvedEndIndex);

    return ok({
      pageInfo: {
        hasPreviousPage: startIndex > 0,
        hasNextPage: resolvedEndIndex < endIndex,
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
  ): PromiseResult<AdminEntity, ErrorType.BadRequest> => {
    const newEntity: AdminEntity = {
      id: entity.id ?? uuidv4(),
      info: {
        type: entity.info.type,
        name: context.server.getUniqueName(null, entity.info.name),
        version: 0,
        publishingState: EntityPublishState.Draft,
      },
      fields: entity.fields ?? {},
    };
    context.server.addNewEntity(newEntity, context.subjectId);
    return ok(newEntity);
  },

  updateEntity: async (
    context: InMemorySessionContext,
    entity: AdminEntityUpdate
  ): PromiseResult<AdminEntity, ErrorType.BadRequest | ErrorType.NotFound> => {
    const previousVersion = context.server.getEntity(entity.id);
    if (!previousVersion) {
      return notOk.NotFound('No such entity');
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
      fields: {
        ...previousVersion.fields,
        ...entity.fields,
      },
    };
    context.server.addUpdatedEntity(newEntity, context.subjectId);

    const afterUpdate = context.server.getEntity(entity.id);
    assertIsDefined(afterUpdate);
    return ok(afterUpdate);
  },

  upsertEntity: async (
    context: InMemorySessionContext,
    entity: AdminEntityUpsert
  ): PromiseResult<AdminEntityUpsertPayload, ErrorType.BadRequest | ErrorType.Generic> => {
    const existingEntity = context.server.getEntity(entity.id);

    if (!existingEntity) {
      const createResult = await InMemoryAdmin.createEntity(context, entity);
      return createResult.isOk()
        ? createResult.map((entity) => ({ effect: 'created', entity }))
        : createResult;
      // TODO check effect of create. If conflict it could be created after we fetched entityInfo, so try to update
    }

    //TODO remove name if similar. Support none effect
    const updateResult = await InMemoryAdmin.updateEntity(context, entity);
    if (updateResult.isOk()) {
      return updateResult.map((entity) => ({ effect: 'updated', entity }));
    }
    if (updateResult.isErrorType(ErrorType.BadRequest)) {
      return updateResult;
    }
    return notOk.Generic(`Unexpected NotFound error: ${updateResult.message}`);
  },

  publishEntities: async (
    context: InMemorySessionContext,
    entities: { id: string; version: number }[]
  ): PromiseResult<PublishingResult[], ErrorType.BadRequest | ErrorType.NotFound> => {
    for (const { id, version } of entities) {
      const entityResult = context.server.getEntity(id, version);
      if (!entityResult) {
        return notOk.NotFound('No such entity or version');
      }

      context.server.setPublishedVersion(id, version, context.subjectId);
    }

    return ok(entities.map(({ id }) => ({ id, publishState: EntityPublishState.Published })));
  },

  unpublishEntities: async (
    context: InMemorySessionContext,
    entityIds: string[]
  ): PromiseResult<PublishingResult[], ErrorType.BadRequest | ErrorType.NotFound> => {
    for (const id of entityIds) {
      const entityResult = context.server.getEntity(id);
      if (!entityResult) {
        return notOk.NotFound('No such entity or version');
      }

      context.server.setPublishedVersion(id, null, context.subjectId);
    }

    return ok(entityIds.map((id) => ({ id, publishState: EntityPublishState.Withdrawn })));
  },

  archiveEntity: async (
    context: InMemorySessionContext,
    entityId: string
  ): PromiseResult<PublishingResult, ErrorType.BadRequest | ErrorType.NotFound> => {
    const entityResult = context.server.getEntity(entityId);
    if (!entityResult) {
      return notOk.NotFound('No such entity or version');
    }

    context.server.archiveEntity(entityId, context.subjectId);

    return ok({ id: entityId, publishState: EntityPublishState.Archived });
  },

  unarchiveEntity: async (
    context: InMemorySessionContext,
    entityId: string
  ): PromiseResult<PublishingResult, ErrorType.BadRequest | ErrorType.NotFound> => {
    const entityResult = context.server.getEntity(entityId);
    if (!entityResult) {
      return notOk.NotFound('No such entity or version');
    }

    return ok(context.server.unarchiveEntity(entityId, context.subjectId));
  },
};
