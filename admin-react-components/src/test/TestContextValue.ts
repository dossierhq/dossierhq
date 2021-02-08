import type { AdminEntity, ErrorType, PromiseResult } from '@datadata/core';
import { notOk, ok } from '@datadata/core';
import type { DataDataContextValue } from '..';
import { cloneFixture } from './EntityFixtures';
import schema from '../stories/StoryboardSchema';

export default class TestContextValue implements DataDataContextValue {
  schema = schema;
  #entities = cloneFixture();

  findEntity(id: string, version?: number | null): AdminEntity | null {
    const versions = this.#entities.find((x) => x[0].id === id);
    if (!versions) {
      return null;
    }
    if (typeof version === 'number') {
      return versions.find((entity) => entity._version === version) ?? null;
    }
    return this.findLatestVersion(versions);
  }

  findLatestVersion(versions: AdminEntity[]): AdminEntity {
    const maxVersion = versions.reduce((max, entity) => Math.max(max, entity._version), 0);
    return versions.find((entity) => entity._version === maxVersion) as AdminEntity;
  }

  getLatestEntities(): AdminEntity[] {
    return this.#entities.map(this.findLatestVersion);
  }

  useEntity = (
    id: string | undefined,
    options: { version?: number | null }
  ): { entity?: { item: AdminEntity }; entityError?: Error } => {
    if (!id) return {};
    const entity = this.findEntity(id, options.version);
    if (entity) {
      return { entity: { item: entity } };
    }
    return {};
  };

  getEntity = async (
    id: string,
    options: { version?: number | null }
  ): PromiseResult<{ item: AdminEntity }, ErrorType.NotFound> => {
    const entity = this.findEntity(id, options.version);
    if (entity) {
      return ok({ item: entity });
    }

    return notOk.NotFound('No such entity or version');
  };

  useSearchEntities: DataDataContextValue['useSearchEntities'] = (query, paging) => {
    const entities = this.getLatestEntities().filter((x) => {
      if (
        query?.entityTypes?.length &&
        query.entityTypes.length > 0 &&
        query.entityTypes.indexOf(x._type) < 0
      ) {
        return false;
      }
      return true;
    });
    if (entities.length === 0) {
      return { connection: null };
    }
    return {
      connection: {
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
          startCursor: entities[0].id,
          endCursor: entities[entities.length - 1].id,
        },
        edges: entities.map((entity) => ({ cursor: entity.id, node: ok(entity) })),
      },
    };
  };
}
