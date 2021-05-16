import type { AdminEntity, EntityHistory, PublishHistory, Schema } from '@datadata/core';
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
    this.#entities = clone.map(({ versions, publishedVersion, history, publishEvents }) => ({
      versions,
      publishedVersion,
      history: history.map(({ version, createdBy, createdAt }) => ({
        version,
        createdBy,
        createdAt: new Date(createdAt),
      })),
      publishEvents: publishEvents.map(({ version, publishedBy, publishedAt }) => ({
        version,
        publishedBy,
        publishedAt: new Date(publishedAt),
      })),
    }));
  }

  getEntity(id: string, version?: number | null): AdminEntity | null {
    const fullEntity = this.getFullEntity(id);
    if (!fullEntity) {
      return null;
    }
    if (typeof version === 'number') {
      return fullEntity.versions.find((entity) => entity._version === version) ?? null;
    }
    return this.findLatestVersion(fullEntity.versions);
  }

  getEntityHistory(id: string): EntityHistory | null {
    const fullEntity = this.getFullEntity(id);
    if (!fullEntity) {
      return null;
    }
    const result: EntityHistory = {
      id,
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

  getPublishHistory(id: string): PublishHistory | null {
    const fullEntity = this.getFullEntity(id);
    if (!fullEntity) {
      return null;
    }
    const result: PublishHistory = { id, events: fullEntity.publishEvents };
    return result;
  }

  getLatestEntities(): AdminEntity[] {
    return this.#entities.map((x) => this.findLatestVersion(x.versions));
  }

  getUniqueName(id: string | null, name: string): string {
    const entityWithSameName = this.#entities.find((x) => x.versions[0]._name === name);
    if (!entityWithSameName || entityWithSameName.versions[0].id === id) {
      return name;
    }
    return `${name}#${Math.random().toFixed(8).slice(2)}`;
  }

  addNewEntity(entity: AdminEntity, userId: string): void {
    this.#entities.push({
      versions: [entity],
      history: [{ version: 0, createdAt: new Date(), createdBy: userId }],
      publishEvents: [],
    });
  }

  addUpdatedEntity(entity: AdminEntity, userId: string): void {
    const fullEntity = this.getFullEntity(entity.id);
    if (!fullEntity) {
      throw new Error(`Can't find ${entity.id}`);
    }
    fullEntity.versions.push(entity);
    fullEntity.versions.forEach((x) => (x._name = entity._name));

    fullEntity.history.push({
      version: entity._version,
      createdAt: new Date(),
      createdBy: userId,
    });
  }

  setPublishedVersion(id: string, version: number | null, userId: string): void {
    const fullEntity = this.getFullEntity(id);
    if (!fullEntity) {
      throw new Error(`Can't find ${id}`);
    }
    fullEntity.publishedVersion = version;
    fullEntity.publishEvents.push({ version, publishedAt: new Date(), publishedBy: userId });
  }

  private findLatestVersion(versions: AdminEntity[]): AdminEntity {
    const maxVersion = versions.reduce((max, entity) => Math.max(max, entity._version), 0);
    return versions.find((entity) => entity._version === maxVersion) as AdminEntity;
  }

  private getFullEntity(id: string) {
    return this.#entities.find((x) => x.versions[0].id === id);
  }
}
