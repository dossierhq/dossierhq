import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  AdminQuery,
  Connection,
  Edge,
  ErrorType,
  Location,
  Paging,
  PromiseResult,
  Schema,
} from '@datadata/core';
import { isLocationItemField, notOk, ok, visitFieldsRecursively } from '@datadata/core';
import { v4 as uuidv4 } from 'uuid';

interface InMemoryEntity {
  versions: AdminEntity[];
  publishedVersion?: number;
  history: { version: number; createdBy: string; createdAt: Date }[];
}

export interface JsonInMemoryEntity extends Omit<InMemoryEntity, 'history'> {
  history: { version: number; createdBy: string; createdAt: string }[];
}

export interface InMemorySessionContext {
  server: InMemoryServer;
  userId: string;
}

export class InMemoryServer {
  schema: Schema;
  #entities: InMemoryEntity[] = [];

  constructor(schema: Schema) {
    this.schema = schema;
  }

  createContext(userId: string): InMemorySessionContext {
    return { server: this, userId };
  }

  loadEntities(entities: JsonInMemoryEntity[]): void {
    const clone: JsonInMemoryEntity[] = JSON.parse(JSON.stringify(entities));
    this.#entities = clone.map(({ versions, publishedVersion, history }) => ({
      versions,
      publishedVersion,
      history: history.map(({ version, createdBy, createdAt }) => ({
        version,
        createdBy,
        createdAt: new Date(createdAt),
      })),
    }));
  }

  getEntity(id: string, version?: number | null): AdminEntity | null {
    const fullEntity = this.#entities.find((x) => x.versions[0].id === id);
    if (!fullEntity) {
      return null;
    }
    if (typeof version === 'number') {
      return fullEntity.versions.find((entity) => entity._version === version) ?? null;
    }
    return this.findLatestVersion(fullEntity.versions);
  }

  getLatestEntities(): AdminEntity[] {
    return this.#entities.map((x) => this.findLatestVersion(x.versions));
  }

  private findLatestVersion(versions: AdminEntity[]): AdminEntity {
    const maxVersion = versions.reduce((max, entity) => Math.max(max, entity._version), 0);
    return versions.find((entity) => entity._version === maxVersion) as AdminEntity;
  }

  addNewEntity(entity: AdminEntity, userId: string): void {
    this.#entities.push({
      versions: [entity],
      history: [{ version: 0, createdAt: new Date(), createdBy: userId }],
    });
  }

  addUpdatedEntity(entity: AdminEntity, userId: string): void {
    const fullEntity = this.#entities.find((x) => x.versions[0].id === entity.id);
    if (!fullEntity) {
      throw new Error(`Can't find ${entity.id}`);
    }
    fullEntity.versions.push(entity);
    fullEntity.history.push({
      version: entity._version,
      createdAt: new Date(),
      createdBy: userId,
    });
  }
}

export const InMemoryAdmin = {
  getEntity: async (
    context: InMemorySessionContext,
    id: string,
    options: { version?: number | null }
  ): PromiseResult<{ item: AdminEntity }, ErrorType.NotFound> => {
    const item = context.server.getEntity(id, options.version);
    if (item) {
      return ok({ item });
    }
    return notOk.NotFound('No such entity or version');
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
        visitFieldsRecursively({
          schema: context.server.schema,
          entity,
          visitField: (path, fieldSpec, data, unusedVisitContext) => {
            if (isLocationItemField(fieldSpec, data) && data) {
              locations.push(data);
            }
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
    entity: AdminEntityCreate,
    options: { publish: boolean }
  ): PromiseResult<AdminEntity, ErrorType.BadRequest> => {
    const newEntity = { ...entity, id: uuidv4(), _version: 0 };
    context.server.addNewEntity(newEntity, context.userId);
    return ok(newEntity);
  },

  updateEntity: async (
    context: InMemorySessionContext,
    entity: AdminEntityUpdate,
    options: { publish: boolean }
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
    context.server.addUpdatedEntity(newEntity, context.userId);
    return ok(newEntity);
  },
};
