import { InMemoryAdmin, InMemoryServer } from '@datadata/testing-utils';
import type { InMemorySessionContext } from '@datadata/testing-utils';
import { v4 as uuidv4 } from 'uuid';
import type { DataDataContextAdapter } from '..';
import { DataDataContextValue } from '..';
import { entitiesFixture } from './EntityFixtures';
import schema from '../stories/StoryboardSchema';

export function createContextValue(adapter?: TestContextAdapter): DataDataContextValue {
  return new DataDataContextValue(adapter ?? new TestContextAdapter(), schema, uuidv4());
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

  getEntity: DataDataContextAdapter['getEntity'] = async (id, version) => {
    if (this.#interceptor) await this.#interceptor();
    return await InMemoryAdmin.getEntity(this.#context, id, version);
  };

  getEntityHistory: DataDataContextAdapter['getEntityHistory'] = async (id) => {
    if (this.#interceptor) await this.#interceptor();
    return await InMemoryAdmin.getEntityHistory(this.#context, id);
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
}
