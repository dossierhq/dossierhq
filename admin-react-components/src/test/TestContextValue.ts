import type { AdminQuery, Paging } from '@datadata/core';
import { createErrorResultFromError, notOk } from '@datadata/core';
import { InMemoryAdmin, InMemoryServer } from '@datadata/testing-utils';
import type { InMemorySessionContext } from '@datadata/testing-utils';
import useSWR from 'swr';
import { v4 as uuidv4 } from 'uuid';
import type { DataDataContextValue } from '..';
import { entitiesFixture } from './EntityFixtures';
import schema from '../stories/StoryboardSchema';

export default class TestContextValue implements DataDataContextValue {
  schema = schema;
  #server: InMemoryServer;
  #context: InMemorySessionContext;
  #rootKey = uuidv4();

  constructor() {
    const userId = 'adba1452-1b89-42e9-8878-d0a2becf101f';
    this.#server = new InMemoryServer(schema);
    this.#server.loadEntities(entitiesFixture);
    this.#context = this.#server.createContext(userId);
  }

  useEntity: DataDataContextValue['useEntity'] = (id, options) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error } = useSWR(
      id ? [this.#rootKey, id, options.version] : null,
      this.useEntityFetcher
    );

    const entityError = error ? createErrorResultFromError(error) : undefined;
    return { entity: data, entityError };
  };

  private useEntityFetcher = async (unusedRootKey: string, id: string, version: number | null) => {
    const result = await InMemoryAdmin.getEntity(this.#context, id, { version });
    if (result.isOk()) {
      return result.value;
    }
    throw result.toError();
  };

  useEntityHistory: DataDataContextValue['useEntityHistory'] = (id) => {
    if (!id) {
      return {};
    }
    return { entityHistoryError: notOk.Generic('Not yet implemented') };
    //TODO implement
  };

  useSearchEntities: DataDataContextValue['useSearchEntities'] = (query, paging) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, error } = useSWR(
      query ? [this.#rootKey, JSON.stringify({ query, paging })] : null,
      this.useSearchEntitiesFetcher
    );
    const connectionError = error ? createErrorResultFromError(error) : undefined;
    return { connection: data, connectionError };
  };

  private useSearchEntitiesFetcher = async (unusedRootKey: string, json: string) => {
    const { query, paging }: { query: AdminQuery; paging: Paging | undefined } = JSON.parse(json);
    const result = await InMemoryAdmin.searchEntities(this.#context, query, paging);
    if (result.isOk()) {
      return result.value;
    }
    throw result.toError();
  };

  createEntity: DataDataContextValue['createEntity'] = async (entity, options) => {
    return InMemoryAdmin.createEntity(this.#context, entity, options);
  };

  updateEntity: DataDataContextValue['updateEntity'] = async (entity, options) => {
    return InMemoryAdmin.updateEntity(this.#context, entity, options);
  };
}
