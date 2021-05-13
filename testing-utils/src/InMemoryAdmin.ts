import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityHistory,
  AdminEntityUpdate,
  AdminQuery,
  Connection,
  Edge,
  ErrorType,
  Location,
  Paging,
  PromiseResult,
  PublishHistory,
} from '@datadata/core';
import { isLocationItemField, notOk, ok, visitItemRecursively } from '@datadata/core';
import { v4 as uuidv4 } from 'uuid';
import type { InMemorySessionContext } from '.';

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

  getEntityHistory: async (
    context: InMemorySessionContext,
    id: string
  ): PromiseResult<AdminEntityHistory, ErrorType.NotFound> => {
    const history = context.server.getEntityHistory(id);
    if (!history) {
      return notOk.NotFound('No such entity');
    }
    return ok(history);
  },

  getPublishHistory: async (
    context: InMemorySessionContext,
    id: string
  ): PromiseResult<PublishHistory, ErrorType.NotFound> => {
    const history = context.server.getPublishHistory(id);
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
        query.entityTypes.indexOf(entity._type) < 0
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

  createEntity: async (
    context: InMemorySessionContext,
    entity: AdminEntityCreate
  ): PromiseResult<AdminEntity, ErrorType.BadRequest> => {
    const newEntity = {
      ...entity,
      id: entity.id ?? uuidv4(),
      _version: 0,
      _name: context.server.getUniqueName(null, entity._name),
    };
    context.server.addNewEntity(newEntity, context.userId);
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
    const newEntity = {
      ...previousVersion,
      ...entity,
      _version: previousVersion._version + 1,
    };
    newEntity._name = context.server.getUniqueName(entity.id, newEntity._name);
    context.server.addUpdatedEntity(newEntity, context.userId);
    return ok(newEntity);
  },

  publishEntity: async (
    context: InMemorySessionContext,
    id: string,
    version: number
  ): PromiseResult<void, ErrorType.BadRequest | ErrorType.NotFound> => {
    const entityResult = context.server.getEntity(id, version);
    if (!entityResult) {
      return notOk.NotFound('No such entity or version');
    }

    context.server.setPublishedVersion(id, version, context.userId);

    return ok(undefined);
  },
};
