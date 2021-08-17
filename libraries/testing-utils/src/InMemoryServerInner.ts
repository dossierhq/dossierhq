import type {
  AdminEntity,
  EntityHistory,
  EntityReference,
  EntityVersionReference,
  ErrorType,
  PublishingHistory,
  PublishingResult,
  Result,
  Schema,
} from '@jonasb/datadata-core';
import {
  assertIsDefined,
  EntityPublishState,
  notOk,
  ok,
  PublishingEventKind,
} from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
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
      ({ id, type, name, versions, publishedVersion, archived, history, publishEvents }) => {
        const placeholderInstant = Temporal.Now.instant();
        const converted: InMemoryEntity = {
          id,
          type,
          name,
          versions,
          createdAt: placeholderInstant,
          updatedAt: placeholderInstant,
          publishedVersion,
          archived,
          history: history.map(({ version, createdBy, createdAt }) => ({
            version,
            createdBy,
            createdAt: Temporal.Instant.from(createdAt),
          })),
          publishEvents: publishEvents.map(({ kind, version, publishedBy, publishedAt }) => ({
            kind,
            version,
            publishedBy,
            publishedAt: Temporal.Instant.from(publishedAt),
          })),
        };

        const createdAt = converted.history.find((it) => it.version === 0)?.createdAt;
        assertIsDefined(createdAt);
        converted.createdAt = createdAt;

        let updatedAt = converted.history.reduce(
          (max, it) => (Temporal.Instant.compare(it.createdAt, max) > 0 ? it.createdAt : max),
          createdAt
        );
        updatedAt = converted.publishEvents.reduce(
          (max, it) => (Temporal.Instant.compare(it.publishedAt, max) > 0 ? it.publishedAt : max),
          updatedAt
        );
        converted.updatedAt = updatedAt;

        return converted;
      }
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
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
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
      createdAt: entity.info.createdAt,
      updatedAt: entity.info.updatedAt,
      archived: false,
      versions: [entityVersion],
      history: [{ version: 0, createdAt: entity.info.createdAt, createdBy: userId }],
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
      createdAt: Temporal.Now.instant(),
      createdBy: userId,
    });
  }

  publishEntities(
    entities: EntityVersionReference[],
    userId: string
  ): Result<PublishingResult[], ErrorType.BadRequest | ErrorType.NotFound> {
    const fullEntities: InMemoryEntity[] = [];
    for (const entity of entities) {
      const fullEntity = this.getFullEntity(entity.id);
      if (!fullEntity) {
        return notOk.NotFound('No such entity');
      }
      fullEntities.push(fullEntity);
    }

    const updatedAt = Temporal.Now.instant();
    for (const entity of entities) {
      this.setPublishedVersion(entity, userId, updatedAt);
    }

    return ok(
      fullEntities.map((fullEntity) => ({
        id: fullEntity.id,
        updatedAt: fullEntity.updatedAt,
        publishState: this.getEntityPublishState(fullEntity),
      }))
    );
  }

  unpublishEntities(
    entities: EntityReference[],
    userId: string
  ): Result<PublishingResult[], ErrorType.BadRequest | ErrorType.NotFound> {
    const fullEntities: InMemoryEntity[] = [];
    for (const entity of entities) {
      const fullEntity = this.getFullEntity(entity.id);
      if (!fullEntity) {
        return notOk.NotFound('No such entity');
      }
      fullEntities.push(fullEntity);
    }

    const updatedAt = Temporal.Now.instant();
    for (const entity of entities) {
      this.setPublishedVersion(entity, userId, updatedAt);
    }

    return ok(
      fullEntities.map((fullEntity) => ({
        id: fullEntity.id,
        updatedAt: fullEntity.updatedAt,
        publishState: this.getEntityPublishState(fullEntity),
      }))
    );
  }

  setPublishedVersion(
    entity: EntityVersionReference | EntityReference,
    userId: string,
    publishedAt: Temporal.Instant
  ): void {
    const version = 'version' in entity ? entity.version : null;

    const fullEntity = this.getFullEntity(entity.id);
    if (!fullEntity) {
      throw new Error(`Can't find ${entity.id}`);
    }
    fullEntity.updatedAt = publishedAt;
    fullEntity.publishedVersion = version;
    fullEntity.archived = false;
    this.addPublishingEvent(
      fullEntity,
      version === null ? PublishingEventKind.Unpublish : PublishingEventKind.Publish,
      version,
      userId,
      publishedAt
    );
  }

  archiveEntity(id: string, userId: string): Result<PublishingResult, ErrorType.NotFound> {
    const fullEntity = this.getFullEntity(id);
    if (!fullEntity) {
      return notOk.NotFound('No such entity');
    }
    const publishedAt = Temporal.Now.instant();
    fullEntity.publishedVersion = null;
    fullEntity.archived = true;
    fullEntity.updatedAt = publishedAt;
    this.addPublishingEvent(fullEntity, PublishingEventKind.Archive, null, userId, publishedAt);
    return ok({ id, updatedAt: publishedAt, publishState: this.getEntityPublishState(fullEntity) });
  }

  unarchiveEntity(id: string, userId: string): Result<PublishingResult, ErrorType.NotFound> {
    const fullEntity = this.getFullEntity(id);
    if (!fullEntity) {
      return notOk.NotFound('No such entity');
    }
    const publishedAt = Temporal.Now.instant();
    fullEntity.archived = false;
    fullEntity.updatedAt = publishedAt;
    this.addPublishingEvent(fullEntity, PublishingEventKind.Unarchive, null, userId, publishedAt);
    return ok({ id, updatedAt: publishedAt, publishState: this.getEntityPublishState(fullEntity) });
  }

  private addPublishingEvent(
    entity: InMemoryEntity,
    kind: PublishingEventKind,
    version: number | null,
    userId: string,
    publishedAt: Temporal.Instant
  ) {
    entity.publishEvents.push({
      kind,
      version,
      publishedAt,
      publishedBy: userId,
    });
    return publishedAt;
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
