import type { AdminClient } from '@datadata/core';
import { createInMemoryAdminClient, InMemoryAdmin, InMemoryServer } from '@datadata/testing-utils';
import type { InMemorySessionContext } from '@datadata/testing-utils';
import { v4 as uuidv4 } from 'uuid';
import type { DataDataContextAdapter } from '..';
import { DataDataContextValue } from '..';
import { entitiesFixture } from './EntityFixtures';
import schema from '../stories/StoryboardSchema';

export function createContextValue(
  adapter?: TestContextAdapter,
  adminClient?: AdminClient
): DataDataContextValue {
  schema.validate().throwIfError();

  if (!adminClient) {
    const userId = 'adba1452-1b89-42e9-8878-d0a2becf101f';
    const server = new InMemoryServer(schema);
    server.loadEntities(entitiesFixture);

    adminClient = createInMemoryAdminClient({
      resolveContext: async () => server.createContext(userId),
    });
  }

  return new DataDataContextValue(
    adapter ?? new TestContextAdapter(),
    adminClient,
    schema,
    uuidv4()
  );
}

export function SlowInterceptor(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}

export class TestContextAdapter implements DataDataContextAdapter {
  #server: InMemoryServer;
  #context: InMemorySessionContext;
  #interceptor: (() => Promise<void>) | null;

  constructor(interceptor: (() => Promise<void>) | null = null) {
    const userId = 'adba1452-1b89-42e9-8878-d0a2becf101f';
    this.#server = new InMemoryServer(schema);
    this.#server.loadEntities(entitiesFixture);
    this.#context = this.#server.createContext(userId);
    this.#interceptor = interceptor;
  }

  getEditorJSConfig: DataDataContextAdapter['getEditorJSConfig'] = (
    _fieldSpec,
    standardBlockTools,
    standardInlineTools
  ) => {
    return { tools: standardBlockTools, inlineToolbar: standardInlineTools };
  };

  getEntity: DataDataContextAdapter['getEntity'] = async (id, version) => {
    if (this.#interceptor) await this.#interceptor();
    return await InMemoryAdmin.getEntity(this.#context, id, version);
  };

  getEntityHistory: DataDataContextAdapter['getEntityHistory'] = async (id) => {
    if (this.#interceptor) await this.#interceptor();
    return await InMemoryAdmin.getEntityHistory(this.#context, id);
  };

  getPublishingHistory: DataDataContextAdapter['getPublishingHistory'] = async (id) => {
    if (this.#interceptor) await this.#interceptor();
    return await InMemoryAdmin.getPublishingHistory(this.#context, id);
  };

  searchEntities: DataDataContextAdapter['searchEntities'] = async (query, paging) => {
    if (this.#interceptor) await this.#interceptor();
    return await InMemoryAdmin.searchEntities(this.#context, query, paging);
  };

  createEntity: DataDataContextAdapter['createEntity'] = async (entity) => {
    if (this.#interceptor) await this.#interceptor();
    return await InMemoryAdmin.createEntity(this.#context, entity);
  };

  updateEntity: DataDataContextAdapter['updateEntity'] = async (entity) => {
    if (this.#interceptor) await this.#interceptor();
    return await InMemoryAdmin.updateEntity(this.#context, entity);
  };

  publishEntities: DataDataContextAdapter['publishEntities'] = async (entities) => {
    if (this.#interceptor) await this.#interceptor();
    return await InMemoryAdmin.publishEntities(this.#context, entities);
  };

  unpublishEntities: DataDataContextAdapter['unpublishEntities'] = async (entityIds) => {
    if (this.#interceptor) await this.#interceptor();
    return await InMemoryAdmin.unpublishEntities(this.#context, entityIds);
  };

  archiveEntity: DataDataContextAdapter['archiveEntity'] = async (entityId) => {
    if (this.#interceptor) await this.#interceptor();
    return await InMemoryAdmin.archiveEntity(this.#context, entityId);
  };

  unarchiveEntity: DataDataContextAdapter['unarchiveEntity'] = async (entityId) => {
    if (this.#interceptor) await this.#interceptor();
    return await InMemoryAdmin.unarchiveEntity(this.#context, entityId);
  };
}
