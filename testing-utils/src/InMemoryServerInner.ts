import type { AdminEntity, AdminEntityHistory, Schema } from '@datadata/core';
import type { JsonInMemoryEntity } from '.';
import type { InMemoryEntity } from './InMemoryServer';

export class InMemoryServerInner {
  schema: Schema;
  #entities: InMemoryEntity[] = [];

  constructor(schema: Schema) {
    this.schema = schema;
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

  getEntityHistory(id: string): AdminEntityHistory | null {
    const fullEntity = this.#entities.find((x) => x.versions[0].id === id);
    if (!fullEntity) {
      return null;
    }
    const result: AdminEntityHistory = {
      id,
      type: fullEntity.versions[0]._type,
      name: fullEntity.versions[0]._name,
      versions: fullEntity.history.map((item) => {
        const entity = fullEntity.versions.find((x) => x._version === item.version);
        return {
          version: item.version,
          createdBy: item.createdBy,
          createdAt: item.createdAt,
          deleted: !!entity?._deleted,
          published: fullEntity.publishedVersion === item.version,
        };
      }),
    };
    return result;
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
