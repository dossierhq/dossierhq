import type {
  AdminEntity2,
  AdminEntityCreate2,
  AdminEntityUpdate2,
  AdminQuery,
  Connection,
  Edge,
  EntityHistory,
  ErrorType,
  Location,
  Paging,
  PromiseResult,
  PublishingHistory,
  PublishingResult,
  Result,
} from '@datadata/core';
import {
  assertIsDefined,
  EntityPublishState,
  isLocationItemField,
  notOk,
  ok,
  visitItemRecursively,
} from '@datadata/core';
import { v4 as uuidv4 } from 'uuid';
import type { InMemorySessionContext } from '.';

export const InMemoryAdmin = {
  getEntity: async (
    context: InMemorySessionContext,
    id: string,
    version?: number | null
  ): PromiseResult<AdminEntity2, ErrorType.NotFound> => {
    const entity = context.server.getEntity(id, version);
    if (entity) {
      return ok(entity);
    }
    return notOk.NotFound('No such entity or version');
  },

  getEntities: async (
    context: InMemorySessionContext,
    ids: string[]
  ): Promise<Result<AdminEntity2, ErrorType.NotFound>[]> => {
    return await Promise.all(ids.map(async (id) => await InMemoryAdmin.getEntity(context, id)));
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
  ): PromiseResult<Connection<Edge<AdminEntity2, ErrorType>> | null, ErrorType.BadRequest> => {
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
    return ok({
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: entities[0].id,
        endCursor: entities[entities.length - 1].id,
      },
      edges: entities.map((entity) => ({ cursor: entity.id, node: ok(entity) })),
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
    entity: AdminEntityCreate2
  ): PromiseResult<AdminEntity2, ErrorType.BadRequest> => {
    const newEntity: AdminEntity2 = {
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
    entity: AdminEntityUpdate2
  ): PromiseResult<AdminEntity2, ErrorType.BadRequest | ErrorType.NotFound> => {
    const previousVersion = context.server.getEntity(entity.id);
    if (!previousVersion) {
      return notOk.NotFound('No such entity');
    }

    let name = previousVersion.info.name;
    if (entity.info?.name && entity.info.name !== name) {
      name = context.server.getUniqueName(entity.id, entity.info.name);
    }
    const newEntity: AdminEntity2 = {
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
