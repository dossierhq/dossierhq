import type {
  AdminEntity,
  EntityHistory,
  PublishingHistory,
  PublishingResult,
  Schema,
} from '@datadata/core';
import { EntityPublishState, PublishingEventKind } from '@datadata/core';
import type { JsonInMemoryEntity } from '.';
import type { InMemoryEntity, InMemoryEntityVersion } from './InMemoryServer';

export class InMemoryServerInner {
  schema: Schema;
  #entities: InMemoryEntity[] = [];

  constructor(schema: Schema) {
    this.schema = schema;
  }

  loadEntities(entities: JsonInMemoryEntity[]): void {
    const clone: JsonInMemoryEntity[] = JSON.parse(JSON.stringify(entities));
    this.#entities = clone.map(
      ({ id, type, name, versions, publishedVersion, archived, history, publishEvents }) => ({
        id,
        type,
        name,
        versions,
        publishedVersion,
        archived,
        history: history.map(({ version, createdBy, createdAt }) => ({
          version,
          createdBy,
          createdAt: new Date(createdAt),
        })),
        publishEvents: publishEvents.map(({ kind, version, publishedBy, publishedAt }) => ({
          kind,
          version,
          publishedBy,
          publishedAt: new Date(publishedAt),
        })),
      })
    );
  }

  getEntity(id: string, version?: number | null): AdminEntity | null {
    const fullEntity = this.getFullEntity(id);
    if (!fullEntity) {
      return null;
    }

    const entityVersion =
      typeof version === 'number'
        ? fullEntity.versions.find((it) => it._version === version) ?? null
        : this.findLatestVersion(fullEntity.versions);

    if (!entityVersion) {
      return null;
    }

    return this.convertToAdminEntity(fullEntity, entityVersion);
  }

  private convertToAdminEntity(
    entity: InMemoryEntity,
    entityVersion: InMemoryEntityVersion
  ): AdminEntity {
    const { _version: version, ...fields } = entityVersion;
    return {
      id: entity.id,
      info: {
        type: entity.type,
        name: entity.name,
        version,
        publishingState: this.getEntityPublishState(entity),
      },
      fields,
    };
  }

  getEntityHistory(id: string): EntityHistory | null {
    const fullEntity = this.getFullEntity(id);
    if (!fullEntity) {
      return null;
    }
    const result: EntityHistory = {
      id,
      versions: fullEntity.history.map((item) => {
        return {
          version: item.version,
          createdBy: item.createdBy,
          createdAt: item.createdAt,
          published: fullEntity.publishedVersion === item.version,
        };
      }),
    };
    return result;
  }

  getPublishingHistory(id: string): PublishingHistory | null {
    const fullEntity = this.getFullEntity(id);
    if (!fullEntity) {
      return null;
    }
    const result: PublishingHistory = { id, events: fullEntity.publishEvents };
    return result;
  }

  getLatestEntities(): AdminEntity[] {
    return this.#entities.map((entity) =>
      this.convertToAdminEntity(entity, this.findLatestVersion(entity.versions))
    );
  }

  getUniqueName(id: string | null, name: string): string {
    const entityWithSameName = this.#entities.find((it) => it.name === name);
    if (!entityWithSameName || entityWithSameName.id === id) {
      return name;
    }
    return `${name}#${Math.random().toFixed(8).slice(2)}`;
  }

  addNewEntity(entity: AdminEntity, userId: string): void {
    const {
      id,
      info: { type, name, version },
      fields,
    } = entity;
    const entityVersion: InMemoryEntityVersion = {
      _version: version,
      ...fields,
    };
    this.#entities.push({
      id,
      type,
      name,
      archived: false,
      versions: [entityVersion],
      history: [{ version: 0, createdAt: new Date(), createdBy: userId }],
      publishEvents: [],
    });
  }

  addUpdatedEntity(entity: AdminEntity, userId: string): void {
    const fullEntity = this.getFullEntity(entity.id);
    if (!fullEntity) {
      throw new Error(`Can't find ${entity.id}`);
    }
    const {
      info: { name, version },
      fields,
    } = entity;
    const entityVersion: InMemoryEntityVersion = { _version: version, ...fields };
    fullEntity.name = name;
    fullEntity.versions.push(entityVersion);

    fullEntity.history.push({
      version: entity.info.version,
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
    fullEntity.archived = false;
    this.addPublishingEvent(
      fullEntity,
      version === null ? PublishingEventKind.Unpublish : PublishingEventKind.Publish,
      version,
      userId
    );
  }

  archiveEntity(id: string, userId: string): void {
    const fullEntity = this.getFullEntity(id);
    if (!fullEntity) {
      throw new Error(`Can't find ${id}`);
    }
    fullEntity.publishedVersion = null;
    fullEntity.archived = true;
    this.addPublishingEvent(fullEntity, PublishingEventKind.Archive, null, userId);
  }

  unarchiveEntity(id: string, userId: string): PublishingResult {
    const fullEntity = this.getFullEntity(id);
    if (!fullEntity) {
      throw new Error(`Can't find ${id}`);
    }
    fullEntity.archived = false;
    this.addPublishingEvent(fullEntity, PublishingEventKind.Unarchive, null, userId);
    return { id, publishState: this.getEntityPublishState(fullEntity) };
  }

  private addPublishingEvent(
    entity: InMemoryEntity,
    kind: PublishingEventKind,
    version: number | null,
    userId: string
  ) {
    entity.publishEvents.push({
      kind,
      version,
      publishedAt: new Date(),
      publishedBy: userId,
    });
  }

  private findLatestVersion(versions: InMemoryEntityVersion[]): InMemoryEntityVersion {
    const maxVersion = versions.reduce((max, entity) => Math.max(max, entity._version), 0);
    const version = versions.find((entity) => entity._version === maxVersion);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return version!;
  }

  private getFullEntity(id: string) {
    return this.#entities.find((it) => it.id === id);
  }

  private getEntityPublishState(entity: InMemoryEntity): EntityPublishState {
    let state: EntityPublishState;
    const { archived, publishedVersion } = entity;
    if (archived) {
      state = EntityPublishState.Archived;
    } else if (typeof publishedVersion === 'number') {
      const laterVersionsThanPublished = entity.versions.some(
        (it) => it._version > publishedVersion
      );
      state = laterVersionsThanPublished
        ? EntityPublishState.Modified
        : EntityPublishState.Published;
    } else {
      const hasPublished = entity.publishEvents.some(
        (it) => it.kind === PublishingEventKind.Publish
      );
      state = hasPublished ? EntityPublishState.Withdrawn : EntityPublishState.Draft;
    }
    return state;
  }
}
